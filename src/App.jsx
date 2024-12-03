import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Importa Navigate para redirigir
import DashboardHeader from './components/DashboardHeader';
import DashboardFooter from './components/DashboardFooter';
import DashboardMain from './components/DashboardMain';
import Login from './components/Login';
import VistaOpcion from './components/VistaOpcion';
import ProcesoInscripcion from './pages/PracticasPreprofesionales/ProcesoInscripcion'; // Componente específico para Inscripción
// Importar los procesos de admisión desde el archivo de exportación
import { Proceso1, Proceso2, Proceso3 } from './pages/Admision/ProcesosAdmision'; // Importación única

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
        <Route
          path="/dashboard/:opcion"
          element={
            <ProtectedRoute
              element={
                <>
                  <DashboardHeader />
                  <VistaOpcion /> {/* Mostrar la opción seleccionada */}
                  <DashboardFooter />
                </>
              }
            />
          }
        >
          {/* Rutas para los procesos dentro de cada opción */}
          {/* Ruta específica para 'Revisión e inscripción del plan' */}
          <Route path="revision-inscripcion" element={<ProtectedRoute element={<ProcesoInscripcion />} />} />
          <Route path="revision-informes" element={<ProtectedRoute element={<ProcesoInscripcion />} />} />
          <Route path="informefinal-certificado" element={<ProtectedRoute element={<ProcesoInscripcion />} />} />
          <Route path="Convalidación-experiencialaboral" element={<ProtectedRoute element={<ProcesoInscripcion />} />} />

          {/* Rutas específicas para 'Admision' con diferentes procesos */}
          <Route path="proceso-1" element={<ProtectedRoute element={<Proceso1 />} />} />
          <Route path="proceso-2" element={<ProtectedRoute element={<Proceso2 />} />} />
          <Route path="proceso-3" element={<ProtectedRoute element={<Proceso3 />} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
