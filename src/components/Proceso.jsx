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
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar la visibilidad del modal
  const [comentarioTemp, setComentarioTemp] = useState(""); // Estado para almacenar el comentario temporal
  const [modalPracticaId, setModalPracticaId] = useState(null); // ID de la práctica para la que se escribe el comentario

  const user = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    if (user) {
      setUserRole(user.rol);
    }

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
    setEstado((prevEstado) => ({
      ...prevEstado,
      [id]: e.target.value, // Cambiar el estado de la práctica seleccionada
    }));
  };

  const handleComentariosChange = (id, e) => {
    setComentarios((prevComentarios) => ({
      ...prevComentarios,
      [id]: e.target.value,
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
    formDataToSend.append('comentarios', JSON.stringify(comentarios));
    formDataToSend.append('estado_proceso', JSON.stringify(estado));

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
    const estadoPractica = estado[idPractica];
    const comentarioPractica = comentarios[idPractica];

    if (!estadoPractica || !comentarioPractica) {
      alert('Faltan estado o comentario para esta práctica');
      return;
    }

    axios.put('http://localhost:5000/api/actualizar-estado', {
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

  const openModal = (idPractica) => {
    // Cargar el comentario almacenado en el estado para esta práctica
    setComentarioTemp(comentarios[idPractica] || ""); 
    setModalPracticaId(idPractica); // Guardar el ID de la práctica en el que se está escribiendo el comentario
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const saveComentario = () => {
    if (modalPracticaId !== null) {
      // Guardar el comentario en el estado correspondiente
      setComentarios((prevComentarios) => ({
        ...prevComentarios,
        [modalPracticaId]: comentarioTemp,
      }));
    }
    closeModal();
  };

  // Función para obtener el color de fondo y texto del estado
  const getEstadoStyles = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return { backgroundColor: '#FFA500', color: 'black' }; // Naranja
      case 'Aprobado':
        return { backgroundColor: '#4CAF50', color: 'white' }; // Verde
      case 'Rechazado':
        return { backgroundColor: '#f44336', color: 'white' }; // Rojo
      default:
        return { backgroundColor: '#ffffff', color: 'black' }; // Blanco por defecto
    }
  };

  return (
    <div>
      {userRole === 'secretaria' ? (
        <div>
          <h3>Lista de Prácticas</h3>
          {error ? (
            <div>Error: {error}</div>
          ) : practicas.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', tableLayout: 'auto' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ccc' }}>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>ID Estudiante</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>Correo Estudiante</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>Solicitud Inscripción</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>Plan de Prácticas</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>Estado Proceso</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>Comentarios</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {practicas.map((practica) => (
                  <tr key={practica.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '1px', textAlign: 'center', fontSize: '12px' }}>{practica.id_estudiante}</td>
                    <td style={{ padding: '1px', textAlign: 'center', fontSize: '12px' }}>{practica.correo}</td>
                    <td style={{ padding: '1px', textAlign: 'center', fontSize: '12px' }}>{practica.solicitud_inscripcion}</td>
                    <td style={{ padding: '1px', textAlign: 'center', fontSize: '12px' }}>{practica.plan_practicas}</td>
                    <td style={{ padding: '1px', textAlign: 'center', fontSize: '12px' }}>
                      <select
                        value={estado[practica.id] || 'Seleccionar Estado'}
                        onChange={(e) => handleEstadoChange(practica.id, e)}
                        style={{
                          padding: '4px',
                          fontSize: '12px',
                          backgroundColor: getEstadoStyles(estado[practica.id]).backgroundColor, // Fondo del select
                          color: getEstadoStyles(estado[practica.id]).color, // Color del texto
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                        }}
                      >
                        <option value="Seleccionar Estado" disabled>Seleccionar Estado</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="Rechazado">Rechazado</option>
                      </select>
                    </td>
                    <td style={{ padding: '1px', textAlign: 'center' }}>
                      <button
                        onClick={() => openModal(practica.id)}
                        style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          padding: '8px 16px',
                        }}
                      >
                        Comentario
                      </button>
                    </td>
                    <td style={{ padding: '1px', textAlign: 'center' }}>
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
                        Actualizar
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

      {/* Modal para escribir comentario */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <h4>Escribir Comentario</h4>
            <textarea
              value={comentarioTemp}
              onChange={(e) => setComentarioTemp(e.target.value)}
              style={{ width: '100%', height: '100px', padding: '2px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={saveComentario}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '9px',
                }}
              >
                Listo
              </button>
              <button
                onClick={closeModal}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  padding: '8px 15px',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '9px',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Proceso;
