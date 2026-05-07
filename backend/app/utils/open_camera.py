"""Standalone launcher for the native OpenCV camera window."""

from pathlib import Path
import sys


if __package__ is None or __package__ == '':
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from app.utils.camera_window import run_camera_window
else:
    from .camera_window import run_camera_window


def main():
    run_camera_window()


if __name__ == '__main__':
    main()