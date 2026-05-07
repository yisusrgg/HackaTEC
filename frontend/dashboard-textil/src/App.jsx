import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';



// ==========================================
// VISTA X: MONITOR OPERATIVO (CÁMARA Y RA)
// ==========================================
function MonitorOperativo() {
  const [procesoActual, setProcesoActual] = useState('Rollo');

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Cabecera y Selector de Proceso */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-800">Control en Tiempo Real</h2>
        <select 
          value={procesoActual}
          onChange={(e) => setProcesoActual(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
        >
          <option value="Rollo">Control de Rollo</option>
          <option value="Corte">Proyección de Corte</option>
          <option value="Producto">Inspección de Producto</option>
        </select>
      </div>

      {/* Área Central: Visual Principal y Botones */}
      <div className="flex gap-6 flex-1">
        
        {/* Contenedor del Video/Imagen y Canvas */}
        <div className="flex-1 bg-black rounded-lg relative flex items-center justify-center border-4 border-gray-800">
          <span className="text-gray-500">Aquí irá la cámara/imagen para la fase de {procesoActual}</span>
        </div>

        {/* Panel de Decisiones */}
        <div className="w-64 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold text-gray-600 mb-4">Evaluación</h3>
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg mb-3 transition-colors">
              Aprobado
            </button>
            <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors">
              Rechazado
            </button>
          </div>
          
          {/* Métricas rápidas */}
          <div className="bg-white p-4 rounded-lg shadow">
             <h3 className="text-sm font-semibold text-gray-500 mb-2">Producción del día</h3>
             <p className="text-green-600 font-bold">Aprobados: 145</p>
             <p className="text-red-600 font-bold">Rechazados: 3</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VISTA Y: TABLA DE REGISTROS
// ==========================================
function RegistrosControl() {
  const registros = [
    { id: "1042", operador: "LOPEZ", proceso: "Corte", estado: "Aprobado", hora: "14:30" },
    { id: "1043", operador: "LOPEZ", proceso: "Rollo", estado: "Rechazado", hora: "14:45" }
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Historial de Calidad</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Prenda</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operador</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proceso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registros.map((reg, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reg.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reg.operador}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reg.proceso}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${reg.estado === 'Aprobado' ? 'text-green-600' : 'text-red-600'}`}>
                  {reg.estado}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// APLICACIÓN PRINCIPAL (ENRUTADOR)
// ==========================================
export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<MonitorOperativo />} />
            <Route path="/registros" element={<RegistrosControl />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}