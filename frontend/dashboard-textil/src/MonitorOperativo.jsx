import React from 'react';
import Estadisticas from './components/Estadisticas';
import Evaluacion from './components/Evaluacion';
import ModalConfiguracion from './components/ModalConfiguracion';
import GraficaDefectos from './components/GraficaDefectos';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const CAMERA_STREAM_URL = `${API_BASE}/api/camera/stream/`;

function MonitorOperativo() {
  const [procesoActivo, setProcesoActivo] = React.useState(false);
  const [modalAbierto, setModalAbierto] = React.useState(false);
  const [infoProceso, setInfoProceso] = React.useState(null);
  const [camaraError, setCamaraError] = React.useState('');
  const [streamToken, setStreamToken] = React.useState(0);
  const [validationId, setValidationId] = React.useState(null);

  // Ensure the stream is requested as soon as the page loads
  React.useEffect(() => {
    setStreamToken(Date.now());
  }, []);
  const handleIniciarClick = () => {
    if (procesoActivo) {
      // Detener: limpiar estado del proceso y del validationId para que
      // el backend deje de escribir en la validación existente.
      setProcesoActivo(false);
      setInfoProceso(null);
      setValidationId(null);
      // bump token to force reload of img without ?v=
      setStreamToken(Date.now());
    } else {
      setModalAbierto(true);
    }
  };

  const confirmarInicio = async (datos) => {
    // Create operador -> lote -> validacion via API, then start
    try {
      // create operador
      const opRes = await fetch(`${API_BASE}/api/operadores/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: datos.encargado, proceso: datos.proceso }),
      });
      const operador = await opRes.json();

      // create lote (cantidad_lote unknown -> 0)
      const loteRes = await fetch(`${API_BASE}/api/lotes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: datos.lote, cantidad_lote: 0, operador_id: operador.id }),
      });
      const lote = await loteRes.json();

      // create validacion
      const valRes = await fetch(`${API_BASE}/api/validaciones/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defectos: 0, sin_defectos: 0, tipo_defectos: [], lote_id: lote.id, operador_id: operador.id }),
      });
      const validacion = await valRes.json();

      setInfoProceso(datos);
      setProcesoActivo(true);
      setModalAbierto(false);
      setCamaraError('');
      setStreamToken(Date.now());
      setValidationId(validacion.id_validacion ?? validacion.id ?? null);
    } catch (err) {
      console.error('Error iniciando proceso:', err);
      setCamaraError('No se pudo iniciar el proceso: error de conexión con el backend.');
      setModalAbierto(false);
    }
  };

  const handleCamaraError = () => {
    setCamaraError('No se pudo cargar el stream. Verifica que el backend esté corriendo y que la cámara esté disponible.');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 p-6 gap-5">
      <ModalConfiguracion
        isOpen={modalAbierto}
        onConfirm={confirmarInicio}
        onClose={() => setModalAbierto(false)}
      />

      {/* Header */}
      <div className="flex-none bg-white rounded-xl shadow-sm px-5 py-4 flex justify-between items-center border border-slate-200">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Camara content */}
        <div className={`lg:col-span-8 rounded-xl relative overflow-hidden flex items-center justify-center border-2 transition-all duration-300 min-h-[300px] lg:min-h-0
            ${procesoActivo 
            ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-900/20' 
            : 'bg-slate-900 border-slate-700'
        }`}
        >
            <div className="absolute top-3 left-3 z-10">
              {procesoActivo ? (
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-xs text-white px-2.5 py-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  CÁMARA ACTIVA
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-xs text-slate-200 px-2.5 py-1.5 rounded-lg">
                  PREVIEW BACKEND
                </div>
              )}
            </div>

            <>
                <img
                src={`${CAMERA_STREAM_URL}?t=${streamToken}${validationId ? `&v=${validationId}` : ''}`}
                alt="Stream de cámara en vivo"
                onError={handleCamaraError}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {procesoActivo && (
                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-3 rounded-xl bg-black/55 backdrop-blur-sm px-4 py-3 text-white border border-white/10">
                  <div>
                    <p className="text-sm font-semibold">Vista en vivo</p>
                    <p className="text-xs text-slate-300">
                      {infoProceso ? `${infoProceso.lote} · ${infoProceso.proceso}` : 'Stream desde el backend'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Backend</p>
                    <p className="text-xs font-medium text-emerald-300">MJPEG activo</p>
                  </div>
                </div>
              )}

              {camaraError && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 px-6 text-center">
                  <div className="max-w-sm rounded-2xl border border-slate-700 bg-slate-900/95 p-5 shadow-2xl">
                    <p className="text-sm font-semibold text-white">{camaraError}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Abre el backend en `http://localhost:8000` y confirma que la cámara esté disponible en el equipo donde corre Django.
                    </p>
                  </div>
                </div>
              )}
            </>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-4 flex-col flex gap-4 overflow-y-auto pr-2 custom-scrollbar min-h-0">
          <Evaluacion activo={procesoActivo} />
          <Estadisticas activo={procesoActivo} />
          <GraficaDefectos activo={procesoActivo} />
          <div className="h-2 flex-none" />
        </div>
      </div>
    </div>
  );
}

export default MonitorOperativo;
