import json
import subprocess
import sys
from pathlib import Path

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.views import View

from .utils import predict_ensemble


def _serialize_status():
    status = {
        "loaded": [],
        "missing": [],
        "errors": [],
        "model_paths": predict_ensemble.MODEL_PATHS,
        "expected_models": list(predict_ensemble.MODEL_PATHS.keys()),
    }

    for model_name, raw_path in predict_ensemble.MODEL_PATHS.items():
        resolved_path = Path(raw_path)
        if resolved_path.exists() and resolved_path.stat().st_size > 0:
            status["loaded"].append(model_name)
        else:
            status["missing"].append(model_name)
            status["errors"].append(f"{model_name}: no encontrado en {raw_path}")

    return status


class DebugView(View):
    def get(self, request):
        return render(request, "debug.html", {"model_status": json.dumps(_serialize_status())})


def model_status_api(request):
    return JsonResponse(_serialize_status())


def open_camera_window_api(request):
    """Launch the native OpenCV camera window in a separate Windows process."""
    # Prefer the project's virtualenv Python if present, otherwise fall back
    venv_python = Path(settings.BASE_DIR).parent / ".venv" / "Scripts" / "python.exe"
    python_exec = str(venv_python) if venv_python.exists() else sys.executable

    # Run the launcher as a module so Python imports resolve from BASE_DIR
    cmd = [python_exec, "-m", "app.utils.open_camera"]

    creationflags = 0
    if hasattr(subprocess, "CREATE_NEW_CONSOLE"):
        creationflags |= subprocess.CREATE_NEW_CONSOLE

    # Redirect stdout/stderr to a log file to capture any startup errors
    log_path = Path(settings.BASE_DIR) / "open_camera.log"
    logfile = open(str(log_path), "ab")

    subprocess.Popen(
        cmd,
        cwd=str(settings.BASE_DIR),
        creationflags=creationflags,
        stdout=logfile,
        stderr=logfile,
    )

    return JsonResponse({
        "ok": True,
        "started": True,
        "log": str(log_path),
        "message": "Se intentó abrir la cámara; revisar el log si falla.",
    })