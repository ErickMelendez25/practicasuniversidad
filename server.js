  import express from 'express';
  import mysql from 'mysql2';
  import bcrypt from 'bcryptjs';
  import cors from 'cors';
  import multer from 'multer';
  import path from 'path';
  import fs from 'fs';
  import jwt from 'jsonwebtoken';

  // Obtener la ruta del directorio actual (corregido para Windows)
  const __dirname = path.resolve();

  const app = express();
  const port = 5000;

  app.use(express.json());
  app.use(cors());

  // Verificar si la carpeta 'uploads' existe, si no, crearla
  const uploadDirectory = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  }

  // Configuración de almacenamiento de archivos con multer
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Usar la fecha para garantizar nombres únicos
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // Limitar el tamaño a 10MB por archivo
    },
  });

  // Servir archivos estáticos desde la carpeta 'uploads'
  app.use('/uploads', express.static(uploadDirectory));

  // Configuración de la base de datos
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'Erick',
    password: 'erickMV123@',
    database: 'universidad_continental'
  });

  db.connect((err) => {
    if (err) {
      console.error('Error al conectar a la base de datos:', err.stack);
      return;
    }
    console.log('Conexión a la base de datos exitosa');
    cifrarContraseñas();  // Llamar a la función para cifrar contraseñas si es necesario
  });

  // Función para generar el token
  const generateToken = (user) => {
    const payload = { correo: user.correo, rol: user.rol };
    return jwt.sign(payload, 'secreta', { expiresIn: '1h' });
  };

  app.post('/login', (req, res) => {
    const { correo, password } = req.body;
  
    if (!correo || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    }
  
    // Verifica el usuario en la tabla usuarios
    db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, result) => {
      if (err) {
        console.error('Error al consultar el usuario:', err);
        return res.status(500).json({ message: 'Error en el servidor' });
      }
  
      if (result.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      const user = result[0];
  
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Error al comparar las contraseñas:', err);
          return res.status(500).json({ message: 'Error en el servidor' });
        }
  
        if (!isMatch) {
          return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
  
        // Aquí buscamos si el usuario es asesor
        
  
        if (user.rol === 'asesor') {
          // Si el rol es 'asesor', buscamos el id_asesor en la tabla asesores
          db.query('SELECT id FROM asesores WHERE correo = ?', [user.correo], (err, asesorResult) => {
            if (err) {
              console.error('Error al consultar el asesor:', err);
              return res.status(500).json({ message: 'Error en el servidor' });
            }
  
            // Si se encuentra el asesor, asignamos el id_asesor
            const id_asesor = asesorResult.length > 0 ? asesorResult[0].id : null;
  
            // Ahora buscamos el id del estudiante
            db.query('SELECT id FROM estudiantes WHERE correo = ?', [user.correo], (err, studentResult) => {
              if (err) {
                console.error('Error al consultar el estudiante:', err);
                return res.status(500).json({ message: 'Error en el servidor' });
              }
  
              const id_estudiante = studentResult.length > 0 ? studentResult[0].id : null;
  
              // Generamos el token y enviamos la respuesta
              const token = generateToken(user);
              res.status(200).json({
                message: 'Login exitoso',
                token,
                usuario: {
                  correo: user.correo,
                  rol: user.rol,
                  id_estudiante: id_estudiante,  // Incluye id_estudiante aquí
                  id_asesor: id_asesor  // Incluye id_asesor aquí
                }
              });
            });
          });
        } else {
          // Si no es un asesor, solo obtenemos el id del estudiante
          db.query('SELECT id FROM estudiantes WHERE correo = ?', [user.correo], (err, studentResult) => {
            if (err) {
              console.error('Error al consultar el estudiante:', err);
              return res.status(500).json({ message: 'Error en el servidor' });
            }
  
            const id_estudiante = studentResult.length > 0 ? studentResult[0].id : null;
  
            const token = generateToken(user);
            res.status(200).json({
              message: 'Login exitoso',
              token,
              usuario: {
                correo: user.correo,
                rol: user.rol,
                id_estudiante: id_estudiante,  // Incluye id_estudiante aquí
                id_asesor: null  // En caso de que no sea un asesor
              }
            });
          });
        }
      });
    });
  });
  

  // Ruta para registrar un usuario (con contraseña cifrada)
  app.post('/register', (req, res) => {
    const { correo, password, rol } = req.body;

    if (!correo || !password || !rol) {
      return res.status(400).json({ message: 'Correo, contraseña y rol son requeridos' });
    }

    // Cifrar la contraseña
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error al cifrar la contraseña:', err);
        return res.status(500).json({ message: 'Error en el servidor' });
      }

      // Insertar el nuevo usuario con la contraseña cifrada
      db.query('INSERT INTO usuarios (correo, password, rol) VALUES (?, ?, ?)', 
      [correo, hashedPassword, rol], (err, result) => {
        if (err) {
          console.error('Error al guardar el usuario:', err);
          return res.status(500).json({ message: 'Error al guardar el usuario' });
        }
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
      });
    });
  });

  // Ruta para registrar la práctica (subir los archivos y agregar estado)
  app.post('/api/practicas', upload.fields([
    { name: 'solicitud', maxCount: 1 },
    { name: 'planPracticas', maxCount: 1 }
  ]), (req, res) => {
    const { id_estudiante, comentarios, estado_proceso } = req.body;

    if (!id_estudiante) {
      return res.status(400).json({ message: 'El ID del estudiante es requerido' });
    }

    if (!req.files || !req.files.solicitud || !req.files.planPracticas) {
      return res.status(400).json({ message: 'Ambos archivos son necesarios' });
    }

    // Solo almacena los nombres de los archivos, no las rutas absolutas
    const solicitud = req.files.solicitud[0].filename;
    const planPracticas = req.files.planPracticas[0].filename;

    let estadoFinal = 'Pendiente';

    if (estado_proceso) {
      try {
        const estado = JSON.parse(estado_proceso);
        estadoFinal = estado[Object.keys(estado)[0]] || 'Pendiente';
      } catch (err) {
        console.error('Error al parsear estado_proceso:', err);
        return res.status(400).json({ message: 'El formato de estado_proceso es inválido' });
      }
    }

    db.query('INSERT INTO practicas (id_estudiante, solicitud_inscripcion, plan_practicas, estado_proceso, comentarios) VALUES (?, ?, ?, ?, ?)', 
      [id_estudiante, solicitud, planPracticas, estadoFinal, comentarios], 
      (err, result) => {
        if (err) {
          console.error('Error al guardar en la base de datos:', err);
          return res.status(500).json({ message: 'Error al guardar en la base de datos' });
        }
        res.status(200).json({ message: 'Prácticas enviadas con éxito' });
      });
  });

  // Ruta para obtener las prácticas
  app.get('/api/practicas', (req, res) => {
    const query = `
      SELECT p.*, e.correo
      FROM practicas p
      JOIN estudiantes e ON p.id_estudiante = e.id
      ORDER BY p.fecha_creacion DESC;
    `;

    db.query(query, (err, result) => {
      if (err) {
        console.error('Error al ejecutar la consulta:', err);
        res.status(500).send('Error al obtener los datos de las prácticas');
        return;
      }
      res.json(result);
    });
  });

  // Ruta para actualizar el estado de la práctica
  app.put('/api/actualizar-estado', (req, res) => {
    const { idPractica, estado } = req.body;

    if (!idPractica || !estado) {
      return res.status(400).json({ message: 'El ID de la práctica y el estado son requeridos' });
    }

    try {
      db.query('UPDATE practicas SET estado_proceso = ? WHERE id = ?', [estado, idPractica], async (err, result) => {
        if (err) {
          console.error('Error al actualizar el estado:', err);
          return res.status(500).json({ message: 'Error al actualizar el estado' });
        }

        const [practica] = await db.promise().query('SELECT id_estudiante FROM practicas WHERE id = ?', [idPractica]);
        const { id_estudiante } = practica[0];

        const mensaje = `El estado de tu práctica ha cambiado a: ${estado}`;
        await db.promise().query('INSERT INTO notificaciones (id_estudiante, mensaje) VALUES (?, ?)', [id_estudiante, mensaje]);

        res.status(200).json({ message: 'Estado actualizado y notificación enviada' });
      });
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el estado', error: error.message });
    }
  });

  // Ruta para obtener los comentarios de la comisión
  app.get('/api/comentarios', (req, res) => {
    const { idPractica } = req.query;

    if (!idPractica) {
      return res.status(400).json({ message: 'El ID de la práctica es requerido' });
    }

    db.query('SELECT * FROM libro_inscripcion WHERE id_practica = ?', [idPractica], (err, result) => {
      if (err) {
        console.error('Error al obtener los comentarios:', err);
        return res.status(500).json({ message: 'Error al obtener los comentarios' });
      }

      res.status(200).json(result);
    });
  });

  // Ruta para guardar los comentarios en la tabla 'practicas'
  app.post('/api/comentarios', (req, res) => {
    const { idPractica, comentario } = req.body;

    const query = `
      UPDATE practicas
      SET comentarios = ?
      WHERE id = ?
    `;

    db.query(query, [comentario, idPractica], (err, result) => {
      if (err) {
        console.error('Error al actualizar el comentario:', err);
        return res.status(500).send('Error al guardar el comentario');
      }
      res.status(200).send('Comentario guardado');
    });
  });

  // Ruta para inscribir la práctica y actualizar el estado en la tabla 'practicas'
  app.post('/api/inscribir', (req, res) => {
    const { idPractica, estado, comentarios } = req.body;

    const query = `
      UPDATE practicas
      SET estado_proceso = ?, estado_secretaria = ?, comentarios = ?
      WHERE id = ?
    `;

    db.query(query, [estado, estado, comentarios, idPractica], (err, result) => {
      if (err) {
        console.error('Error al inscribir la práctica:', err);
        return res.status(500).send('Error al inscribir la práctica');
      }

      const notificationQuery = `
        INSERT INTO notificaciones (id_estudiante, mensaje)
        VALUES (?, ?)
      `;
      db.query(notificationQuery, [idEstudiante, `Tu inscripción en la práctica ha sido ${estado}.`], (err2) => {
        if (err2) {
          console.error('Error al agregar la notificación al estudiante:', err2);
        }
      });

      res.status(200).send('Práctica inscrita y notificación enviada');
    });
  });

  // Función para cifrar todas las contraseñas de los usuarios
  const cifrarContraseñas = () => {
    db.query('SELECT * FROM usuarios WHERE password NOT LIKE "$2a$%"', (err, result) => {
      if (err) {
        console.error('Error al obtener usuarios:', err);
        return;
      }

      if (result.length === 0) {
        console.log('No se encontraron usuarios con contraseñas en texto plano');
        return;
      }

      result.forEach(user => {
        const plainPassword = user.password;

        bcrypt.hash(plainPassword, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Error al cifrar la contraseña del usuario', user.id, ':', err);
            return;
          }

          db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, user.id], (err, updateResult) => {
            if (err) {
              console.error('Error al actualizar la contraseña del usuario', user.id, ':', err);
              return;
            }

            console.log('Contraseña del usuario', user.id, 'actualizada con éxito');
          });
        });
      });
    });
  };


  // Ruta para obtener las notificaciones del estudiante
  app.get('/api/notificaciones', (req, res) => {
    const { id_estudiante } = req.query;

    if (!id_estudiante) {
      return res.status(400).json({ message: 'El ID del estudiante es requerido' });
    }

    db.query('SELECT * FROM notificaciones WHERE id_estudiante = ? ORDER BY fecha DESC', [id_estudiante], (err, result) => {
      if (err) {
        console.error('Error al obtener las notificaciones:', err);
        return res.status(500).json({ message: 'Error al obtener las notificaciones' });
      }

      res.status(200).json(result);
    });
  });



  //PROCESO 2 REVISON DE INFORMES

  //ASESORRRRRR:

  // Endpoint para obtener los estudiantes con sus informes de asesoría

  app.get('/api/estudiantes', (req, res) => {
    // Consulta SQL para obtener los asesores
    const query = 'SELECT id, nombres, apellido_paterno, apellido_materno,dni FROM estudiantes';

    // Ejecuta la consulta a la base de datos
    db.query(query, (err, results) => {
      if (err) {
        // Si hay un error en la consulta, responde con un error 500
        return res.status(500).json({ error: 'Error al obtener los asesores.' });
      }

      // Si la consulta fue exitosa, responde con los resultados en formato JSON
      res.json(results);
    });
  });

  app.post('/api/informes/asesoria', upload.single('asesoria'), (req, res) => {
    const { id_asesor, id_estudiante } = req.body;
    const informe_asesoria = req.file ? req.file.filename : null;
  
    if (!id_estudiante || !id_asesor || !informe_asesoria) {
      return res.status(400).json({ error: 'Informe de asesoría, estudiante y asesor requeridos.' });
    }
  
    const query = `
      INSERT INTO informes_asesoria (id_estudiante, id_asesor, informe_asesoria)
      VALUES (?, ?, ? )
    `;
    db.query(query, [id_estudiante, id_asesor, informe_asesoria], (err, result) => {
      if (err) {
        console.error('Error al guardar el informe de asesoría:', err);
        return res.status(500).json({ error: 'Error al guardar el informe de asesoría.' });
      }
      res.status(200).json({ message: 'Informe de asesoría enviado correctamente.' });
    });
  });
  
  // Endpoint para recibir el informe de avance
  app.post('/api/informes/avance', upload.single('avance'), (req, res) => {
    const { id_estudiante, id_asesor } = req.body;
    const informe_avance = req.file ? req.file.filename : null;

    if (!id_estudiante || !id_asesor || !informe_avance) {
      return res.status(400).json({ error: 'Informe de avance, estudiante y asesor requeridos.' });
    }

    const query = `
      INSERT INTO informes_avance (id_estudiante, id_asesor, informe_avance)
      VALUES (?, ?, ?)
    `;
    db.query(query, [id_estudiante, id_asesor, informe_avance], (err, result) => {
      if (err) {
        console.error('Error al guardar el informe de avance:', err);
        return res.status(500).json({ error: 'Error al guardar el informe de avance.' });
      }
      res.status(200).json({ message: 'Informe de avance enviado correctamente.' });
    });
  });




  // Endpoint para obtener la lista de asesores
  app.get('/api/asesores', (req, res) => {
    // Consulta SQL para obtener los asesores
    const query = 'SELECT id, dni, nombre_asesor, apellido_paterno, apellido_materno FROM asesores';

    // Ejecuta la consulta a la base de datos
    db.query(query, (err, results) => {
      if (err) {
        // Si hay un error en la consulta, responde con un error 500
        return res.status(500).json({ error: 'Error al obtener los asesores.' });
      }

      // Si la consulta fue exitosa, responde con los resultados en formato JSON
      res.json(results);
    });
  });





  // Endpoint para obtener todos los informes de avance
  app.get('/api/informes', (req, res) => {
    const query = 'SELECT * FROM informes_avance';
    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener los informes.' });
      }
      res.json(results);
    });
  });



  app.post('/api/informes/ampliacion', upload.single('ampliacion'), (req, res) => {
    const { id_estudiante } = req.body;
    const ampliacion = req.file.filename;

    const query = 'INSERT INTO informes_ampliacion (id_estudiante, ampliacion) VALUES (?, ?)';
    db.query(query, [id_estudiante, ampliacion], (err, result) => {
      if (err) {
        console.error('Error al guardar la solicitud de ampliación:', err);
        return res.status(500).send('Error al guardar la solicitud de ampliación');
      }
      res.send({ message: 'Solicitud de ampliación recibida exitosamente' });
    });
  });

  app.post('/api/informes/final', upload.single('final'), (req, res) => {
    const { id_estudiante } = req.body;
    const final = req.file.filename;

    const query = 'INSERT INTO informes_final (id_estudiante, final, estado) VALUES (?, ?, ?)';
    db.query(query, [id_estudiante, final, 'Pendiente'], (err, result) => {
      if (err) {
        console.error('Error al guardar el informe final:', err);
        return res.status(500).send('Error al guardar el informe final');
      }
      res.send({ message: 'Informe final recibido exitosamente' });
    });
  });

  // Ruta para actualizar el estado del informe
  app.put('/api/actualizar-estado', (req, res) => {
    const { idInforme, estado } = req.body;
    const query = 'UPDATE informes SET estado = ? WHERE id = ?';
    db.query(query, [estado, idInforme], (err, result) => {
      if (err) {
        console.error('Error al actualizar el estado:', err);
        return res.status(500).send('Error al actualizar el estado');
      }
      sendEmailToStudent(idInforme, `Tu informe ha sido actualizado a ${estado}`);
      res.send({ message: 'Estado actualizado' });
    });
  });

  // Función para enviar correo electrónico al estudiante
  function sendEmailToStudent(idInforme, message) {
    // Configuración del servicio de correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your_email@gmail.com',
        pass: 'your_email_password' // Usa contraseñas de aplicación si es necesario
      }
    });

    // Consulta para obtener el correo electrónico del estudiante
    const query = 'SELECT email FROM estudiantes WHERE id_estudiante = ?';
    db.query(query, [idInforme], (err, result) => {
      if (err) {
        console.error('Error al obtener el correo del estudiante:', err);
        return;
      }
      const studentEmail = result[0].email;

      const mailOptions = {
        from: 'your_email@gmail.com',
        to: studentEmail,
        subject: 'Actualización de Estado de Informe',
        text: message
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error al enviar correo:', error);
          return;
        }
        console.log('Correo enviado: ' + info.response);
      });
    });
  };

  // Ruta para obtener todos los informes
  app.get('/api/informes', (req, res) => {
    const query = 'SELECT * FROM informes'; // Asegúrate de usar la tabla correcta (informe_avance, informe_asesoria, etc.)
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error al obtener los informes:', err);
        return res.status(500).send('Error al obtener los informes');
      }
      if (results.length === 0) {
        return res.status(404).send('No se presentan registros');
      }
      res.json(results);
    });
  });


  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
