from typing import Any, Dict

from .models import Operador, Lote, Validacion


def serialize_operador(obj: Operador) -> Dict[str, Any]:
    return {"id": obj.pk, "nombre": obj.nombre, "proceso": obj.proceso}


def serialize_lote(obj: Lote) -> Dict[str, Any]:
    return {
        "id": obj.pk,
        "descripcion": obj.descripcion,
        "cantidad_lote": obj.cantidad_lote,
        "operador": serialize_operador(obj.operador),
        "fecha_creacion": obj.fecha_creacion.isoformat(),
    }


def serialize_validacion(obj: Validacion) -> Dict[str, Any]:
    return {
        "id_validacion": obj.pk,
        "defectos": obj.defectos,
        "sin_defectos": obj.sin_defectos,
        "tipo_defectos": obj.tipo_defectos,
        "lote": {
            "id": obj.lote_id,
            "descripcion": obj.lote.descripcion,
            "cantidad_lote": obj.lote.cantidad_lote,
        },
        "operador": {
            "id": obj.operador_id,
            "nombre": obj.operador.nombre,
            "proceso": obj.operador.proceso,
        },
        "fecha": obj.fecha.isoformat(),
    }
