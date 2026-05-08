import React from 'react';
import Estadisticas from './components/Estadisticas';
import Evaluacion from './components/Evaluacion';
import ModalConfiguracion from './components/ModalConfiguracion';
import GraficaDefectos from './components/GraficaDefectos';

function MonitorOperativo() {
  const [procesoActivo, setProcesoActivo] = React.useState(false);
  const [modalAbierto, setModalAbierto] = React.useState(false);
  const [infoProceso, setInfoProceso] = React.useState(null);

  const handleIniciarClick = () => {
    if (procesoActivo) {
      setProcesoActivo(false);
      setInfoProceso(null);
    } else {
      setModalAbierto(true);
    }
  };

  const confirmarInicio = (datos) => {
    setInfoProceso(datos);
    setProcesoActivo(true);
    setModalAbierto(false);
  };

  return (
    <div className="p-6 h-full flex flex-col gap-5 bg-slate-50">
      <ModalConfiguracion
        isOpen={modalAbierto}
        onConfirm={confirmarInicio}
        onClose={() => setModalAbierto(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Monitor en Tiempo Real</h1>
            {infoProceso ? (
              <p className="text-xs text-slate-500 mt-0.5">
                Lote <span className="font-semibold text-indigo-600">{infoProceso.lote}</span>
                {' · '}
                <span>{infoProceso.proceso}</span>
                {' · '}
                <span>{infoProceso.encargado}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Sin proceso activo</p>
            )}
          </div>

          {procesoActivo && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              EN VIVO
            </span>
          )}
        </div>

        <button
          onClick={handleIniciarClick}
          className={`flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98]
            ${procesoActivo
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-100'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
            }`}
        >
          {procesoActivo ? (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
              </svg>
              Detener
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
              </svg>
              Iniciar Proceso
            </>
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Camera feed */}
        <div className={`flex-1 rounded-xl relative overflow-hidden flex items-center justify-center border-2 transition-all duration-300
          ${procesoActivo
            ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-900/20'
            : 'bg-slate-900 border-slate-700'
          }`}
        >
          {procesoActivo && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-xs text-white px-2.5 py-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              CÁMARA ACTIVA
            </div>
          )}

          <div className="text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke={procesoActivo ? '#6366f1' : '#334155'} strokeWidth={1} className="w-16 h-16 mx-auto mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <p className={`text-sm font-medium ${procesoActivo ? 'text-slate-400' : 'text-slate-600'}`}>
              {procesoActivo ? 'Esperando señal de cámara...' : 'Inicia un proceso para activar la cámara'}
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto">
          <Evaluacion activo={procesoActivo} />
          <Estadisticas activo={procesoActivo} />
          <GraficaDefectos activo={procesoActivo} />
        </div>
      </div>
    </div>
  );
}

export default MonitorOperativo;
