import React from 'react';

function ModalConfiguracion({ isOpen, onClose, onConfirm }) {
  const [datos, setDatos] = React.useState({ proceso: 'Rollo', lote: '', encargado: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(datos);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 flex justify-between items-start">
          <div>
            <h2 className="text-white font-bold text-lg">Nuevo Proceso</h2>
            <p className="text-indigo-200 text-sm mt-0.5">Configure los datos antes de iniciar</p>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Tipo de Proceso
            </label>
            <select
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
              value={datos.proceso}
              onChange={(e) => setDatos({ ...datos, proceso: e.target.value })}
            >
              <option value="Rollo">Rollo</option>
              <option value="Corte">Corte</option>
              <option value="Embalaje">Embalaje</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Número de Lote
            </label>
            <input
              type="text"
              required
              placeholder="Ej: LT-2025-001"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              onChange={(e) => setDatos({ ...datos, lote: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Operador Responsable
            </label>
            <input
              type="text"
              required
              placeholder="Nombre completo"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              onChange={(e) => setDatos({ ...datos, encargado: e.target.value })}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all"
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
