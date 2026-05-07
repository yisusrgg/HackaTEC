import time

import cv2

from .predict_ensemble import draw_overlay, load_models, predict_ensemble


def run_camera_window(source='0', conf=None, width=1280, height=720):
    """Open a native OpenCV window and stream detections until the user closes it."""
    if conf is not None:
        from . import predict_ensemble as pe

        for key in pe.CONF_THR_BY_CLASS:
            pe.CONF_THR_BY_CLASS[key] = conf

    load_models()

    if str(source).isdigit():
        return _run_webcam(int(source), width, height)
    return _run_media(str(source))


def _run_webcam(camera_index: int, width: int, height: int):
    cap = cv2.VideoCapture(camera_index)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

    if not cap.isOpened():
        raise RuntimeError(f'No se pudo abrir la camara {camera_index}')

    fps_times = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        t0 = time.perf_counter()
        detections = predict_ensemble(frame)
        dt = time.perf_counter() - t0

        fps_times.append(dt)
        if len(fps_times) > 30:
            fps_times.pop(0)

        fps = 1.0 / (sum(fps_times) / len(fps_times)) if fps_times else 0.0
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

        cv2.imshow('Inspector de Calidad - Camara', out_frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        if key == ord('s'):
            filename = f'captura_{int(time.time())}.jpg'
            cv2.imwrite(filename, out_frame)
            print(f'Guardado: {filename}')

    cap.release()
    cv2.destroyAllWindows()


def _run_media(path: str):
    img = cv2.imread(path)
    if img is None:
        raise RuntimeError(f'No se pudo abrir: {path}')

    detections = predict_ensemble(img)
    out_img = draw_overlay(img, detections)
    print(f'Detecciones: {len(detections)}')
    for det in detections:
        print(f"  {det['class_name']} - {det['confidence']:.1%} @ {det['bbox']}")

    cv2.imshow('Resultado', out_img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()