import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ProcesoRevisionInformes() {
  const [userRole, setUserRole] = useState(null);
  const [informes, setInformes] = useState([]);
  const [estado, setEstado] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [notificaciones, setNotificaciones] = useState([]);
  const [avanceFile, setAvanceFile] = useState(null);
  const [asesoriaFile, setAsesoriaFile] = useState(null);
  const [ampliacionFile, setAmpliacionFile] = useState(null);
  const [finalFile, setFinalFile] = useState(null);
  const [docenteComentarios, setDocenteComentarios] = useState({});

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

    if (user && user.rol === 'estudiante') {
      axios.get(`http://localhost:5000/api/notificaciones?id_estudiante=${user.id_estudiante}`)
        .then(response => {
          setNotificaciones(response.data);
        })
        .catch(error => {
          console.error('Error al obtener notificaciones', error);
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

  const handleSubmit = async (e, tipo) => {
    e.preventDefault();
    let file = null;
    let endpoint = '';
    if (tipo === 'avance') {
      if (!avanceFile) {
        alert('Informe de avance requerido');
        return;
      }
      file = avanceFile;
      endpoint = 'avance';
    } else if (tipo === 'asesoria') {
      if (!asesoriaFile) {
        alert('Informe de asesoría requerido');
        return;
      }
      file = asesoriaFile;
      endpoint = 'asesoria';
    } else if (tipo === 'ampliacion') {
      if (!ampliacionFile) {
        alert('Solicitud de ampliación de plazo requerida');
        return;
      }
      file = ampliacionFile;
      endpoint = 'ampliacion';
    } else if (tipo === 'final') {
      if (!finalFile) {
        alert('Informe final requerido');
        return;
      }
      file = finalFile;
      endpoint = 'final';
    }

    const formData = new FormData();
    formData.append(tipo, file);
    formData.append('id_estudiante', user.id_estudiante);

    try {
      await axios.post(`http://localhost:5000/api/informes/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Documento enviado exitosamente');
    } catch (error) {
      console.error('Error al enviar documentos:', error);
      alert('Error al enviar documentos');
    }
  };

  const handleEstadoChange = (id, e) => {
    setEstado(prevEstado => ({
      ...prevEstado,
      [id]: e.target.value,
    }));
  };

  const handleComentarioChange = (id, e) => {
    setComentarios(prevComentarios => ({
      ...prevComentarios,
      [id]: e.target.value,
    }));
  };

  const handleDocenteComentarioChange = (id, e) => {
    setDocenteComentarios(prevComentarios => ({
      ...prevComentarios,
      [id]: e.target.value,
    }));
  };

  const handleUpdateState = (idInforme, estadoSeleccionado) => {
    axios.put('http://localhost:5000/api/actualizar-estado', {
      idInforme,
      estado: estadoSeleccionado
    })
      .then(() => {
        alert('Estado actualizado');
        setEstado(prevEstado => ({
          ...prevEstado,
          [idInforme]: estadoSeleccionado,
        }));
      })
      .catch((error) => {
        alert('Error al actualizar estado');
      });
  };

  return (
    <div>
      {/* Vista Estudiante */}
      {userRole === 'estudiante' && (
        <div>
          <h3>Formulario de Envío de Informe de Avance</h3>
          <form onSubmit={(e) => handleSubmit(e, 'avance')}>
            <label>Informe de Avance:</label>
            <input type="file" name="avance" onChange={handleFileChange} required />
            <button type="submit">Enviar Informe de Avance</button>
          </form>

          <h3>Solicitud de Ampliación de Plazo</h3>
          <form onSubmit={(e) => handleSubmit(e, 'ampliacion')}>
            <label>Solicitud de Ampliación de Plazo:</label>
            <input type="file" name="ampliacion" onChange={handleFileChange} required />
            <button type="submit">Enviar Solicitud de Ampliación</button>
          </form>

          <h3>Informe Final</h3>
          <form onSubmit={(e) => handleSubmit(e, 'final')}>
            <label>Informe Final:</label>
            <input type="file" name="final" onChange={handleFileChange} required />
            <button type="submit">Enviar Informe Final</button>
          </form>
        </div>
      )}

      {/* Vista Asesor */}
      {userRole === 'asesor' && (
        <div>
          <h3>Formulario de Envío de Informe de Asesoría</h3>
          <form onSubmit={(e) => handleSubmit(e, 'asesoria')}>
            <label>Informe de Asesoría:</label>
            <input type="file" name="asesoria" onChange={handleFileChange} required />
            <button type="submit">Enviar Informe de Asesoría</button>
          </form>
        </div>
      )}

      {/* Vista Comisión de Prácticas */}
      {userRole === 'comision' && (
        <div>
          <h3>Revisión de Informes</h3>
          {informes.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ID Estudiante</th>
                  <th>Informe</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {informes.map((informe) => (
                  <tr key={informe.id}>
                    <td>{informe.id_estudiante}</td>
                    <td><a href={`http://localhost:5000/uploads/${informe.avance}`} target="_blank">Ver Informe</a></td>
                    <td>
                      <select value={estado[informe.id]} onChange={(e) => handleEstadoChange(informe.id, e)}>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="Rechazado">Rechazado</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={() => handleUpdateState(informe.id, estado[informe.id])}>Actualizar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay informes registrados.</p>
          )}
        </div>
      )}

      {/* Vista Docente Revisor */}
      {userRole === 'docente' && (
        <div>
          <h3>Revisión de Informe Final</h3>
          {informes.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ID Estudiante</th>
                  <th>Informe Final</th>
                  <th>Comentarios</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {informes.map((informe) => (
                  <tr key={informe.id}>
                    <td>{informe.id_estudiante}</td>
                    <td><a href={`http://localhost:5000/uploads/${informe.final}`} target="_blank">Ver Informe Final</a></td>
                    <td>
                      <textarea
                        value={docenteComentarios[informe.id] || ''}
                        onChange={(e) => handleDocenteComentarioChange(informe.id, e)}
                        placeholder="Escribe tus comentarios aquí"
                      />
                    </td>
                    <td>
                      <button onClick={() => handleUpdateState(informe.id, estado[informe.id])}>Actualizar Estado</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay informes registrados.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ProcesoRevisionInformes;
