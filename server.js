import express from 'express';
import mysql from 'mysql2';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';  // Necesario para generar el token

// Crear una instancia de express
const app = express();
const port = 5000; // Puerto donde se ejecutará el servidor

// Usar middlewares
app.use(express.json()); // Para parsear el cuerpo de las peticiones como JSON
app.use(cors()); // Habilitar CORS si es necesario

// Configuración de almacenamiento de archivos con multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ubicación de los archivos subidos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // Asegurar que los nombres de archivo sean únicos
  }
});
const upload = multer({ storage: storage });

// Configuración de la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'Erick',
  password: 'erickMV123@',
  database: 'universidad_continental'
});

// Verificar la conexión a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.stack);
    return;
  }
  console.log('Conexión a la base de datos exitosa');
});

// Función para generar el token
const generateToken = (user) => {
  const payload = {
    correo: user.correo,
    rol: user.rol
  };
  
  // Generar un token JWT (puedes ajustar la clave secreta)
  return jwt.sign(payload, 'secreta', { expiresIn: '1h' });
};

// Ruta de login
app.post('/login', (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

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

      const token = generateToken(user); // Aquí generas el token

      res.status(200).json({
        message: 'Login exitoso',
        token,
        usuario: {
          correo: user.correo,
          rol: user.rol
        }
      });
    });
  });
});

// Ruta para registrar un usuario (con contraseña cifrada)
app.post('/register', (req, res) => {
  const { correo, password, rol } = req.body;

  if (!correo || !password || !rol) {
    return res.status(400).json({ message: 'Correo, contraseña y rol son requeridos' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error al cifrar la contraseña:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    db.query('INSERT INTO usuarios (correo, password, rol) VALUES (?, ?, ?)', [correo, hashedPassword, rol], (err, result) => {
      if (err) {
        console.error('Error al guardar el usuario:', err);
        return res.status(500).json({ message: 'Error al guardar el usuario' });
      }

      res.status(201).json({ message: 'Usuario registrado exitosamente' });
    });
  });
});

// Ruta para procesar la inscripción al plan de prácticas
app.post('/api/inscripcion-plan', upload.fields([{ name: 'solicitud', maxCount: 1 }, { name: 'planPracticas', maxCount: 1 }]), (req, res) => {
  const { correo, estado } = req.body;
  const solicitud = req.files['solicitud'] ? req.files['solicitud'][0].path : null;
  const planPracticas = req.files['planPracticas'] ? req.files['planPracticas'][0].path : null;

  if (!correo || !solicitud || !planPracticas) {
    return res.status(400).json({ message: 'Correo, solicitud y plan de prácticas son requeridos' });
  }

  db.query('SELECT id FROM estudiantes WHERE correo = ?', [correo], (err, result) => {
    if (err) {
      console.error('Error al consultar el id del estudiante:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const id_estudiante = result[0].id;

    const id_proceso = 1; // Este valor debería ser dinámico según el proceso al que se está inscribiendo

    db.query('INSERT INTO practicas (id_estudiante, id_proceso, solicitud_inscripcion, plan_practicas, estado_proceso) VALUES (?, ?, ?, ?, ?)', 
      [id_estudiante, id_proceso, solicitud, planPracticas, estado], (err, result) => {
        if (err) {
          console.error('Error al guardar el plan de prácticas:', err);
          return res.status(500).json({ message: 'Error al guardar el plan de prácticas' });
        }

        res.status(201).json({ message: 'Plan de prácticas inscrito exitosamente' });
      }
    );
  });
});

// Ruta para actualizar el estado del estudiante
app.put('/actualizar-estado', (req, res) => {
  const { correo, estado, comentarios } = req.body;

  if (!correo || !estado) {
    return res.status(400).json({ message: 'Correo y estado son requeridos' });
  }

  db.query('UPDATE practicas SET estado_proceso = ?, comentarios = ? WHERE id_estudiante = (SELECT id FROM estudiantes WHERE correo = ?) AND estado_proceso != "aprobado"', 
    [estado, comentarios, correo], (err, result) => {
      if (err) {
        console.error('Error al actualizar el estado:', err);
        return res.status(500).json({ message: 'Error al actualizar el estado' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Estudiante o proceso no encontrado' });
      }

      res.status(200).json({ message: 'Estado actualizado correctamente' });
    }
  );
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
