from django.urls import path

from .views import DebugView, model_status_api, open_camera_window_api

urlpatterns = [
    path('', DebugView.as_view(), name='debug-home'),
    path('api/models/', model_status_api, name='model-status'),
    path('api/camera/open/', open_camera_window_api, name='open-camera-window'),
]