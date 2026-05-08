from django.db import models


class Operador(models.Model):
    nombre = models.CharField(max_length=150)
    proceso = models.CharField(max_length=100)

    class Meta:
        db_table = 'operadores'

    def __str__(self):
        return self.nombre


class Lote(models.Model):
    descripcion = models.TextField()
    cantidad_lote = models.PositiveIntegerField()
    operador = models.ForeignKey(
        Operador,
        on_delete=models.PROTECT,
        related_name='lotes',
        db_column='id_operador',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lotes'

    def __str__(self):
        return f'Lote #{self.pk} — {self.descripcion[:40]}'


class Validacion(models.Model):
    defectos = models.PositiveIntegerField(
        default=0,
        help_text='Cantidad de piezas con defecto en este análisis',
    )
    sin_defectos = models.PositiveIntegerField(
        default=0,
        help_text='Cantidad de piezas sin defecto en este análisis',
    )
    tipo_defectos = models.JSONField(
        default=list,
        help_text='Lista de nombres de defectos detectados, ej: ["hole", "Crease"]',
    )
    lote = models.ForeignKey(
        Lote,
        on_delete=models.CASCADE,
        related_name='validaciones',
        db_column='id_lote',
    )
    operador = models.ForeignKey(
        Operador,
        on_delete=models.PROTECT,
        related_name='validaciones',
        db_column='id_operador',
    )
    fecha = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp de la validación, usado para reportes',
    )

    class Meta:
        db_table = 'validaciones'

    def __str__(self):
        return f'Validacion #{self.pk} — Lote {self.lote_id} ({self.fecha:%Y-%m-%d %H:%M})'
