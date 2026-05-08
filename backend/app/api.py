from rest_framework import serializers, viewsets, routers

from .models import Operador, Lote, Validacion


class OperadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Operador
        fields = "__all__"


class LoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lote
        fields = "__all__"


class ValidacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Validacion
        fields = "__all__"


class OperadorViewSet(viewsets.ModelViewSet):
    queryset = Operador.objects.all()
    serializer_class = OperadorSerializer


class LoteViewSet(viewsets.ModelViewSet):
    queryset = Lote.objects.select_related("operador").all()
    serializer_class = LoteSerializer


class ValidacionViewSet(viewsets.ModelViewSet):
    queryset = Validacion.objects.select_related("lote", "operador").all()
    serializer_class = ValidacionSerializer


router = routers.DefaultRouter()
router.register(r"operadores", OperadorViewSet, basename="operador")
router.register(r"lotes", LoteViewSet, basename="lote")
router.register(r"validaciones", ValidacionViewSet, basename="validacion")
