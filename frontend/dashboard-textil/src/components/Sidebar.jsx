import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { MonitorPlay, Table2 } from 'lucide-react';

function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-5 flex flex-col gap-6">
          <h1 className="text-xl font-bold border-b border-gray-700 pb-4">Sistema Textil AR</h1>
          <nav className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3 hover:text-green-400 transition-colors">
              <MonitorPlay size={20} /> Monitor Operativo
            </Link>
            <Link to="/registros" className="flex items-center gap-3 hover:text-green-400 transition-colors">
              <Table2 size={20} /> Registros de Control
            </Link>
          </nav>
    </div>
  )
}

export default Sidebar