import React from 'react';
import { Link, useParams, Outlet } from 'react-router-dom';

const VistaOpcion = () => {
  const { opcion } = useParams(); // Obtener el nombre de la opción desde la URL

  // Define los procesos según la opción
  const procesos = {
    'practicas-preprofesionales': [
      'revision-inscripcion',
      'revision-informes',
      'informefinal-certificado',
      'Convalidación-experiencialaboral'
    ],
    'admision': [
      'Proceso-1',
      'Proceso-2',
      'Proceso-3'
    ]
  };

  // Renderizar la lista de procesos según la opción seleccionada
  const renderProcesos = () => {
    return (
      <ul>
        {procesos[opcion]?.map((proceso, index) => (
          <li key={index}>
            <Link to={`/dashboard/${opcion}/${proceso.replace(/\s+/g, '-').toLowerCase()}`}>
              {proceso}
            </Link>
          </li>
        )) || <p>No se encontraron procesos para esta opción.</p>}
      </ul>
    );
  };

  return (
    <div className="vista-opcion">
      <div className="vista-opcion-content">
        {/* Lista de procesos a la izquierda */}
        <div className="procesos-lista">
          {renderProcesos()}
        </div>

        {/* Detalles del proceso a la derecha (se muestra según la ruta seleccionada) */}
        <div className="proceso-detalle">
          <Outlet /> {/* Este es el lugar donde se mostrará el componente Proceso */}
        </div>
      </div>
    </div>
  );
};

export default VistaOpcion;
