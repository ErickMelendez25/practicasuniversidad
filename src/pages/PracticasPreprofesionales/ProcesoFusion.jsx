import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ProcesoFusion() {
    const [userRole, setUserRole] = useState(null);
    const [inscripciones, setInscripciones] = useState([]);
    const [estado, setEstado] = useState({});
    const [comentarios, setComentarios] = useState({});
    const [notificaciones, setNotificaciones] = useState([]);
    const [solicitudFile, setSolicitudFile] = useState(null);
    const [fichaFile, setFichaFile] = useState(null);
    const [informeFile, setInformeFile] = useState(null);
    const user = JSON.parse(localStorage.getItem('usuario'));

    useEffect(() => {
        if (user) {
            setUserRole(user.rol);
        }
        if (user && (user.rol === 'secretaria' || user.rol === 'comision')) {
            // Obtener las inscripciones solo una vez
            axios.get('http://localhost:5000/api/inscripciones') // Asegúrate de que esta URL sea correcta
                .then((response) => {
                    setInscripciones(response.data);
                    if (Object.keys(estado).length === 0) {
                        const initialEstado = {};
                        response.data.forEach(inscripcion => {
                            initialEstado[inscripcion.id] = inscripcion.estado_proceso;
                        });
                        setEstado(initialEstado);
                    }
                })
                .catch((error) => {
                    console.error('Error al obtener las inscripciones:', error);
                });
        }
        if (user && user.rol === 'estudiante') {
            // Obtener notificaciones para el estudiante
            axios.get(`http://localhost:5000/api/notificaciones?id_estudiante=${user.id_estudiante}`)
                .then((response) => {
                    setNotificaciones(response.data);
                })
                .catch((error) => {
                    console.error('Error al obtener notificaciones', error);
                });
        }
    }, [user, estado]);

    const handleFileChange = (e) => {
        if (e.target.name === "solicitud") {
            setSolicitudFile(e.target.files[0]);
        } else if (e.target.name === "ficha") {
            setFichaFile(e.target.files[0]);
        } else if (e.target.name === "informe") {
            setInformeFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!solicitudFile || !fichaFile || !informeFile) {
            alert('Todos los archivos son requeridos');
            return;
        }
        const formData = new FormData();
        formData.append('solicitud', solicitudFile);
        formData.append('ficha', fichaFile);
        formData.append('informe', informeFile);
        formData.append('id_estudiante', user.id_estudiante);

        try {
            await axios.post('http://localhost:5000/api/inscripcion_emision', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('Documentos enviados exitosamente');
            // Resetear archivos después de enviar
            setSolicitudFile(null);
            setFichaFile(null);
            setInformeFile(null);
        } catch (error) {
            console.error('Error al enviar documentos:', error);
            alert('Error al enviar documentos');
        }
    };

    const handleEstadoChange = (id, e) => {
        // Solo actualizamos el estado local sin interferir con el valor en la base de datos
        setEstado((prevEstado) => ({ ...prevEstado, [id]: e.target.value }));
    };

    const handleComentarioChange = (id, e) => {
        setComentarios((prevComentarios) => ({ ...prevComentarios, [id]: e.target.value }));
    };

    const handleUpdateState = (idInscripcion, estadoSeleccionado) => {
      axios.put('http://localhost:5000/api/actualizar_inscripcion', { 
          id_inscripcion: idInscripcion, 
          estado: estadoSeleccionado 
      })
      .then(() => {
          alert('Estado actualizado');
          // Después de actualizar el estado en la base de datos, actualizamos el estado local
          setEstado((prevEstado) => ({ ...prevEstado, [idInscripcion]: estadoSeleccionado }));
      })
      .catch((error) => {
          alert('Error al actualizar el estado');
      });
  };

    const handleComentarioSubmit = (idInscripcion, comentario) => {
        // Validar que el comentario no esté vacío
        if (!comentario.trim()) {
            alert('Por favor, ingrese un comentario antes de enviar.');
            return;
        }
        axios.post('http://localhost:5000/api/comentarios', { idInscripcion, comentario })
            .then(() => {
                alert('Comentario enviado');
                // Actualizamos el comentario en el estado local
                setComentarios((prevComentarios) => ({ ...prevComentarios, [idInscripcion]: comentario }));
            })
            .catch((error) => {
                alert('Error al enviar comentario');
                console.error(error);
            });
    };

    return (
        <div>
            {/* Vista Estudiante */}
            {userRole === 'estudiante' && (
                <div>
                    <h3>Formulario de Inscripción</h3>
                    <form onSubmit={handleSubmit}>
                        <label>
                            Solicitud de Inscripción:
                            <input type="file" name="solicitud" onChange={handleFileChange} required />
                        </label>
                        <br />
                        <label>
                            Ficha de Revisión Aprobada:
                            <input type="file" name="ficha" onChange={handleFileChange} required />
                        </label>
                        <br />
                        <label>
                            Informe Final Empastado:
                            <input type="file" name="informe" onChange={handleFileChange} required />
                        </label>
                        <br />
                        <button type="submit">Enviar</button>
                    </form>
                    <h3>Notificaciones</h3>
                    {notificaciones.length > 0 ? (
                        <ul>
                            {notificaciones.map((noti, index) => (
                                <li key={index}>{noti.mensaje}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No tienes notificaciones.</p>
                    )}
                </div>
            )}
            
            {/* Vista Secretaria */}
            {userRole === 'secretaria' && (
                <div>
                    <h3>Lista de Inscripciones</h3>
                    {inscripciones.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID Estudiante</th>
                                    <th>Correo Estudiante</th>
                                    <th>Solicitud Inscripción</th>
                                    <th>Ficha de Revisión</th>
                                    <th>Informe Final</th>
                                    <th>Estado Proceso</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inscripciones.map((inscripcion) => (
                                    <tr key={inscripcion.id}>
                                        <td>{inscripcion.id_estudiante}</td>
                                        <td>{inscripcion.correo}</td>
                                        <td><a href={`http://localhost:5000/uploads/${inscripcion.solicitud_inscripcion_emision}`} target="_blank">Ver archivo</a></td>
                                        <td><a href={`http://localhost:5000/uploads/${inscripcion.ficha_revision}`} target="_blank">Ver archivo</a></td>
                                        <td><a href={`http://localhost:5000/uploads/${inscripcion.informe_final}`} target="_blank">Ver archivo</a></td>

                                        {/* Estado y acciones */}
                                        <td>
                                            <select value={estado[inscripcion.id] || 'Pendiente'} onChange={(e) => handleEstadoChange(inscripcion.id, e)}>
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="Aprobada">Aprobada</option>
                                                <option value="Derivada a Comisión">Derivada a Comisión</option>
                                                <option value="Rechazada">Rechazada</option>
                                            </select>
                                        </td>

                                        {/* Botón para actualizar el estado */}
                                        <td><button onClick={() => handleUpdateState(inscripcion.id, estado[inscripcion.id])}>Actualizar</button></td>
                                    </tr>))}
                            </tbody>
                        </table>) : (<p>No hay inscripciones registradas.</p>)}
                </div>)}

            {/* Vista Comisión */}
            {userRole === 'comision' && (
                <div>
                    <h3>Prácticas Derivadas a Comisión</h3>
                    {inscripciones.filter(inscripcion => inscripcion.estado_proceso === 'Derivada a Comisión').length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID Estudiante</th>
                                    <th>Correo Estudiante</th>
                                    <th>Solicitud Inscripción</th>
                                    <th>Ficha de Revisión</th>
                                    <th>Informe Final</th>
                                    <th>Comentario Comisión</th>
                                    <th>Estado</th>
                                    <th>Actualizar Estado</th>
                                </tr>
                            </thead>
                            <tbody>{inscripciones.filter(inscripcion => inscripcion.estado_proceso === 'Derivada a Comisión').map((inscripcion) => (
                                <tr key={inscripcion.id}>
                                    <td>{inscripcion.id_estudiante}</td>
                                    <td>{inscripcion.correo}</td>
                                    <td><a href={`http://localhost:5000/uploads/${inscripcion.solicitud_inscripcion_emision}`} target="_blank">Ver archivo</a></td>
                                    <td><a href={`http://localhost:5000/uploads/${inscripcion.ficha_revision}`} target="_blank">Ver archivo</a></td>
                                    <td><a href={`http://localhost:5000/uploads/${inscripcion.informe_final}`} target="_blank">Ver archivo</a></td>

                                    {/* Comentarios y estado */}
                                    <td><textarea value={comentarios[inscripcion.id] || ''} onChange={(e) => handleComentarioChange(inscripcion.id, e)} placeholder="Agregar comentario" /></td>

                                    {/* Estado de la inscripción */}
                                    <td><select value={estado[inscripcion.id] || 'Pendiente'} onChange={(e) => handleEstadoChange(inscripcion.id, e)}>
                                        <option value="Pendiente"></option><option value="Aprobada">Aprobada</option><option value="Rechazada">Rechazada</option></select></td>

                                    {/* Acciones para la comisión */}
                                    <td><button onClick={() => handleComentarioSubmit(inscripcion.id, comentarios[inscripcion.id])}>Enviar Comentario</button><button onClick={() => handleUpdateState(inscripcion.id, estado[inscripcion.id])}>Actualizar</button></td></tr>))}</tbody></table>) : (<p>No hay prácticas derivadas a la Comisión.</p>)}
                </div>)}
        </div>);
}

export default ProcesoFusion;
