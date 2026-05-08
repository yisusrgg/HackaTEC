import React from 'react'

function Evaluacion({ activo }) {
  // Definimos estilos para no saturar el JSX
  const btnAprobado = activo 
    ? "bg-green-500 hover:bg-green-600 shadow-md" 
    : "bg-gray-200 text-gray-400 cursor-not-allowed";
    
  const btnRechazado = activo 
    ? "bg-red-500 hover:bg-red-600 shadow-md" 
    : "bg-gray-200 text-gray-400 cursor-not-allowed";

  return (
    <div className={`bg-white p-4 rounded-lg shadow transition-all ${!activo ? 'border-2 border-dashed border-gray-200' : ''}`}>
        <h3 className={`text-lg font-semibold mb-4 ${activo ? 'text-gray-600' : 'text-gray-300'}`}>
          Evaluación
        </h3>
        
        <button 
          disabled={!activo}
          className={`w-full font-bold py-3 rounded-lg mb-3 transition-all ${btnAprobado} text-white`}
        >
          Aprobado
        </button>
        
        <button 
          disabled={!activo}
          className={`w-full font-bold py-3 rounded-lg transition-all ${btnRechazado} text-white`}
        >
          Rechazado
        </button>
    </div>
  )
}

export default Evaluacion