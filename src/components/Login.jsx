import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Agregar los console.log aquí para depurar los valores de usuario y contraseña
    console.log("Correo:", username);  // Muestra el correo ingresado
    console.log("Contraseña:", password);  // Muestra la contraseña ingresada

    try {
      // Verifica si estás en producción (Railway) o en desarrollo (localhost)
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://practicasuniversidad-production.up.railway.app/login' 
        : 'http://localhost:5000/login';

      const response = await axios.post(apiUrl, {
        correo: username,
        password: password,
      });

      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));  // Aquí guardamos "usuario"

      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Hubo un error en el login');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Bienvenido al Sistema De la UNCP</h2>
        
        <div>
          <label htmlFor="username">Correo</label>
          <input 
            type="email" 
            id="username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button type="submit">Iniciar sesión</button>
      </form>
    </div>
  );
};

export default Login;
