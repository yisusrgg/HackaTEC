import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ModalConfiguracion({ isOpen, onClose, onConfirm }) {
  // Guardamos TODOS los operadores que vienen del backend
  const [todosLosOperadores, setTodosLosOperadores] = useState([]);
  
  const [datos, setDatos] = useState({ 
    proceso: 'Rollo', 
    lote: '', 
    cantidad: '', 
    operadorId: '' 
  });

  // 1. Cargar todos los operadores al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetch(`${API_BASE}/api/operadores/`)
        .then(res => res.json())
        .then(data => {
          setTodosLosOperadores(data);
        })
        .catch(err => console.error("Error al cargar operadores:", err));
    }
  }, [isOpen]);

  // 2. Filtramos los operadores en tiempo real según el proceso seleccionado
  // Usamos toLowerCase() por si en Django lo escribieron como "rollo" o "Rollo"
  const operadoresFiltrados = todosLosOperadores.filter(
    op => op.proceso.toLowerCase() === datos.proceso.toLowerCase()
  );

  // 3. Efecto para auto-seleccionar el primer operador válido cuando cambias de proceso
  useEffect(() => {
    if (operadoresFiltrados.length > 0) {
      // Verificamos si el operador actualmente seleccionado pertenece a este proceso
      const esOperadorValido = operadoresFiltrados.some(op => op.id === parseInt(datos.operadorId));
      
      // Si no es válido (o está vacío), seleccionamos el primero de la lista filtrada automáticamente
      if (!esOperadorValido) {
        setDatos(prev => ({ ...prev, operadorId: operadoresFiltrados[0].id }));
      }
    } else {
      // Si este proceso no tiene operadores, vaciamos el ID
      setDatos(prev => ({ ...prev, operadorId: '' }));
    }
  }, [datos.proceso, todosLosOperadores]); // Se ejecuta cuando cambia el proceso o terminan de cargar los datos

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const operadorSeleccionado = todosLosOperadores.find(op => op.id === parseInt(datos.operadorId));
    
    onConfirm({
      ...datos,
      encargadoNombre: operadorSeleccionado ? operadorSeleccionado.nombre : 'Operador'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 flex justify-between items-start">
          <div>
            <h2 className="text-white font-bold text-lg">Nuevo Proceso</h2>
            <p className="text-indigo-200 text-sm mt-0.5">Configure los datos antes de iniciar</p>
          </div>
          <button onClick={onClose} className="text-indigo-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Proceso</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 outline-none"
              value={datos.proceso}
              onChange={(e) => setDatos({ ...datos, proceso: e.target.value })}
            >
              <option value="Rollo">Rollo</option>
              <option value="Corte">Corte</option>
              <option value="Terminado">Terminado</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Número de Lote</label>
              <input
                type="text"
                required
                placeholder="Ej: LT-2025"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:border-indigo-500 outline-none"
                onChange={(e) => setDatos({ ...datos, lote: e.target.value })}
              />
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cantidad</label>
              <input
                type="number"
                min="1"
                required
                placeholder="0"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:border-indigo-500 outline-none"
                onChange={(e) => setDatos({ ...datos, cantidad: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Operador Responsable</label>
            {operadoresFiltrados.length > 0 ? (
              <select
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 outline-none bg-white"
                value={datos.operadorId}
                onChange={(e) => setDatos({ ...datos, operadorId: e.target.value })}
              >
                {/* Ahora mapeamos SOBRE LA LISTA FILTRADA */}
                {operadoresFiltrados.map(op => (
                  <option key={op.id} value={op.id}>{op.nombre}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">
                No hay operadores registrados para el proceso de {datos.proceso}.
              </p>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancelar</button>
            <button 
              type="submit" 
              disabled={operadoresFiltrados.length === 0 || !datos.operadorId} 
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Iniciar Proceso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalConfiguracion;