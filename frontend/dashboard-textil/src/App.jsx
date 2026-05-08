import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MonitorOperativo from './MonitorOperativo';
import RegistrosControl from './RegistrosControl';

export default function App() {
  const [sidebarExpandido, setSidebarExpandido] = useState(true);

  return (
    <Router>
      <div className="flex h-screen bg-slate-100 overflow-hidden">
        <Sidebar expandido={sidebarExpandido} setExpandido={setSidebarExpandido} />
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
