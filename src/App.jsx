import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Importa Navigate para redirigir
import DashboardHeader from './components/DashboardHeader';
import DashboardFooter from './components/DashboardFooter';
import DashboardMain from './components/DashboardMain';
import Login from './components/Login';
import VistaOpcion from './components/VistaOpcion';
import Proceso from './components/Proceso'; // Componente para mostrar el proceso
import Macroprocesos from './pages/Macroprocesos';
import './styles/Global.css';

// Componente para proteger las rutas
function ProtectedRoute({ element }) {
  const isAuthenticated = localStorage.getItem('authToken'); // Verifica si el token existe

  // Si no está autenticado, redirige al login, sino muestra el componente solicitado
  return isAuthenticated ? element : <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta para Login */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Ruta para Dashboard - Protección con ProtectedRoute */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              element={
                <>
                  <DashboardHeader />
                  <DashboardMain />
                  <DashboardFooter />
                </>
              }
            />
          }
        />

        {/* Ruta para las opciones dentro del Dashboard */}
        <Route path="/dashboard/:opcion/" element={
          <ProtectedRoute
            element={
              <>
                <DashboardHeader />
                <VistaOpcion /> {/* Mostrar la opción seleccionada */}
                <DashboardFooter />
              </>
            }
          />
        }>
          {/* Ruta para los procesos dentro de cada opción */}
          <Route path=":proceso" element={<ProtectedRoute element={<Proceso />} />} />
        </Route>

        {/* Ruta para otras páginas */}
        <Route path="/Sistemas/Macroprocesos" element={<ProtectedRoute element={<Macroprocesos />} />} />
      </Routes>
    </Router>
  );
}

export default App;
