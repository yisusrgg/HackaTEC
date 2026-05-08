import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
        <p className="font-semibold">{label}</p>
        <p className="text-indigo-300">{payload[0].value} detecciones</p>
      </div>
    );
  }
  return null;
};

function GraficaDefectos({ activo }) {
  const data = [
    { defecto: 'Hole', cantidad: 12 },
    { defecto: 'Skip-stitch', cantidad: 15 },
    { defecto: 'Crease', cantidad: 8 },
    { defecto: 'Spot', cantidad: 7 },
    { defecto: 'Misprinting', cantidad: 5 },
    { defecto: 'Slub', cantidad: 3 },
  ].sort((a, b) => b.cantidad - a.cantidad);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all duration-300 ${!activo ? 'opacity-50' : ''}`}>
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-600">Defectos Detectados</h3>
        <p className="text-xs text-slate-400 mt-0.5">Sesión actual</p>
      </div>

      <div className="p-2 flex-1" style={{ minHeight: 220 }}>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24, top: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="defecto"
              type="category"
              fontSize={11}
              width={80}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={14}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index] ?? COLORS[COLORS.length - 1]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GraficaDefectos;
