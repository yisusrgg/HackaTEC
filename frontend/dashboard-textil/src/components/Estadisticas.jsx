import React from 'react'

function Estadisticas({ activo }) {
  return (
    <div className={`bg-white p-4 rounded-lg shadow transition-all duration-300 ${!activo ? 'opacity-50 saturate-50' : ''}`}>
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Producción del día</h3>
        <p className={`${activo ? 'text-green-600' : 'text-gray-400'} font-bold`}>Aprobados: 145</p>
        <p className={`${activo ? 'text-red-600' : 'text-gray-400'} font-bold`}>Rechazados: 3</p>
        {!activo && <p className="text-[10px] text-gray-400 mt-2 italic text-center">Proceso pausado</p>}
    </div>
  )
}

export default Estadisticas