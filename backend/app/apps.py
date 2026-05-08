import logging
import os

from django.apps import AppConfig as DjangoAppConfig
from django.conf import settings

logger = logging.getLogger(__name__)


class InspectorAppConfig(DjangoAppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'

    def ready(self):
        if not getattr(settings, 'AUTOLOAD_DETECTION_MODELS', False):
            return

        if os.environ.get('RUN_MAIN') != 'true':
            return

        try:
            from .utils.predict_ensemble import load_models

            load_models()
        except Exception as exc:
            logger.warning('No se pudieron precargar los modelos de deteccion: %s', exc)
