from django.contrib import admin

from .models import Lote, Operador, Validacion


@admin.register(Operador)
class OperadorAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'proceso')
    search_fields = ('nombre', 'proceso')


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'descripcion', 'cantidad_lote', 'operador', 'fecha_creacion')
    list_filter = ('operador',)
    search_fields = ('descripcion',)


@admin.register(Validacion)
class ValidacionAdmin(admin.ModelAdmin):
    list_display = ('id', 'lote', 'operador', 'defectos', 'sin_defectos', 'fecha')
    list_filter = ('operador', 'lote')
    readonly_fields = ('fecha',)
