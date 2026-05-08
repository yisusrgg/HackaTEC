import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';


// ==========================================
// VISTA X: MONITOR OPERATIVO (CÁMARA Y RA)
// ==========================================
import MonitorOperativo from './MonitorOperativo';

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

      <div className="ticks"></div>
      <section id="spacer"></section>
    </Router>
  )
}

