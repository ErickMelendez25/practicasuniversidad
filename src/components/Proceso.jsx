import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Proceso() {
  const [userRole, setUserRole] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [estado, setEstado] = useState('pendiente');
  const [comentarios, setComentarios] = useState('');
  const [formData, setFormData] = useState({
    solicitud: null,
    planPracticas: null
  });

  // Obtenemos el usuario del localStorage usando la clave 'usuario'
  const user = JSON.parse(localStorage.getItem('usuario')); // Corregido: 'usuario' en lugar de 'user'

  useEffect(() => {
    if (user) {
      setUserRole(user.rol); // Obtener el rol del usuario
    }

    // Si es secretaria, obtener la lista de estudiantes
    if (user && user.rol === 'secretaria') {
      axios.get('/api/estudiantes') // Cambiar esta URL por la ruta que maneja la lista de estudiantes
        .then((response) => {
          setEstudiantes(response.data);
        })
        .catch((error) => {
          console.error('Error al obtener la lista de estudiantes', error);
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
    formDataToSend.append('correo', user.correo);  // Asegurarse de que 'user' esté definido
    formDataToSend.append('comentarios', comentarios);
    formDataToSend.append('estado', estado);

    axios.post('http://localhost:5000/api/inscripcion-plan', formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((response) => {
      alert(response.data.message);
    })
    .catch((error) => {
      alert('Error al enviar los archivos');
    });
  };

  const handleUpdateState = (correoEstudiante) => {
    axios.put('/api/actualizar-estado', {
      correo: correoEstudiante,
      estado: estado,
      comentarios: comentarios,
    })
    .then((response) => {
      alert(response.data.message);
    })
    .catch((error) => {
      alert('Error al actualizar el estado');
    });
  };

  return (
    <div>
      {userRole === 'secretaria' ? (
        <div>
          <h3>Lista de Estudiantes</h3>
          <ul>
            {estudiantes.map((estudiante) => (
              <li key={estudiante.id}>
                {estudiante.nombres} - {estudiante.estado}
                <button onClick={() => handleUpdateState(estudiante.correo)}>
                  Cambiar estado
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <h3>Formulario de Inscripción</h3>
          <form onSubmit={handleSubmit}>
            <label>
              Solicitud de Inscripción:
              <input
                type="file"
                name="solicitud"
                onChange={handleFileChange}
                required
              />
            </label>
            <br />
            <label>
              Plan de Prácticas:
              <input
                type="file"
                name="planPracticas"
                onChange={handleFileChange}
                required
              />
            </label>
            <br />
            <label>
              Estado:
              <select value={estado} onChange={handleEstadoChange}>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </label>
            <br />
            <label>
              Comentarios:
              <textarea
                value={comentarios}
                onChange={handleComentariosChange}
              />
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
