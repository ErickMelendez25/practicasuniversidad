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
  const [asesores, setAsesores] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedAsesor, setSelectedAsesor] = useState('');
  const [selectedEstudiante, setSelectedEstudiante] = useState('');

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
        </div>
      )}
    </div>
  );
}

export default ProcesoRevisionInformes;
