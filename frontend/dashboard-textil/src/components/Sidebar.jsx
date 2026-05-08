import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar({ expandido, setExpandido }) {
  return (
    <div className={`${expandido ? 'w-64' : 'w-20'} bg-gray-900 h-full transition-all duration-300 flex flex-col shadow-xl`}>
      
      {/* Botón para colapsar */}
      <button 
        onClick={() => setExpandido(!expandido)}
        className="p-4 text-white hover:bg-gray-800 flex justify-center border-b border-gray-800"
      >
        {expandido ? '◀ Ocultar' : '▶'}
      </button>

      <nav className="mt-4 flex-1">
        <Link to="/" className="flex items-center p-4 text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
          <span className="text-xl">📊</span>
          {expandido && <span className="ml-4 font-medium">Monitor</span>}
        </Link>

        <Link to="/registros" className="flex items-center p-4 text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
          <span className="text-xl">📋</span>
          {expandido && <span className="ml-4 font-medium">Registros</span>}
        </Link>
      </nav>

      {/* Pie del Sidebar */}
      <div className="p-4 border-t border-gray-800 text-gray-500 text-xs text-center">
        {expandido ? 'Sistema Control v1.0' : 'v1'}
      </div>
    </div>
  );
}

export default Sidebar;