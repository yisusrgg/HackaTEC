import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs z-50">
        <p className="font-semibold">{label}</p>
        <p className="text-indigo-300">{payload[0].value} detecciones</p>
      </div>
    );
  }
  return null;
};

// 1. NUEVO: Componente para partir el texto largo en dos líneas
const CustomYAxisTick = ({ x, y, payload }) => {
  const text = payload.value;
  const maxLineLength = 12; // Cantidad de letras antes de cortar
  
  let line1 = text;
  let line2 = '';

  // Si el texto es muy largo, buscamos dónde cortarlo
  if (text.length > maxLineLength) {
    // Buscamos un guión o espacio cerca de la mitad para no cortar palabras a lo bruto
    const breakIndex = text.lastIndexOf('-', maxLineLength) !== -1 
        ? text.lastIndexOf('-', maxLineLength) 
        : text.lastIndexOf(' ', maxLineLength);

    if (breakIndex !== -1 && breakIndex !== 0) {
        line1 = text.substring(0, breakIndex + 1); // Incluye el guión si lo hay
        line2 = text.substring(breakIndex + 1);
    } else {
        // Corte forzado si es una palabra gigante sin espacios
        line1 = text.substring(0, maxLineLength);
        line2 = text.substring(maxLineLength);
    }
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={line2 ? -4 : 4} textAnchor="end" fill="#64748b" fontSize={10}>
        <tspan x={-5} dy="0">{line1}</tspan>
        {/* Si hay segunda línea, la empujamos hacia abajo */}
        {line2 && <tspan x={-5} dy="12">{line2}</tspan>}
      </text>
    </g>
  );
};

function GraficaDefectos({ activo, datos }) {
  
  const dataTransformada = useMemo(() => {
    if (!datos || !datos.tipo_defectos || datos.tipo_defectos.length === 0) return [];

    const conteo = datos.tipo_defectos.reduce((acc, defecto) => {
      acc[defecto] = (acc[defecto] || 0) + 1;
      return acc;
    }, {});

    const dataArray = Object.keys(conteo).map(key => ({
      defecto: key,
      cantidad: conteo[key]
    }));

    return dataArray.sort((a, b) => b.cantidad - a.cantidad);
  }, [datos]);

  // 2. Aumenté de 35 a 45 para darle espacio vertical a las 2 líneas de texto
  const alturaDinamica = dataTransformada.length > 0 
    ? (dataTransformada.length * 45) + 30 
    : 80;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all duration-300 ${!activo ? 'opacity-50' : ''}`}>
      <div className="px-4 py-3 border-b border-slate-100 flex-none">
        <h3 className="text-sm font-semibold text-slate-600">Defectos Detectados</h3>
        <p className="text-xs text-slate-400 mt-0.5">Sesión actual</p>
      </div>

      <div className="p-2 flex-1 transition-all duration-300">
        {dataTransformada.length > 0 ? (
          <ResponsiveContainer width="100%" height={alturaDinamica}>
            {/* 3. Aumenté el margin.left a 15 para que el texto no choque con el borde */}
            <BarChart data={dataTransformada} layout="vertical" margin={{ left: 15, right: 24, top: 15, bottom: 15 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="defecto"
                type="category"
                width={90} // 4. Ancho un poco más grande
                tickLine={false}
                axisLine={false}
                tick={<CustomYAxisTick />} // 5. USAMOS EL COMPONENTE NUEVO AQUÍ
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={14}>
                {dataTransformada.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div 
            className="flex items-center justify-center text-slate-400 text-sm transition-all duration-300"
            style={{ height: alturaDinamica }}
          >
            {activo ? 'Esperando detecciones...' : 'Sistema en pausa'}
          </div>
        )}
      </div>
    </div>
  );
}

export default GraficaDefectos;