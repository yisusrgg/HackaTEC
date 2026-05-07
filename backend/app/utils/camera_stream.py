"""Streaming camera with YOLO detections as MJPEG."""

import cv2
import time
from .predict_ensemble import draw_overlay, load_models, predict_ensemble


class CameraStream:
    """Manages a live camera stream with YOLO detections."""

    def __init__(self, source='0', width=640, height=360, process_every_n=4):
        self.source = source
        self.width = width
        self.height = height
        self.process_every_n = max(1, int(process_every_n))
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
                preprocess=False,
                imgsz=320,
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


def generate_mjpeg_stream(camera_stream):
    """Generate MJPEG stream frames.
    
    Yields bytes for MJPEG protocol:
        --frame
        Content-Type: image/jpeg
        Content-Length: <size>
        
        <jpeg_data>
    """
    try:
        while True:
            frame = camera_stream.get_frame()
            if frame is None:
                break

            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 72])
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
