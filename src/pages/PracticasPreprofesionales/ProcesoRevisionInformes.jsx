import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ProcesoRevisionInformes() {
  const [userRole, setUserRole] = useState(null);
  const [informes, setInformes] = useState([]);
  const [estado, setEstado] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [notificaciones, setNotificaciones] = useState([]);  // Para las notificaciones
  const [avanceFile, setAvanceFile] = useState(null);
  const [asesoriaFile, setAsesoriaFile] = useState(null);
  const [ampliacionFile, setAmpliacionFile] = useState(null);
  const [finalFile, setFinalFile] = useState(null);
  const [docenteComentarios, setDocenteComentarios] = useState({});
  const [asesores, setAsesores] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedAsesor, setSelectedAsesor] = useState('');
  const [selectedEstudiante, setSelectedEstudiante] = useState('');
  const [informesComision, setInformesComision] = useState([]);  // Para los informes de la comisión

  const user = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    if (user) {
      setUserRole(user.rol);
    }

    // Obtener los informes o notificaciones según el rol
    if (user && (user.rol === 'secretaria' || user.rol === 'comision' || user.rol === 'docente')) {
      axios.get('http://localhost:5000/api/informes')
        .then(response => {
          setInformes(response.data);
          // Inicializar estado de los informes
          if (Object.keys(estado).length === 0) {
            const initialEstado = {};
            response.data.forEach(informe => {
              initialEstado[informe.id] = informe.estado;
            });
            setEstado(initialEstado);
          }
        })
        .catch(error => {
          console.error('Error al obtener los informes:', error);
        });
    }

    // Obtener la lista de asesores
    axios.get('http://localhost:5000/api/asesores')
      .then(response => {
        setAsesores(response.data);
      })
      .catch(error => {
        console.error('Error al obtener los asesores', error);
      });

    // Obtener la lista de estudiantes
    axios.get('http://localhost:5000/api/estudiantes')
      .then(response => {
        setEstudiantes(response.data);
      })
      .catch(error => {
        console.error('Error al obtener los estudiantes', error);
      });

    // Si el usuario es comision, obtener los informes relacionados entre asesoria y avance
    if (user && user.rol === 'comision') {
      axios.get('http://localhost:5000/api/informes_comision')
        .then(response => {
          setInformesComision(response.data);
        })
        .catch(error => {
          console.error('Error al obtener los informes de la comisión:', error);
        });
    }

    if (user && user.rol === 'estudiante') {
      // Cambiar la URL para obtener las notificaciones de los informes
      axios.get(`http://localhost:5000/api/notificaciones_informes?id_estudiante=${user.id_estudiante}`)
        .then(response => {
          setNotificaciones(response.data);  // Cargar las notificaciones de los informes
        })
        .catch(error => {
          console.error('Error al obtener notificaciones de informes:', error);
        });
    }

    if (user && user.rol === 'asesor') {
      // Obtener las últimas notificaciones del asesor
      axios.get(`http://localhost:5000/api/ultima_notificacion_asesor?id_asesor=${user.id_asesor}`)
        .then(response => {
          setNotificaciones([response.data]);  // Solo guardamos la última notificación
        })
        .catch(error => {
          console.error('Error al obtener la última notificación de asesor:', error);
        });
    }

  }, [user, estado]);

  const handleFileChange = (e) => {
    if (e.target.name === "avance") {
      setAvanceFile(e.target.files[0]);
    } else if (e.target.name === "asesoria") {
      setAsesoriaFile(e.target.files[0]);
    } else if (e.target.name === "ampliacion") {
      setAmpliacionFile(e.target.files[0]);
    } else if (e.target.name === "final") {
      setFinalFile(e.target.files[0]);
    }
  };

  const submitInformeAvance = async (file, selectedAsesor) => {
    const formData = new FormData();
    formData.append('avance', file);

    // Enviar informe de avance con el id_estudiante del estudiante logueado y el id_asesor seleccionado
    if (userRole === 'estudiante') {
      formData.append('id_estudiante', user.id_estudiante); // ID del estudiante logueado
      if (selectedAsesor) formData.append('id_asesor', selectedAsesor); // ID del asesor seleccionado
    }

    try {
      const response = await axios.post('http://localhost:5000/api/informes/avance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.status === 200) {
        alert('Informe de avance enviado exitosamente');
      } else {
        alert('Error en el servidor, no se pudo procesar el informe');
      }
    } catch (error) {
      console.error('Error al enviar el informe de avance:', error.response || error.message);
      alert('Error al enviar el informe');
    }
  };

  const submitInformeAsesoria = async (file, selectedEstudiante) => {
    const formData = new FormData();
    formData.append('asesoria', file);

    // Verificar si el usuario es un asesor y si su id_asesor está disponible
    if (userRole === 'asesor') {
      formData.append('id_asesor', user.id_asesor); // ID del asesor logueado
      if (selectedEstudiante) formData.append('id_estudiante', selectedEstudiante); // ID del estudiante seleccionado
    }

    try {
      const response = await axios.post('http://localhost:5000/api/informes/asesoria', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.status === 200) {
        alert('Informe de asesoría enviado exitosamente');
      } else {
        alert('Error en el servidor, no se pudo procesar el informe');
      }
    } catch (error) {
      console.error('Error al enviar el informe de asesoría:', error.response || error.message);
      alert('Error al enviar el informe');
    }
  };

  const handleSubmitAvance = async (e) => {
    e.preventDefault();

    if (!avanceFile) {
      alert('Debe seleccionar un informe de avance.');
      return;
    }

    submitInformeAvance(avanceFile, selectedAsesor);
  };

  const handleSubmitAsesoria = async (e) => {
    e.preventDefault();

    if (!asesoriaFile || !selectedEstudiante) {
      alert('Debe seleccionar un informe de asesoría y un estudiante.');
      return;
    }

    submitInformeAsesoria(asesoriaFile, selectedEstudiante);
  };

  const handleUpdateState = async (idEstudiante, estadoAsesoria, estadoAvance, idAsesor) => {
  if (!estadoAsesoria || !estadoAvance || !idAsesor) {
    alert('Faltan datos necesarios para actualizar el estado');
    return;
  }

  // Enviar la solicitud PUT para actualizar los estados de los informes
  try {
    const response = await axios.put('http://localhost:5000/api/actualizacion_informe', {
      id_estudiante: idEstudiante,
      estado_informe_asesoria: estadoAsesoria,
      estado_informe_avance: estadoAvance,
      id_asesor: idAsesor
    });

    // Notificar a los estudiantes y asesores
    const notificationData = {
      id_estudiante: idEstudiante,
      estado_asesoria: estadoAsesoria,
      estado_avance: estadoAvance,
      id_asesor: idAsesor
    };

    await axios.post('http://localhost:5000/api/notificar', notificationData);

    // Mostrar mensaje de éxito y actualizar notificaciones
    alert('Estado actualizado y notificación enviada');

    // Actualizar las notificaciones para el estudiante
    if (userRole === 'estudiante' ) {
      // Obtener las notificaciones actualizadas
      const response = await axios.get(`http://localhost:5000/api/notificaciones_informes?id_estudiante=${user.id_estudiante}`);
      setNotificaciones(response.data);  // Actualizar las notificaciones
    }

    await axios.post('http://localhost:5000/api/notificar', notificationData);

    // Mostrar mensaje de éxito y actualizar notificaciones
    alert('Estado actualizado y notificación enviada');

    // Actualizar las notificaciones para el estudiante
    if (userRole === 'asesor' ) {
      // Obtener las notificaciones actualizadas
      const response = await axios.get(`http://localhost:5000/api/notificaciones_informes?id_estudiante=${user.id_estudiante}`);
      setNotificaciones(response.data);  // Actualizar las notificaciones
    }

  } catch (error) {
    console.error('Error al actualizar el estado:', error);
    alert(`Hubo un error al actualizar el estado: ${error.response ? error.response.data.error : error.message}`);
  }
};



  return (
    <div>
      {/* Vista Estudiante */}
      {userRole === 'estudiante' && (
        <div>
          <h3>Informe de Avance</h3>
          <form onSubmit={handleSubmitAvance}>
            <label>Informe de Avance:</label>
            <input type="file" name="avance" onChange={handleFileChange} required />
            <div>
              <label>Seleccionar Asesor:</label>
              <select value={selectedAsesor} onChange={(e) => setSelectedAsesor(e.target.value)} required>
                <option value="">Seleccionar Asesor</option>
                {asesores.map((asesor) => (
                  <option key={asesor.id} value={asesor.id}>
                    {asesor.dni} - {asesor.nombre} {asesor.apellido}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit">Enviar Informe de Avance</button>
          </form>

          <h3>Notificaciones</h3>
          <div>
  {notificaciones.length > 0 ? (
    <div>
      {/* Mostrar solo el mensaje de la última actualización */}
      <strong>{notificaciones[0].mensaje}</strong><br />
      <em>{new Date(notificaciones[0].fecha).toLocaleString()}</em><br />
    </div>
  ) : (
    <p>No tienes notificaciones.</p>
            )}
          </div>
        </div>
      )}

      {/* Vista Asesor */}
      {userRole === 'asesor' && (
        <div>
          <h3>Informe de Asesoría</h3>
          <form onSubmit={handleSubmitAsesoria}>
            <label>Informe de Asesoría:</label>
            <input type="file" name="asesoria" onChange={handleFileChange} required />
            <div>
              <label>Seleccionar Estudiante:</label>
              <select value={selectedEstudiante} onChange={(e) => setSelectedEstudiante(e.target.value)} required>
                <option value="">Seleccionar Estudiante</option>
                {estudiantes.map((estudiante) => (
                  <option key={estudiante.id} value={estudiante.id}>
                    {estudiante.dni} - {estudiante.nombre} {estudiante.apellido}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit">Enviar Informe de Asesoría</button>
          </form>

          <h3>Notificaciones</h3>
          <div>
            {notificaciones.length > 0 ? (
              <div>
                {/* Mostrar solo el mensaje de la última actualización */}
                <strong>{notificaciones[0].mensaje}</strong><br />
                <em>{new Date(notificaciones[0].fecha).toLocaleString()}</em><br />
              </div>
            ) : (
              <p>No tienes notificaciones.</p>
            )}
          </div>
        </div>
      )}

      {/* Vista Comisión */}
      {userRole === 'comision' && (
        <div>
          <h3>Revisión de Informes</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>ID Estudiante</th>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>ID Asesor</th>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>Estado Asesoría</th>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>Estado Avance</th>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>Informe Asesoría</th>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>Informe Avance</th>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {informesComision.map((informe) => (
                <tr key={informe.id_estudiante}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{informe.id_estudiante}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{informe.id_asesor}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <select
                      value={informe.estado_informe_asesoria}
                      onChange={(e) =>
                        handleUpdateState(informe.id_estudiante, e.target.value, informe.estado_revision_avance, informe.id_asesor)
                      }
                      style={{ width: '100%', padding: '5px' }}
                    >
                      <option value="Aprobado">Aprobado</option>
                      <option value="Rechazado">Rechazado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <select
                      value={informe.estado_revision_avance}
                      onChange={(e) =>
                        handleUpdateState(informe.id_estudiante, informe.estado_informe_asesoria, e.target.value, informe.id_asesor)
                      }
                      style={{ width: '100%', padding: '5px' }}
                    >
                      <option value="Aprobado">Aprobado</option>
                      <option value="Rechazado">Rechazado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {informe.informe_asesoria && (
                      <a href={`http://localhost:5000/api/descargar/${informe.informe_asesoria}`} target="_blank" rel="noopener noreferrer">
                        Ver Informe Asesoría
                      </a>
                    )}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {informe.informe_avance && (
                      <a href={`http://localhost:5000/api/descargar/${informe.informe_avance}`} target="_blank" rel="noopener noreferrer">
                        Ver Informe Avance
                      </a>
                    )}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <button
                      onClick={() =>
                        handleUpdateState(informe.id_estudiante, informe.estado_informe_asesoria, informe.estado_revision_avance, informe.id_asesor)
                      }
                    >
                      Actualizar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProcesoRevisionInformes;
