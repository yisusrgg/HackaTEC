import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function GraficaDefectos({ activo }) {
  // Datos simulados basados en tu lista de detecciones
  const data = [
    { defecto: 'Hole', cantidad: 12 },
    { defecto: 'Crease', cantidad: 8 },
    { defecto: 'Skip-stitch', cantidad: 15 },
    { defecto: 'Misprinting', cantidad: 5 },
    { defecto: 'Slub', cantidad: 3 },
    { defecto: 'Spot', cantidad: 7 },
  ].sort((a, b) => b.cantidad - a.cantidad); // Ordenar de mayor a menor

  return (
    <div className={`bg-white p-4 rounded-lg shadow h-80 transition-all ${!activo ? 'opacity-40 grayscale' : ''}`}>
      <h3 className="text-sm font-semibold text-gray-500 mb-4">Distribución de Defectos</h3>
      
      <ResponsiveContainer width="100%" height="90%">
        <BarChart 
          data={data} 
          layout="vertical" // Cambiamos a horizontal
          margin={{ left: 20, right: 20 }}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="defecto" 
            type="category" 
            fontSize={11} 
            width={90}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{fill: 'transparent'}}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={15}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#f87171'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default GraficaDefectos;