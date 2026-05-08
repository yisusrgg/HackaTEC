from django.urls import path, include

from .views import DebugView, model_status_api, open_camera_window_api, camera_stream_api
from .api import router as api_router

urlpatterns = [
    path('', DebugView.as_view(), name='debug-home'),
    path('api/models/', model_status_api, name='model-status'),
    path('api/camera/open/', open_camera_window_api, name='open-camera-window'),
    path('api/camera/stream/', camera_stream_api, name='camera-stream'),

    # DRF router for model resources
    path('api/', include(api_router.urls)),
]