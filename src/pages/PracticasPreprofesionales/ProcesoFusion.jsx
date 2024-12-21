import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ProcesoFusion() {
    const [userRole, setUserRole] = useState(null);
    const [inscripciones, setInscripciones] = useState([]);
    const [estado, setEstado] = useState({});
    const [comentarios, setComentarios] = useState({});
    const [notificaciones, setNotificaciones] = useState([]);
    const [certificadoFile, setCertificadoFile] = useState(null);
    const [files, setFiles] = useState({
        solicitud: null,
        ficha: null,
        informe: null,
    });
    const user = JSON.parse(localStorage.getItem('usuario'));

      // Determinamos la URL de la API dependiendo del entorno
    const apiUrl = process.env.NODE_ENV === 'production' 
    ? 'https://practicasuniversidad-production.up.railway.app' 
    : 'http://localhost:5000';

    useEffect(() => {
        if (user) {
            setUserRole(user.rol);
        }
        if (user && (user.rol === 'secretaria' || user.rol === 'comision')) {
            // Obtener las inscripciones solo una vez
            axios.get(`${apiUrl}/api/inscripciones`) // Asegúrate de que esta URL sea correcta
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
            axios.get(`${apiUrl}/api/notificaciones?id_estudiante=${user.id_estudiante}`)
                .then((response) => {
                    setNotificaciones(response.data);
                })
                .catch((error) => {
                    console.error('Error al obtener notificaciones', error);
                });
        }
    }, [user, estado]);

    const handleFileChange = (e) => {
        if (e.target.name === "certificado") {
            setCertificadoFile(e.target.files[0]);
        } else {
            setFiles((prevFiles) => ({
                ...prevFiles,
                [e.target.name]: e.target.files[0],
            }));
        }
    };

    const handleSubmitEstudiante = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('solicitud', files.solicitud);
        formData.append('ficha', files.ficha);
        formData.append('informe', files.informe);
        formData.append('id_estudiante', user.id_estudiante);

        axios.post(`${apiUrl}/api/inscripcion_emision`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(() => {
                alert('Archivos enviados correctamente');
                setFiles({
                    solicitud: null,
                    ficha: null,
                    informe: null,
                });
            })
            .catch((error) => {
                console.error('Error al enviar los archivos:', error);
                alert('Error al enviar los archivos');
            });
    };

    const handleEstadoChange = (id, e) => {
        setEstado((prevEstado) => ({ ...prevEstado, [id]: e.target.value }));
    };

    const handleComentarioChange = (id, e) => {
        setComentarios((prevComentarios) => ({ ...prevComentarios, [id]: e.target.value }));
    };

    const handleUpdateState = (idInscripcion, estadoSeleccionado) => {
        axios.put(`${apiUrl}/api/actualizar_inscripcion`, {
            id_inscripcion: idInscripcion,
            estado: estadoSeleccionado
        })
        .then(() => {
            alert('Estado actualizado');
            setEstado((prevEstado) => ({ ...prevEstado, [idInscripcion]: estadoSeleccionado }));
        })
        .catch((error) => {
            alert('Error al actualizar el estado');
        });
    };

    const handleComentarioSubmit = (idInscripcion, comentario) => {
        if (!comentario.trim()) {
            alert('Por favor, ingrese un comentario antes de enviar.');
            return;
        }
        axios.post(`${apiUrl}/api/comentarios`, { idInscripcion, comentario })
            .then(() => {
                alert('Comentario enviado');
                setComentarios((prevComentarios) => ({ ...prevComentarios, [idInscripcion]: comentario }));
            })
            .catch((error) => {
                alert('Error al enviar comentario');
                console.error(error);
            });
    };

    const handleSubmitCertificado = (idEstudiante, correo) => {
        if (!certificadoFile) {
            alert('Por favor, selecciona un archivo para subir.');
            return;
        }
        const formData = new FormData();
        formData.append('certificado', certificadoFile);
        formData.append('id_estudiante', idEstudiante);
        formData.append('correo', correo);

        axios.post(`${apiUrl}/api/certificado`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(() => {
                alert('Certificado enviado exitosamente');
                setCertificadoFile(null);  // Limpiar el archivo después de enviar
            })
            .catch((error) => {
                console.error('Error al enviar el certificado:', error.response || error);
                alert('Error al enviar el certificado');
            });
    };

    return (
        <div style={{ padding: '20px', overflowX: 'auto' }}>
            {/* Vista Estudiante */}
            {userRole === 'estudiante' && (
                <div>
                    <h3>Formulario de Inscripción</h3>
                    <form onSubmit={handleSubmitEstudiante}>
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
                        <table style={{ width: '100%', borderCollapse: 'collapse', overflowX: 'auto' }}>
                            <thead>
                                <tr>
                                    <th>ID Estudiante</th>
                                    <th>Correo Estudiante</th>
                                    <th>Solicitud Inscripción</th>
                                    <th>Ficha de Revisión</th>
                                    <th>Informe Final</th>
                                    <th>Estado Proceso</th>
                                    <th>Acciones</th>
                                    <th>Subir Certificado</th>
                                    <th>Enviar Certificado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inscripciones.map((inscripcion) => (
                                    <tr key={inscripcion.id}>
                                        <td>{inscripcion.id_estudiante}</td>
                                        <td>{inscripcion.correo}</td>
                                        <td><a href={`${apiUrl}/uploads/${inscripcion.solicitud_inscripcion_emision}`} target="_blank">Ver archivo</a></td>
                                        <td><a href={`${apiUrl}/uploads/${inscripcion.ficha_revision}`} target="_blank">Ver archivo</a></td>
                                        <td><a href={`${apiUrl}/uploads/${inscripcion.informe_final}`} target="_blank">Ver archivo</a></td>

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

                                        {/* Solo si el estado es Aprobada, agregar columnas para subir el certificado */}
                                        {estado[inscripcion.id] === 'Aprobada' && (
                                            <>
                                                <td>
                                                    <input type="file" name="certificado" onChange={handleFileChange} />
                                                </td>
                                                <td>
                                                    <button onClick={() => handleSubmitCertificado(inscripcion.id_estudiante, inscripcion.correo)}>
                                                        Enviar Certificado
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No hay inscripciones registradas.</p>
                    )}
                </div>
            )}

            {/* Vista Comisión */}
            {userRole === 'comision' && (
                <div>
                    <h3>Prácticas Derivadas a Comisión</h3>
                    {inscripciones.filter(inscripcion => inscripcion.estado_proceso === 'Derivada a Comisión').length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', overflowX: 'auto' }}>
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
                            <tbody>
                                {inscripciones.filter(inscripcion => inscripcion.estado_proceso === 'Derivada a Comisión').map((inscripcion) => (
                                    <tr key={inscripcion.id}>
                                        <td>{inscripcion.id_estudiante}</td>
                                        <td>{inscripcion.correo}</td>
                                        <td><a href={`${apiUrl}/uploads/${inscripcion.solicitud_inscripcion_emision}`} target="_blank">Ver archivo</a></td>
                                        <td><a href={`${apiUrl}/uploads/${inscripcion.ficha_revision}`} target="_blank">Ver archivo</a></td>
                                        <td><a href={`${apiUrl}/uploads/${inscripcion.informe_final}`} target="_blank">Ver archivo</a></td>
                                        <td>
                                            <textarea value={comentarios[inscripcion.id] || ''} onChange={(e) => handleComentarioChange(inscripcion.id, e)} placeholder="Agregar comentario" />
                                        </td>
                                        <td>
                                            <select value={estado[inscripcion.id] || 'Pendiente'} onChange={(e) => handleEstadoChange(inscripcion.id, e)}>
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="Aprobada">Aprobada</option>
                                                <option value="Rechazada">Rechazada</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button onClick={() => handleComentarioSubmit(inscripcion.id, comentarios[inscripcion.id])}>Enviar Comentario</button>
                                            <button onClick={() => handleUpdateState(inscripcion.id, estado[inscripcion.id])}>Actualizar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No hay prácticas derivadas a la Comisión.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default ProcesoFusion;
