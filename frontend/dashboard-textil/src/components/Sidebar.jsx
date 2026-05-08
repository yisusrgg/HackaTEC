import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Monitor en Vivo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    to: '/registros',
    label: 'Historial',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
      </svg>
    ),
  },
];

function Sidebar({ expandido, setExpandido }) {
  const location = useLocation();

  return (
    <div className={`${expandido ? 'w-64' : 'w-16'} bg-slate-900 h-full transition-all duration-300 flex flex-col shadow-xl flex-shrink-0`}>

      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </div>
        {expandido && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">TextilQC</p>
            <p className="text-slate-400 text-xs">Control de Calidad</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
                ${active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {expandido && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {active && expandido && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Collapse toggle */}
      <div className="border-t border-slate-800 p-2">
        <button
          onClick={() => setExpandido(!expandido)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all text-xs"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 transition-transform ${expandido ? '' : 'rotate-180'}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" />
          </svg>
          {expandido && <span>Contraer</span>}
        </button>
        {expandido && <p className="text-slate-600 text-xs text-center mt-2">v1.0.0</p>}
      </div>
    </div>
  );
}

export default Sidebar;
