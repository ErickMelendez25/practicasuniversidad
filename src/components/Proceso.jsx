import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Proceso() {
  const [userRole, setUserRole] = useState(null);
  const [practicas, setPracticas] = useState([]);
  const [estado, setEstado] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [formData, setFormData] = useState({
    solicitud: null,
    planPracticas: null
  });
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    if (user) {
      setUserRole(user.rol);
    }

    // Cargar las prácticas si el usuario es secretaria
    if (user && user.rol === 'secretaria') {
      axios.get('http://localhost:5000/api/practicas')
        .then((response) => {
          if (Array.isArray(response.data)) {
            setPracticas(response.data);
            setError(null);
          } else {
            console.error('Error: Los datos no son un arreglo', response.data);
            setError('Los datos no son un arreglo válido');
          }
        })
        .catch((error) => {
          console.error('Error al obtener la lista de practicas', error);
          setError('Error al obtener las prácticas');
        });
    }
  }, [user]);

  const handleEstadoChange = (id, e) => {
    if (userRole === 'secretaria') {
      setEstado((prevEstado) => ({
        ...prevEstado,
        [id]: e.target.value, // Actualiza el estado solo para la práctica específica
      }));
    }
  };

  const handleComentariosChange = (id, e) => {
    setComentarios((prevComentarios) => ({
      ...prevComentarios,
      [id]: e.target.value, // Actualiza el comentario solo para la práctica específica
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: files[0]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      alert('Por favor, inicie sesión primero.');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('solicitud', formData.solicitud);
    formDataToSend.append('planPracticas', formData.planPracticas);
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const idEstudiante = usuario ? usuario.id_estudiante : null;

    if (!idEstudiante) {
      alert('ID de estudiante no encontrado');
      return;
    }

    formDataToSend.append('id_estudiante', idEstudiante);
    formDataToSend.append('correo', user.correo);

    // Enviar "Pendiente" como estado por defecto
    formDataToSend.append('estado_proceso', JSON.stringify({ [idEstudiante]: 'Pendiente' }));

    // Enviar los comentarios
    formDataToSend.append('comentarios', JSON.stringify(comentarios));

    axios.post('http://localhost:5000/api/practicas', formDataToSend, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then((response) => {
        alert(response.data.message);
      })
      .catch((error) => {
        alert('Error al enviar los archivos');
      });
  };

  const handleUpdateState = (idPractica) => {
    const estadoPractica = estado[idPractica];  // Obtener el estado para la práctica actual
    const comentarioPractica = comentarios[idPractica];  // Obtener el comentario para la práctica actual

    if (!estadoPractica || !comentarioPractica) {
      alert('Faltan estado o comentario para esta práctica');
      return;
    }

    // Realizar la solicitud PUT
    axios
      .put('http://localhost:5000/api/actualizar-estado', {
        idPractica,
        estado: estadoPractica,
        comentarios: comentarioPractica
      })
      .then((response) => {
        alert('Estado actualizado correctamente');
      })
      .catch((error) => {
        alert('Error al actualizar el estado');
        console.error(error);
      });
  };

  return (
    <div>
      {userRole === 'secretaria' ? (
        <div>
          <h3>Lista de Prácticas</h3>
          {error ? (
            <div>Error: {error}</div>
          ) : practicas.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ccc' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>ID Estudiante</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Correo Estudiante</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Solicitud Inscripción</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Plan de Prácticas</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Estado Proceso</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Comentarios</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {practicas.map((practica) => (
                  <tr key={practica.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px' }}>{practica.id_estudiante}</td>
                    <td style={{ padding: '8px' }}>{practica.correo}</td>
                    <td style={{ padding: '8px' }}>{practica.solicitud_inscripcion}</td>
                    <td style={{ padding: '8px' }}>{practica.plan_practicas}</td>
                    <td style={{ padding: '8px' }}>
                      <div className="dropdown">
                        <button
                          className="btn btn-outline-primary dropdown-toggle"
                          type="button"
                          id={`dropdownMenuButton${practica.id}`}
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          disabled={userRole === 'estudiante'} // Deshabilitar si es estudiante
                        >
                          {estado[practica.id] || 'Pendiente'}
                        </button>
                        <ul className="dropdown-menu" aria-labelledby={`dropdownMenuButton${practica.id}`}>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleEstadoChange(practica.id, { target: { value: 'Pendiente' } })}
                            >
                              Pendiente
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleEstadoChange(practica.id, { target: { value: 'Aprobado' } })}
                            >
                              Aprobado
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleEstadoChange(practica.id, { target: { value: 'Rechazado' } })}
                            >
                              Rechazado
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        value={comentarios[practica.id] || ''}
                        onChange={(e) => handleComentariosChange(practica.id, e)}
                        placeholder="Escribe un comentario"
                        style={{
                          padding: '8px',
                          width: '100%',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => handleUpdateState(practica.id)}
                        style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          padding: '8px 16px',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '4px',
                        }}
                      >
                        Actualizar Estado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No se encontraron prácticas.</p>
          )}
        </div>
      ) : (
        <div>
          <h3>Formulario de Inscripción</h3>
          <form onSubmit={handleSubmit}>
            <label>
              Solicitud de Inscripción:
              <input type="file" name="solicitud" onChange={handleFileChange} required />
            </label>
            <br />
            <label>
              Plan de Prácticas:
              <input type="file" name="planPracticas" onChange={handleFileChange} required />
            </label>
            <br />
            <button type="submit">Enviar</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Proceso;
