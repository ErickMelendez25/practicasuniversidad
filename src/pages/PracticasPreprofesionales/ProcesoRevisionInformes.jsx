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

  const submitInforme = async (file, tipo, selectedAsesor, selectedEstudiante) => {
    const formData = new FormData();
    formData.append(tipo, file);
    
    if (selectedAsesor) formData.append('id_asesor', selectedAsesor);
    if (selectedEstudiante) formData.append('id_estudiante', selectedEstudiante);

    try {
      const response = await axios.post(`http://localhost:5000/api/informes/${tipo}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.status === 200) {
        alert(`${tipo} enviado exitosamente`);
      } else {
        alert('Error en el servidor, no se pudo procesar el informe');
      }
    } catch (error) {
      console.error(`Error al enviar el informe de ${tipo}:`, error.response || error.message);
      alert('Error al enviar el informe');
    }
  };

  const handleSubmit = async (e, tipo) => {
    e.preventDefault();
    let file = null;

    // Validación y asignación del archivo según el tipo
    if (tipo === 'avance' && !avanceFile) {
      alert('Debe seleccionar un informe de avance.');
      return;
    } else if (tipo === 'asesoria' && (!asesoriaFile || !selectedEstudiante || !selectedAsesor)) {
      alert('Informe de asesoría, estudiante y asesor requeridos');
      return;
    } else if (tipo === 'ampliacion' && !ampliacionFile) {
      alert('Solicitud de ampliación de plazo requerida');
      return;
    } else if (tipo === 'final' && !finalFile) {
      alert('Informe final requerido');
      return;
    }

    // Asignar el archivo al tipo correspondiente
    if (tipo === 'avance') file = avanceFile;
    if (tipo === 'asesoria') file = asesoriaFile;
    if (tipo === 'ampliacion') file = ampliacionFile;
    if (tipo === 'final') file = finalFile;

    // Llamar a la función para enviar el archivo
    submitInforme(file, tipo, selectedAsesor, selectedEstudiante);
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
          <h3>Informe de Avance</h3>
          <form onSubmit={(e) => handleSubmit(e, 'avance')}>
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
          <form onSubmit={(e) => handleSubmit(e, 'asesoria')}>
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
            <button type="submit">Enviar Informe de Asesoría</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProcesoRevisionInformes;
