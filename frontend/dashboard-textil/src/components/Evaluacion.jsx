import React from 'react';

function Evaluacion({ activo }) {
  return (
    <div className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden
      ${activo ? 'border-slate-200 shadow-sm' : 'border-dashed border-slate-200 opacity-60'}`}
    >
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${activo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        <h3 className="text-sm font-semibold text-slate-600">Evaluación de Pieza</h3>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <button
          disabled={!activo}
          className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all duration-200
            ${activo
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-100 active:scale-[0.98]'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Aprobado
        </button>

        <button
          disabled={!activo}
          className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all duration-200
            ${activo
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-100 active:scale-[0.98]'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Rechazado
        </button>

        {!activo && (
          <p className="text-xs text-slate-400 text-center italic">Inicia un proceso para evaluar</p>
        )}
      </div>
    </div>
  );
}

export default Evaluacion;
