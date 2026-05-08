"""Streaming camera with YOLO detections as MJPEG."""

import cv2
import time
from .predict_ensemble import MODEL_DEVICE, draw_overlay, load_models, predict_ensemble
from ..models import Validacion


class CameraStream:
    """Manages a live camera stream with YOLO detections."""

    def __init__(self, source='0', width=None, height=None, process_every_n=None):
        self.source = source
        is_cuda = str(MODEL_DEVICE).startswith('cuda')
        self.width = width or (1280 if is_cuda else 960)
        self.height = height or (720 if is_cuda else 540)
        self.process_every_n = max(1, int(process_every_n or (1 if is_cuda else 2)))
        self.cap = None
        self.models_loaded = False
        self.fps_times = []
        self.frame_index = 0
        self.last_detections = []

    def initialize(self):
        """Load models and open camera."""
        if not self.models_loaded:
            load_models()
            self.models_loaded = True

        if str(self.source).isdigit():
            self.cap = cv2.VideoCapture(int(self.source))
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)

            if not self.cap.isOpened():
                raise RuntimeError(f'No se pudo abrir la camara {self.source}')
        else:
            raise RuntimeError(f'Fuente {self.source} no soportada para streaming')

    def get_frame(self):
        """Capture and process a single frame with YOLO detection."""
        if self.cap is None:
            return None

        ret, frame = self.cap.read()
        if not ret:
            return None

        # Reducir costo: inferir solo cada N frames y reutilizar la última detección
        self.frame_index += 1
        t0 = time.perf_counter()
        detections = self.last_detections
        if self.frame_index % self.process_every_n == 0 or not self.last_detections:
            detections = predict_ensemble(
                frame,
                model_names=("small",),
                preprocess=True,
                imgsz=640 if str(MODEL_DEVICE).startswith('cuda') else 512,
            )
            self.last_detections = detections
        dt = time.perf_counter() - t0

        # Calculate FPS
        self.fps_times.append(dt)
        if len(self.fps_times) > 30:
            self.fps_times.pop(0)

        fps = 1.0 / (sum(self.fps_times) / len(self.fps_times)) if self.fps_times else 0.0

        # Draw detections
        out_frame = draw_overlay(frame, detections)
        cv2.putText(
            out_frame,
            f'{fps:.1f} FPS | {dt * 1000:.0f}ms',
            (10, 65),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (200, 200, 200),
            1,
            cv2.LINE_AA,
        )

        return out_frame

    def close(self):
        """Release camera resources."""
        if self.cap is not None:
            self.cap.release()


def generate_mjpeg_stream(camera_stream, validation_id: int | None = None, update_interval: float = 2.0):
    last_write = 0.0
    
    try:
        while True:
            frame = camera_stream.get_frame()
            if frame is None:
                break

            # 1. Extraer los nombres de los defectos de forma segura
            class_names = []
            if camera_stream.last_detections:
                for d in camera_stream.last_detections:
                    try:
                        # Dependiendo de tu YOLO, 'd' puede ser un diccionario o un objeto
                        if isinstance(d, dict):
                            name = d.get('class_name', d.get('name', 'desconocido'))
                        else:
                            name = getattr(d, 'class_name', getattr(d, 'name', 'desconocido'))
                        class_names.append(name)
                    except Exception as e:
                        print(f"Error extrayendo nombre de defecto: {e}")

            # 2. Guardar en la Base de Datos si pasó el intervalo de tiempo
            now = time.time()
            if validation_id and class_names and (now - last_write) >= update_interval:
                try:
                    v = Validacion.objects.get(pk=validation_id)
                    
                    # Asegurarnos de que current es una lista
                    current = v.tipo_defectos if isinstance(v.tipo_defectos, list) else []
                    
                    # ACUMULAR en la lista (evitando duplicados seguidos si quieres)
                    # Si quieres todos, usa: new_list = current + class_names
                    # Para agregar solo los que no estén ya en la lista general:
                    new_list = current.copy()
                    for name in class_names:
                        if name not in new_list:
                            new_list.append(name)

                    v.tipo_defectos = new_list
                    # Actualizar conteo de defectos (basado en cuántos tipos distintos encontró)
                    v.defectos = len(new_list) 
                    v.save()
                    
                    last_write = now
                    print(f"✅ DB ACTUALIZADA | Validación #{validation_id} | Defectos: {new_list}")
                
                except Validacion.DoesNotExist:
                    print(f"❌ ERROR: Validación #{validation_id} no existe en la BD.")
                except Exception as e:
                    print(f"❌ ERROR AL GUARDAR EN DB: {e}")

            # 3. Codificar el frame a JPEG
            jpeg_quality = 85 if str(MODEL_DEVICE).startswith('cuda') else 80
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, jpeg_quality])
            if not ret:
                continue

            frame_bytes = buffer.tobytes()
            header = (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n'
                + f'Content-Length: {len(frame_bytes)}\r\n\r\n'.encode()
            )
            yield header + frame_bytes + b'\r\n'
    finally:
        camera_stream.close()