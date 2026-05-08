import React from 'react';

// Datos de ejemplo que reflejan exactamente la estructura de la BD:
// tablas: validaciones JOIN lotes JOIN operadores
const MOCK_VALIDACIONES = [
  {
    id_validacion: 1,
    fecha: '2025-05-07T08:15:00Z',
    defectos: 3,
    sin_defectos: 47,
    tipo_defectos: ['hole', 'Crease'],
    lote: { id: 1, descripcion: 'Tela denim 100m rollo A', cantidad_lote: 500 },
    operador: { id: 1, nombre: 'María López', proceso: 'Rollo' },
  },
  {
    id_validacion: 2,
    fecha: '2025-05-07T09:02:00Z',
    defectos: 0,
    sin_defectos: 60,
    tipo_defectos: [],
    lote: { id: 1, descripcion: 'Tela denim 100m rollo A', cantidad_lote: 500 },
    operador: { id: 1, nombre: 'María López', proceso: 'Rollo' },
  },
  {
    id_validacion: 3,
    fecha: '2025-05-07T10:30:00Z',
    defectos: 7,
    sin_defectos: 43,
    tipo_defectos: ['Skip-stitch', 'Snag', 'hole'],
    lote: { id: 2, descripcion: 'Tela algodón corte B2', cantidad_lote: 300 },
    operador: { id: 2, nombre: 'Carlos Ruiz', proceso: 'Corte' },
  },
  {
    id_validacion: 4,
    fecha: '2025-05-07T11:45:00Z',
    defectos: 1,
    sin_defectos: 59,
    tipo_defectos: ['Spot'],
    lote: { id: 2, descripcion: 'Tela algodón corte B2', cantidad_lote: 300 },
    operador: { id: 2, nombre: 'Carlos Ruiz', proceso: 'Corte' },
  },
  {
    id_validacion: 5,
    fecha: '2025-05-07T13:10:00Z',
    defectos: 0,
    sin_defectos: 80,
    tipo_defectos: [],
    lote: { id: 3, descripcion: 'Poliéster embalaje lote C', cantidad_lote: 800 },
    operador: { id: 3, nombre: 'Ana Torres', proceso: 'Embalaje' },
  },
  {
    id_validacion: 6,
    fecha: '2025-05-07T14:22:00Z',
    defectos: 12,
    sin_defectos: 38,
    tipo_defectos: ['Crease', 'Misprinting', 'Slub'],
    lote: { id: 3, descripcion: 'Poliéster embalaje lote C', cantidad_lote: 800 },
    operador: { id: 3, nombre: 'Ana Torres', proceso: 'Embalaje' },
  },
];

const DEFECT_COLORS = {
  hole: 'bg-rose-100 text-rose-700',
  Crease: 'bg-amber-100 text-amber-700',
  'Skip-stitch': 'bg-orange-100 text-orange-700',
  Snag: 'bg-purple-100 text-purple-700',
  Spot: 'bg-blue-100 text-blue-700',
  Misprinting: 'bg-teal-100 text-teal-700',
  Slub: 'bg-indigo-100 text-indigo-700',
};

function DefectBadge({ name }) {
  const cls = DEFECT_COLORS[name] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {name}
    </span>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm px-5 py-4 ${color.border}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color.text}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const API = 'http://localhost:8000';

export default function RegistrosControl() {
  const [filtroOperador, setFiltroOperador] = React.useState('');
  const [filtroEstado, setFiltroEstado] = React.useState('todos');
  const [filtroBusqueda, setFiltroBusqueda] = React.useState('');
  const [validaciones, setValidaciones] = React.useState([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    setCargando(true);
    fetch(`${API}/api/validaciones/`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { setValidaciones(data); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  const operadores = [...new Map(validaciones.map(v => [v.operador.id, v.operador])).values()];

  const filtradas = validaciones.filter((v) => {
    const aprobado = v.defectos === 0;
    if (filtroEstado === 'aprobado' && !aprobado) return false;
    if (filtroEstado === 'rechazado' && aprobado) return false;
    if (filtroOperador && String(v.operador.id) !== filtroOperador) return false;
    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase();
      return (
        v.lote.descripcion.toLowerCase().includes(q) ||
        v.operador.nombre.toLowerCase().includes(q) ||
        String(v.id_validacion).includes(q)
      );
    }
    return true;
  });

  const totalDefectos = validaciones.reduce((s, v) => s + v.defectos, 0);
  const totalPiezas = validaciones.reduce((s, v) => s + v.defectos + v.sin_defectos, 0);
  const aprobadas = validaciones.filter(v => v.defectos === 0).length;
  const tasaAprobacion = validaciones.length
    ? Math.round((aprobadas / validaciones.length) * 100)
    : 0;

  const fmtFecha = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      + ' · '
      + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  if (cargando) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Cargando validaciones...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center bg-white border border-rose-200 rounded-xl px-8 py-6 shadow-sm">
        <p className="text-rose-600 font-semibold mb-1">Error al conectar con el servidor</p>
        <p className="text-xs text-slate-400">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          Reintentar
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 flex flex-col gap-6 bg-slate-50 min-h-full">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Historial de Validaciones</h1>
        <p className="text-sm text-slate-500 mt-0.5">Registro completo de inspecciones por lote y operador</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total validaciones"
          value={validaciones.length}
          sub="en este período"
          color={{ border: 'border-slate-200', text: 'text-slate-800' }}
        />
        <StatCard
          label="Tasa de aprobación"
          value={`${tasaAprobacion}%`}
          sub={`${aprobadas} de ${validaciones.length} sesiones`}
          color={{ border: 'border-emerald-200', text: 'text-emerald-600' }}
        />
        <StatCard
          label="Defectos detectados"
          value={totalDefectos}
          sub={`de ${totalPiezas} piezas inspeccionadas`}
          color={{ border: 'border-rose-200', text: 'text-rose-600' }}
        />
        <StatCard
          label="Operadores activos"
          value={operadores.length}
          sub="en este período"
          color={{ border: 'border-indigo-200', text: 'text-indigo-600' }}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por lote, operador o ID..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
          />
        </div>

        <select
          value={filtroOperador}
          onChange={(e) => setFiltroOperador(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white text-slate-600"
        >
          <option value="">Todos los operadores</option>
          {operadores.map(op => (
            <option key={op.id} value={op.id}>{op.nombre}</option>
          ))}
        </select>

        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
          {[['todos', 'Todos'], ['aprobado', 'Aprobados'], ['rechazado', 'Rechazados']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFiltroEstado(val)}
              className={`px-4 py-2 font-medium transition-colors
                ${filtroEstado === val
                  ? val === 'aprobado' ? 'bg-emerald-500 text-white'
                    : val === 'rechazado' ? 'bg-rose-500 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 ml-auto">{filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {['ID', 'Fecha', 'Lote', 'Operador', 'Proceso', 'Piezas', 'Tipo de defectos', 'Estado'].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No se encontraron validaciones con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtradas.map((v) => {
                  const aprobado = v.defectos === 0;
                  const total = v.defectos + v.sin_defectos;
                  return (
                    <tr key={v.id_validacion} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-slate-500">
                        #{String(v.id_validacion).padStart(4, '0')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {fmtFecha(v.fecha)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-700 max-w-[180px] truncate">{v.lote.descripcion}</p>
                        <p className="text-xs text-slate-400">Lote #{v.lote.id} · {v.lote.cantidad_lote} uds.</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-700">{v.operador.nombre}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
                          {v.operador.proceso}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        <span className="text-rose-600 font-semibold">{v.defectos}</span>
                        <span className="text-slate-400"> / {total}</span>
                      </td>
                      <td className="px-4 py-3">
                        {v.tipo_defectos.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Ninguno</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {v.tipo_defectos.map(d => <DefectBadge key={d} name={d} />)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
                          ${aprobado
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${aprobado ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {aprobado ? 'Aprobado' : 'Rechazado'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Mostrando {filtradas.length} de {validaciones.length} registros
          </p>
          <p className="text-xs text-slate-400">
            Fuente: <code className="bg-slate-200 px-1 rounded">GET {API}/api/validaciones/</code>
          </p>
        </div>
      </div>
    </div>
  );
}
