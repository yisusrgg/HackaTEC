import React from 'react';

function ModalConfiguracion({ isOpen, onClose, onConfirm }) {
  const [datos, setDatos] = React.useState({
    proceso: 'Rollo',
    lote: '',
    encargado: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(datos);
  };

  return (
    // Contenedor principal con fondo traslúcido y desenfoque
    // El onClick aquí detecta el clic en el fondo
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all"
      onClick={onClose} 
    >
      {/* Contenido del Modal: detiene la propagación del click para que no se cierre al tocar el formulario */}
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="bg-blue-600 p-6 text-white relative">
          <h2 className="text-xl font-bold">Configuración de Proceso</h2>
          <p className="text-blue-100 text-sm">Ingrese los datos para iniciar el monitoreo</p>
          
          {/* Botón de cerrar opcional en la esquina */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-blue-200 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tipo de Proceso</label>
            <select 
              className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 focus:ring-0 transition-all outline-none"
              value={datos.proceso}
              onChange={(e) => setDatos({...datos, proceso: e.target.value})}
            >
              <option>Rollo</option>
              <option>Corte</option>
              <option>Embalaje</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Número de Lote</label>
            <input 
              type="text" 
              required
              placeholder="Ej: LT-2024-001"
              className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 focus:ring-0 transition-all outline-none"
              onChange={(e) => setDatos({...datos, lote: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Encargado de Supervisión</label>
            <input 
              type="text" 
              required
              placeholder="Nombre del operador"
              className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 focus:ring-0 transition-all outline-none"
              onChange={(e) => setDatos({...datos, encargado: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98] mt-4"
          >
            Confirmar e Iniciar
          </button>
        </form>
      </div>
    </div>
  );
}

export default ModalConfiguracion;