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

  const [estadoAsesoria, setEstadoAsesoria] = useState('');
  const [estadoAvance, setEstadoAvance] = useState('');
  const [idEstudiante, setIdEstudiante] = useState('');
  const [idAsesor, setIdAsesor] = useState('');


  //para que aparezca el informe final en la vista de estudainte
  //const [finalFile, setFinalFile] = useState(null); // Estado para el archivo de informe final
  const [mostrarFormularioFinal, setMostrarFormularioFinal] = useState(false); // Controla la visibilidad del formulario final
  const [mostrarFormularioFinalAsesoria, setMostrarFormularioFinalAsesoria] = useState(false); 

  const [informeFinalAsesoria, setInformeFinalAsesoria] = useState(null);


  // Inicializa un estado que tendrá los estados por id_estudiante
  const [estadoComision, setEstadoComision] = useState({});

  const user = JSON.parse(localStorage.getItem('usuario'));

  // Asegúrate de que, al cargar los informes, el estado se inicialice con los valores correctos
  useEffect(() => {
    if (informesComision.length > 0) {
      const initialEstado = {};
      informesComision.forEach(informe => {
        initialEstado[informe.id_estudiante] = {
          estadoAsesoria: informe.estado_informe_asesoria,
          estadoAvance: informe.estado_revision_avance
        };
      });
      // Solo setea el estado si el valor realmente cambió
      if (JSON.stringify(estadoComision) !== JSON.stringify(initialEstado)) {
        setEstadoComision(initialEstado);
      }
    }
  }, [informesComision]);  // Dependencia: solo se ejecutará cuando informesComision cambie
  

  // Cambia el estado de la fila individualmente
  const handleEstadoChange = (idEstudiante, tipo, valor) => {
  setEstadoComision(prevEstadoComision => {
    const updatedEstado = { ...prevEstadoComision };
    if (!updatedEstado[idEstudiante]) {
      updatedEstado[idEstudiante] = { estadoAsesoria: "", estadoAvance: "" };
    }
    updatedEstado[idEstudiante][tipo] = valor;  // Actualiza solo el tipo (estadoAsesoria o estadoAvance)
    return updatedEstado;
  });
  };

   // Obtención de notificaciones
   useEffect(() => {
    if (user && user.rol === 'estudiante') {
      axios.get(`http://localhost:5000/api/notificaciones_informes?id_estudiante=${user.id_estudiante}`,
        {timeout: 10000}
      )
        .then(response => {
          setNotificaciones(response.data);
          // Verifica si la última notificación indica que el informe de avance está aprobado
          if (response.data.length > 0 && response.data[0].mensaje.includes('Aprobado')) {
            setMostrarFormularioFinal(true);  // Muestra el formulario de informe final
          }
        })
        .catch(error => {
          console.error('Error al obtener notificaciones de informes:', error);
        });
    }
  }, [user]);

  // Obtención de notificaciones
  useEffect(() => {
    if (user && user.rol === 'asesor') {
      axios.get(`http://localhost:5000/api/notificaciones_informes?id_asesor=${user.id_asesor}`,
        {timeout: 10000}
      )
        .then(response => {
          setNotificaciones(response.data);
          // Verifica si la última notificación indica que el informe de avance está aprobado
          if (response.data.length > 0 && response.data[0].mensaje.includes('Aprobado')) {
            setMostrarFormularioFinalAsesoria(true);  // Muestra el formulario de informe final
          }
        })
        .catch(error => {
          console.error('Error al obtener notificaciones de informes:', error);
        });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setUserRole(user.rol);
    }
  
    // Aquí es importante que no se actualice el estado si no es necesario
    if (user && (user.rol === 'secretaria' || user.rol === 'comision' || user.rol === 'docente')) {
      axios.get('http://localhost:5000/api/informes_comision')
        .then(response => {
          setInformesComision(response.data);
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
  
    // Solo obtén asesores y estudiantes una vez si no se han obtenido
    if (!asesores.length) {
      axios.get('http://localhost:5000/api/asesores')
        .then(response => {
          setAsesores(response.data);
        })
        .catch(error => {
          console.error('Error al obtener los asesores', error);
        });
    }
  
    if (!estudiantes.length) {
      axios.get('http://localhost:5000/api/estudiantes')
        .then(response => {
          setEstudiantes(response.data);
        })
        .catch(error => {
          console.error('Error al obtener los estudiantes', error);
        });
    }
  
    // Si el usuario es comision, obtener los informes relacionados entre asesoria y avance
    /*if (user && user.rol === 'comision') {
      axios.get('http://localhost:5000/api/informes_comision')
        .then(response => {
          setInformesComision(response.data);
        })
        .catch(error => {
          console.error('Error al obtener los informes de la comisión:', error);
        });
    }*/
  
    if (user && user.rol === 'estudiante' && notificaciones.length === 0) {
    axios.get(`http://localhost:5000/api/notificaciones_informes?id_estudiante=${user.id_estudiante}`, { timeout: 10000 })
      .then(response => {
        setNotificaciones(response.data);
        // Verifica si la última notificación indica que el informe de avance está aprobado
        if (response.data.length > 0 && response.data[0].mensaje.includes('Aprobado')) {
          setMostrarFormularioFinal(true);  // Muestra el formulario de informe final
        }
      })
      .catch(error => {
        console.error('Error al obtener notificaciones de informes:', error);
      });
    }
  
    if (user && user.rol === 'asesor' && notificaciones.length === 0) {
      axios.get(`http://localhost:5000/api/notificaciones_informes?id_asesor=${user.id_asesor}`, { timeout: 10000 })
        .then(response => {
          setNotificaciones(response.data);
          // Verifica si la última notificación indica que el informe de avance está aprobado
          if (response.data.length > 0 && response.data[0].mensaje.includes('Aprobado')) {
            setMostrarFormularioFinalAsesoria(true);  // Muestra el formulario de informe final
          }
        })
        .catch(error => {
          console.error('Error al obtener notificaciones de informes:', error);
        });
    }
  
  }, [user, asesores.length, estudiantes.length,notificaciones.length]);  // Asegúrate de que las dependencias sean las correctas
  


  //INFORME FINAL HABILITADO PARA VISTA DE Estudiante
  

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
    if (e.target.name === "final") {
      setFinalFile(e.target.files[0]);
    }
    if (e.target.name === "finalAsesoria") {
      setInformeFinalAsesoria(e.target.files[0]);
    }
  };

  // Enviar Informe final Asesoria

  const submitInformeFinalAsesoria = async () => {
    if (!informeFinalAsesoria) {
      alert('Debe seleccionar un informe final.');
      return;
    }

    const formData = new FormData();
    formData.append('finalAsesoria', informeFinalAsesoria);
    formData.append('id_asesor', user.id_asesor); // ID del estudiante logueado

    try {
      const response = await axios.post('http://localhost:5000/api/informes/finalAsesoria', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        alert('Informe final de asesoria enviado exitosamente');
      } else {
        alert('Error en el servidor, no se pudo procesar el informe final de asesoria');
      }
    } catch (error) {
      console.error('Error al enviar el informe final asesoria:', error.response || error.message);
      alert('Error al enviar el informe finalasesoria');
    }
  };



  

  // Enviar informe final
  const submitInformeFinal = async () => {
    if (!finalFile) {
      alert('Debe seleccionar un informe final.');
      return;
    }

    const formData = new FormData();
    formData.append('final', finalFile);
    formData.append('id_estudiante', user.id_estudiante); // ID del estudiante logueado

    try {
      const response = await axios.post('http://localhost:5000/api/informes/final', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        alert('Informe final enviado exitosamente');
      } else {
        alert('Error en el servidor, no se pudo procesar el informe final');
      }
    } catch (error) {
      console.error('Error al enviar el informe final:', error.response || error.message);
      alert('Error al enviar el informe final');
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
  
    try {
      // Enviar la solicitud PUT para actualizar el estado
      const response = await axios.put('http://localhost:5000/api/actualizacion_informe', {
        id_estudiante: idEstudiante,
        estado_informe_asesoria: estadoAsesoria,
        estado_informe_avance: estadoAvance,
        id_asesor: idAsesor
      });
  
      // Mostrar mensaje de éxito si la respuesta es exitosa
      if (response.status === 200) {
        alert('Estado actualizado correctamente');
      } else {
        alert('Hubo un problema al actualizar el estado. Intente de nuevo');
      }
  
      // Notificar a los estudiantes y asesores
      const notificationData = {
        id_estudiante: idEstudiante,
        estado_asesoria: estadoAsesoria,
        estado_avance: estadoAvance,
        id_asesor: idAsesor
      };
  
      await axios.post('http://localhost:5000/api/notificar', notificationData);
  
      // Actualizar el estado de los informes en la interfaz
      setEstado(prevEstado => {
        const updatedEstado = { ...prevEstado };
        updatedEstado[idEstudiante] = {
          ...updatedEstado[idEstudiante],
          estado_informe_asesoria: estadoAsesoria,
          estado_informe_avance: estadoAvance
        };
        return updatedEstado;
      });
  
    } catch (error) {
      // Si ocurre un error, mostrar un mensaje de error
      alert('Error al actualizar el estado: ' + (error.response ? error.response.data.error : error.message));
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
              {isNaN(new Date(notificaciones[0].fecha)) ? (
                <em>Fecha no válida</em>
              ) : (
                <em>{new Date(notificaciones[0].fecha).toLocaleString()}</em>
              )}
            </div>
            ) : (
              <p>No tienes notificaciones.</p>
            )}
          </div>
          {/* Mostrar formulario para enviar informe final solo si está aprobado el informe de avance */}
          {notificaciones.length > 0 && notificaciones[0].mensaje.includes('Aprobado') &&  (
            <div>
              <h3>Informe Final</h3>
              <form onSubmit={submitInformeFinal}>
                <label>Informe Final:</label>
                <input type="file" name="final" onChange={handleFileChange} required />
                <button type="submit">Enviar Informe Final</button>
              </form>
            </div>
          )}
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
    {isNaN(new Date(notificaciones[0].fecha)) ? (
      <em>Fecha no válida</em>
    ) : (
      <em>{new Date(notificaciones[0].fecha).toLocaleString()}</em>
    )}
    </div>
  ) : (
    <p>No tienes notificaciones.</p>
            )}
          </div>
          {/* Mostrar formulario para enviar informe final solo si está aprobado el informe de avance */}
          {notificaciones.length > 0 && notificaciones[0].mensaje.includes('Aprobado') &&  (
            <div>
              <h3>Informe Final</h3>
              <form onSubmit={submitInformeFinalAsesoria}>
                <label>Informe Final:</label>
                <input type="file" name="finalAsesoria" onChange={handleFileChange} required />
                <button type="submit">Enviar Informe Final</button>
              </form>
            </div>
          )}
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
              {informesComision.map((informe, index) => (
                <tr key={`${informe.id_estudiante}-${index}`}> {/* Usando una combinación única de id_estudiante e índice */}
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{informe.id_estudiante}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{informe.id_asesor}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <select
                      value={estadoAsesoria}
                      onChange={(e) => setEstadoAsesoria(e.target.value)} // Actualiza el estado de asesoría
                    >
                      <option value="Aprobado">Aprobado</option>
                      <option value="Rechazado">Rechazado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <select
                      value={estadoAvance}
                      onChange={(e) => setEstadoAvance(e.target.value)} // Actualiza el estado de avance
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
                        handleUpdateState(informe.id_estudiante, estadoAsesoria, estadoAvance, informe.id_asesor)
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
