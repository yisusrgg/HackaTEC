import React from 'react'
import Estadisticas from './components/Estadisticas';
import Evaluacion from './components/Evaluacion';
import ModalConfiguracion from './components/ModalConfiguracion';
import GraficaDefectos from './components/GraficaDefectos';

function MonitorOperativo() {
    const [procesoActivo, setProcesoActivo] = React.useState(false);
    const [modalConfiguracionAbierto, setModalConfiguracionAbierto] = React.useState(false);
    const [infoProceso, setInfoProceso] = React.useState(null);

    const handleIniciarClick = () => {
        if (procesoActivo) {
            // Si está activo, simplemente lo detenemos
            setProcesoActivo(false);
            setInfoProceso(null);
        } else {
            // Si está apagado, abrimos el modal para configurar
            setModalConfiguracionAbierto(true);
        }
    };

    const confirmarInicio = (datos) => {
        setInfoProceso(datos);
        setProcesoActivo(true);
        setModalConfiguracionAbierto(false);
    };
    
  
    return (
      <div className="p-6 h-full flex flex-col">

        <ModalConfiguracion 
            isOpen={modalConfiguracionAbierto} 
            onConfirm={confirmarInicio} 
            onClose={() => setModalConfiguracionAbierto(false)}
        />

        {/* Cabecera y Selector de Proceso */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-800">Control en Tiempo Real</h2>
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            onClick={handleIniciarClick}
          >
            {procesoActivo ? 'Detener Proceso' : 'Iniciar Proceso'}
            
          </button>
        </div>
  
        {/* Área Central: Visual Principal y Botones */}
        <div className="flex gap-6 flex-1">
          
          {/* Contenedor del Video/Imagen y Canvas */}
          <div className="flex-1 bg-black rounded-lg relative flex items-center justify-center border-4 border-gray-800">
            <span className="text-gray-500">Aquí irá la cámara/imagen para el proceso</span>
          </div>
  
          {/* Panel de Decisiones */}
          <div className="w-80 flex flex-col gap-4 transition-all">
            <Evaluacion activo={procesoActivo} />
            <Estadisticas activo={procesoActivo} />
            <GraficaDefectos activo={procesoActivo} />
          </div>
        </div>
      </div>
    );
}

export default MonitorOperativo