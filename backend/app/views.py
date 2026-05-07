from django.shortcuts import render
from django.views import View
from .models import User, Prenda

# Create your views here.

class LoginView(View):
    def get(self, request):
        return render(request, 'login.html')

    def post(self, request):
        # Aquí iría la lógica para autenticar al usuario
        return render(request, 'dashboard.html')
    