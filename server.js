import express from 'express';
import mysql from 'mysql2';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';

const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());

// Configuración de almacenamiento de archivos con multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Asegúrate de que la carpeta 'uploads' exista
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limitar el tamaño a 10MB por archivo
  },
});

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

      const token = generateToken(user);
      res.status(200).json({
        message: 'Login exitoso',
        token,
        usuario: { correo: user.correo, rol: user.rol }
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
  const { correo, comentarios, estado_proceso, } = req.body;

  if (!req.files || !req.files.solicitud || !req.files.planPracticas) {
    return res.status(400).json({ message: 'Ambos archivos son necesarios' });
  }

  const solicitud = req.files.solicitud[0].path;
  const planPracticas = req.files.planPracticas[0].path;

  db.query('INSERT INTO practicas (correo, solicitud_inscripcion, plan_practicas, estado_proceso, comentarios) VALUES (?, ?, ?, ?, ?)', 
    [correo, solicitud, planPracticas, estado_proceso, comentarios], 
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
  db.query('SELECT p.id, p.id_estudiante, p.solicitud_inscripcion, p.plan_practicas, p.estado_proceso, p.comentarios, e.nombres as estudiante_nombre FROM practicas p JOIN estudiantes e ON p.id_estudiante = e.id', (err, result) => {
    if (err) {
      console.error('Error al obtener las prácticas:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
    res.json(result);
  });
});

// Ruta para actualizar el estado de la práctica
app.put('/api/actualizar-estado', (req, res) => {
  const { correo, estado_proceso, comentarios } = req.body;

  if (!correo || !estado_proceso || !comentarios) {
    return res.status(400).json({ message: 'Correo, estado y comentarios son requeridos' });
  }

  db.query('UPDATE practicas SET estado_proceso = ?, comentarios = ? WHERE correo = ?', 
    [estado_proceso, comentarios, correo], (err, result) => {
      if (err) {
        console.error('Error al actualizar el estado:', err);
        return res.status(500).json({ message: 'Error al actualizar el estado' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Práctica no encontrada' });
      }

      res.status(200).json({ message: 'Estado de práctica actualizado exitosamente' });
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

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
