import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Proceso() {
  const [userRole, setUserRole] = useState(null);
  const [practicas, setPracticas] = useState([]);
  const [estado, setEstado] = useState('pendiente');
  const [comentarios, setComentarios] = useState('');
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

  const handleEstadoChange = (e) => {
    setEstado(e.target.value);
  };

  const handleComentariosChange = (e) => {
    setComentarios(e.target.value);
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
    // Obtener el id_estudiante desde localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario'));  // Recuperamos el objeto del usuario que contiene el id_estudiante
    const idEstudiante = usuario ? usuario.id_estudiante : null;
    console.log("ID Estudiante:", idEstudiante);  // Verifica que el id_estudiante se recupera correctamente

    // Verifica que el id_estudiante existe
    if (!idEstudiante) {
      alert('ID de estudiante no encontrado');
      return;
    }

    formDataToSend.append('id_estudiante', idEstudiante);  // Agregar el id_estudiante al FormData
    formDataToSend.append('correo', user.correo);
    formDataToSend.append('comentarios', comentarios);
    formDataToSend.append('estado_proceso', estado);

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
    axios.put('http://localhost:5000/api/actualizar-estado', {
      idPractica,
      estado,
      comentarios,
    })
      .then((response) => {
        alert(response.data.message);
        setPracticas((prevPracticas) =>
          prevPracticas.map((practica) =>
            practica.id === idPractica ? { ...practica, estado_proceso: estado, comentarios } : practica
          )
        );
      })
      .catch((error) => {
        alert('Error al actualizar el estado');
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
                {practicas.sort((a, b) => a.id_estudiante - b.id_estudiante).map((practica) => (
                  <tr key={practica.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px' }}>{practica.id_estudiante}</td>
                    <td style={{ padding: '8px' }}>{practica.correo}</td>
                    <td style={{ padding: '8px' }}>{practica.solicitud_inscripcion}</td>
                    <td style={{ padding: '8px' }}>{practica.plan_practicas}</td>
                    <td style={{ padding: '8px' }}>{practica.estado_proceso}</td>
                    <td style={{ padding: '8px' }}>{practica.comentarios}</td>
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
            <label>
              Estado:
              <select value={estado} onChange={handleEstadoChange} disabled>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </label>
            <br />
            <label>
              Comentarios:
              <textarea value={comentarios} onChange={handleComentariosChange} required />
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
