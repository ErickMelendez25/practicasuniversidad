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
  const [informesAvance, setInformesAvance] = useState([]); // Inicializado como array vacío
  const [informesAsesoria, setInformesAsesoria] = useState([]); // Inicializado como array vacío

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

    // Obtener los informes de avance y de asesoria para la comisión
    if (user && user.rol === 'comision') {
      axios.get('http://localhost:5000/api/informes_avance_asesoria')
        .then(response => {
          console.log('Respuesta completa de la API:', response); // Muestra toda la respuesta de la API
          console.log('Datos de informes_avance:', response.data.avance); // Verifica que la clave 'avance' exista
          console.log('Datos de informes_asesoria:', response.data.asesoria); // Verifica que la clave 'asesoria' exista
  
          // Asegúrate de que las claves 'avance' y 'asesoria' sean arrays antes de asignarlas
          setInformesAvance(response.data.avance || []); // Si 'avance' es undefined, usa un array vacío
          setInformesAsesoria(response.data.asesoria || []); // Si 'asesoria' es undefined, usa un array vacío
        })
        .catch(error => {
          console.error('Error al obtener informes de avance y asesoria', error);
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

      {/* Vista de la comisión */}
      {userRole === 'comision' && (
        <div>
          <h3>Informes de Avance y Asesoría</h3>
          <table>
            <thead>
              <tr>
                <th>DNI Estudiante</th>
                <th>Nombre Estudiante</th>
                <th>DNI Asesor</th>
                <th>Nombre Asesor</th>
                <th>Informe de Avance</th>
                <th>Informe de Asesoría</th>
              </tr>
            </thead>
            <tbody>
              {informesAvance && informesAvance.length > 0 ? informesAvance.map((avance) => {
                const asesor = asesores.find(asesor => asesor.id === avance.id_asesor);
                const estudiante = estudiantes.find(estudiante => estudiante.id === avance.id_estudiante);
                const asesoria = informesAsesoria.find(asesoria => asesoria.id_estudiante === estudiante.id);
                return (
                  <tr key={avance.id}>
                    <td>{estudiante.dni}</td>
                    <td>{estudiante.nombre} {estudiante.apellido}</td>
                    <td>{asesor.dni}</td>
                    <td>{asesor.nombre} {asesor.apellido}</td>
                    <td>{avance.informe_avance}</td>
                    <td>{asesoria ? asesoria.informe_asesoria : 'No disponible'}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6">No hay informes disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProcesoRevisionInformes;
