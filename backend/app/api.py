from rest_framework import serializers, viewsets, routers

from .models import Operador, Lote, Validacion


class OperadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Operador
        fields = ['id', 'nombre', 'proceso']


class LoteSerializer(serializers.ModelSerializer):
    operador = OperadorSerializer(read_only=True)
    operador_id = serializers.PrimaryKeyRelatedField(
        queryset=Operador.objects.all(), source='operador', write_only=True
    )

    class Meta:
        model = Lote
        fields = ['id', 'descripcion', 'cantidad_lote', 'operador', 'operador_id', 'fecha_creacion']


class LoteNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lote
        fields = ['id', 'descripcion', 'cantidad_lote']


class ValidacionSerializer(serializers.ModelSerializer):
    id_validacion = serializers.IntegerField(source='id', read_only=True)
    lote = LoteNestedSerializer(read_only=True)
    lote_id = serializers.PrimaryKeyRelatedField(
        queryset=Lote.objects.all(), source='lote', write_only=True
    )
    operador = OperadorSerializer(read_only=True)
    operador_id = serializers.PrimaryKeyRelatedField(
        queryset=Operador.objects.all(), source='operador', write_only=True
    )

    class Meta:
        model = Validacion
        fields = [
            'id_validacion', 'defectos', 'sin_defectos', 'tipo_defectos',
            'lote', 'lote_id', 'operador', 'operador_id', 'fecha',
        ]


class OperadorViewSet(viewsets.ModelViewSet):
    queryset = Operador.objects.all()
    serializer_class = OperadorSerializer


class LoteViewSet(viewsets.ModelViewSet):
    queryset = Lote.objects.select_related('operador').all()
    serializer_class = LoteSerializer


class ValidacionViewSet(viewsets.ModelViewSet):
    queryset = Validacion.objects.select_related('lote', 'operador').all().order_by('-fecha')
    serializer_class = ValidacionSerializer


router = routers.DefaultRouter()
router.register(r'operadores', OperadorViewSet, basename='operador')
router.register(r'lotes', LoteViewSet, basename='lote')
router.register(r'validaciones', ValidacionViewSet, basename='validacion')
