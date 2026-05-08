import json
import subprocess
import sys
from pathlib import Path

from django.conf import settings
from django.http import JsonResponse, StreamingHttpResponse, HttpResponseNotAllowed
from django.shortcuts import render, get_object_or_404
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Operador, Lote, Validacion
from .serializers import (
    serialize_operador,
    serialize_lote,
    serialize_validacion,
)


def _get_predict_ensemble_module():
    from .utils import predict_ensemble

    return predict_ensemble


def _serialize_status():
    predict_ensemble = _get_predict_ensemble_module()
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


# --- Operador endpoints ---
@require_http_methods(["GET", "POST"])
@csrf_exempt
def operadores_list_create(request):
    if request.method == "GET":
        qs = Operador.objects.all()
        data = [serialize_operador(o) for o in qs]
        return JsonResponse(data, safe=False)

    # POST
    try:
        payload = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "Bad JSON"}, status=400)

    nombre = payload.get("nombre")
    proceso = payload.get("proceso")
    if not nombre or not proceso:
        return JsonResponse({"error": "nombre and proceso required"}, status=400)

    obj = Operador.objects.create(nombre=nombre, proceso=proceso)
    return JsonResponse(serialize_operador(obj), status=201)


@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
@csrf_exempt
def operadores_detail(request, pk):
    operador = get_object_or_404(Operador, pk=pk)
    if request.method == "GET":
        return JsonResponse(serialize_operador(operador))

    if request.method in ("PUT", "PATCH"):
        try:
            payload = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Bad JSON"}, status=400)

        nombre = payload.get("nombre")
        proceso = payload.get("proceso")
        if nombre is not None:
            operador.nombre = nombre
        if proceso is not None:
            operador.proceso = proceso
        operador.save()
        return JsonResponse(serialize_operador(operador))

    # DELETE
    operador.delete()
    return JsonResponse({"ok": True})


# --- Lote endpoints ---
@require_http_methods(["GET", "POST"])
@csrf_exempt
def lotes_list_create(request):
    if request.method == "GET":
        qs = Lote.objects.select_related("operador").all()
        data = [serialize_lote(l) for l in qs]
        return JsonResponse(data, safe=False)

    try:
        payload = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "Bad JSON"}, status=400)

    descripcion = payload.get("descripcion")
    cantidad_lote = payload.get("cantidad_lote")
    operador_id = payload.get("operador")
    if not descripcion or cantidad_lote is None or operador_id is None:
        return JsonResponse({"error": "descripcion, cantidad_lote and operador required"}, status=400)

    operador = get_object_or_404(Operador, pk=operador_id)
    obj = Lote.objects.create(descripcion=descripcion, cantidad_lote=cantidad_lote, operador=operador)
    return JsonResponse(serialize_lote(obj), status=201)


@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
@csrf_exempt
def lotes_detail(request, pk):
    lote = get_object_or_404(Lote, pk=pk)
    if request.method == "GET":
        return JsonResponse(serialize_lote(lote))

    if request.method in ("PUT", "PATCH"):
        try:
            payload = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Bad JSON"}, status=400)

        descripcion = payload.get("descripcion")
        cantidad_lote = payload.get("cantidad_lote")
        operador_id = payload.get("operador")
        if descripcion is not None:
            lote.descripcion = descripcion
        if cantidad_lote is not None:
            lote.cantidad_lote = cantidad_lote
        if operador_id is not None:
            lote.operador = get_object_or_404(Operador, pk=operador_id)
        lote.save()
        return JsonResponse(serialize_lote(lote))

    lote.delete()
    return JsonResponse({"ok": True})


# --- Validacion endpoints ---
@require_http_methods(["GET", "POST"])
@csrf_exempt
def validaciones_list_create(request):
    if request.method == "GET":
        qs = Validacion.objects.select_related("lote", "operador").all()
        data = [serialize_validacion(v) for v in qs]
        return JsonResponse(data, safe=False)

    try:
        payload = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "Bad JSON"}, status=400)

    defectos = payload.get("defectos", 0)
    sin_defectos = payload.get("sin_defectos", 0)
    tipo_defectos = payload.get("tipo_defectos", [])
    lote_id = payload.get("lote")
    operador_id = payload.get("operador")
    if lote_id is None or operador_id is None:
        return JsonResponse({"error": "lote and operador required"}, status=400)

    lote = get_object_or_404(Lote, pk=lote_id)
    operador = get_object_or_404(Operador, pk=operador_id)
    obj = Validacion.objects.create(
        defectos=defectos,
        sin_defectos=sin_defectos,
        tipo_defectos=tipo_defectos,
        lote=lote,
        operador=operador,
    )
    return JsonResponse(serialize_validacion(obj), status=201)


@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
@csrf_exempt
def validaciones_detail(request, pk):
    v = get_object_or_404(Validacion, pk=pk)
    if request.method == "GET":
        return JsonResponse(serialize_validacion(v))

    if request.method in ("PUT", "PATCH"):
        try:
            payload = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Bad JSON"}, status=400)

        if "defectos" in payload:
            v.defectos = payload["defectos"]
        if "sin_defectos" in payload:
            v.sin_defectos = payload["sin_defectos"]
        if "tipo_defectos" in payload:
            v.tipo_defectos = payload["tipo_defectos"]
        if "lote" in payload:
            v.lote = get_object_or_404(Lote, pk=payload["lote"])
        if "operador" in payload:
            v.operador = get_object_or_404(Operador, pk=payload["operador"])
        v.save()
        return JsonResponse(serialize_validacion(v))

    v.delete()
    return JsonResponse({"ok": True})


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


def camera_stream_api(request):
    """Stream live camera video with YOLO detections as MJPEG."""
    from .utils.camera_stream import CameraStream, generate_mjpeg_stream
    camera_stream = CameraStream(source='0')
    try:
        camera_stream.initialize()
    except RuntimeError as e:
        return JsonResponse({"error": str(e)}, status=500)
    # Optional validation id to record detected defect types
    validation_id = request.GET.get('v')
    try:
        validation_id = int(validation_id) if validation_id is not None else None
    except Exception:
        validation_id = None

    response = StreamingHttpResponse(
        generate_mjpeg_stream(camera_stream, validation_id=validation_id),
        content_type='multipart/x-mixed-replace; boundary=frame'
    )
    return response