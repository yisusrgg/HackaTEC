import React from 'react';

const Metric = ({ label, value, color, icon }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color.bg}`}>
        {icon}
      </div>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
    <span className={`text-sm font-bold ${color.text}`}>{value}</span>
  </div>
);

// RECIBIMOS LA PROP datos AQUÍ
function Estadisticas({ activo, datos }) {
  // Extraemos variables seguras (si es null usamos 0)
  const aprobadas = datos?.sin_defectos || 0;
  const rechazadas = datos?.defectos || 0;
  const total = aprobadas + rechazadas;
  
  // Calculamos la tasa (evitando dividir por 0)
  const tasa = total > 0 ? ((aprobadas / total) * 100).toFixed(1) : '0.0';

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 ${!activo ? 'opacity-50' : ''}`}>
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-600">Producción del Turno</h3>
      </div>

      <div className="px-4 py-1">
        <Metric
          label="Aprobadas"
          value={activo ? aprobadas : '—'}
          color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          }
        />
        <Metric
          label="Rechazadas"
          value={activo ? rechazadas : '—'}
          color={{ bg: 'bg-rose-50', text: 'text-rose-600' }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          }
        />
        <Metric
          label="Tasa de aprobación"
          value={activo ? `${tasa}%` : '—'}
          color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          }
        />
        <Metric
          label="Piezas inspeccionadas"
          value={activo ? total : '—'}
          color={{ bg: 'bg-slate-100', text: 'text-slate-600' }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>
          }
        />
      </div>

      {!activo && (
        <div className="px-4 pb-3">
          <p className="text-xs text-slate-400 text-center italic">Proceso detenido</p>
        </div>
      )}
    </div>
  );
}

export default Estadisticas;