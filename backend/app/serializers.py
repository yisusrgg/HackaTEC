from typing import Any, Dict

from .models import Operador, Lote, Validacion


def serialize_operador(obj: Operador) -> Dict[str, Any]:
    return {"id": obj.pk, "nombre": obj.nombre, "proceso": obj.proceso}


def serialize_lote(obj: Lote) -> Dict[str, Any]:
    return {
        "id": obj.pk,
        "descripcion": obj.descripcion,
        "cantidad_lote": obj.cantidad_lote,
        "operador": obj.operador_id,
        "fecha_creacion": obj.fecha_creacion.isoformat(),
    }


def serialize_validacion(obj: Validacion) -> Dict[str, Any]:
    return {
        "id": obj.pk,
        "defectos": obj.defectos,
        "sin_defectos": obj.sin_defectos,
        "tipo_defectos": obj.tipo_defectos,
        "lote": obj.lote_id,
        "operador": obj.operador_id,
        "fecha": obj.fecha.isoformat(),
    }
