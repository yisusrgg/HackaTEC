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
    script_path = Path(settings.BASE_DIR) / "app" / "utils" / "open_camera.py"
    cmd = [sys.executable, str(script_path)]

    creationflags = 0
    if hasattr(subprocess, "CREATE_NEW_CONSOLE"):
        creationflags |= subprocess.CREATE_NEW_CONSOLE

    subprocess.Popen(cmd, cwd=str(settings.BASE_DIR), creationflags=creationflags)

    return JsonResponse({
        "ok": True,
        "started": True,
        "message": "Se abrio la camara en una ventana nativa.",
    })