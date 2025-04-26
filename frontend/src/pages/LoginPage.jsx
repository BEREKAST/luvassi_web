import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import LoginForm from '../components/LoginForm';
import RegisterModal from '../components/RegisterModal';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (usuario) => {
    localStorage.setItem('usuario', JSON.stringify(usuario.usuario));
    navigate('/');
    window.location.reload();
  };

  return (
    <div>
      <Navbar />
      <div className="login-page-wrapper">
        <div className="login-card">
          <img src="/imagenes/logo.jpg" alt="Logo Luvassí" />
          <h1>Iniciar Sesión</h1>
          <LoginForm onLogin={handleLogin} />
          <p>
            ¿No tienes cuenta?{' '}
            <button onClick={() => setShowRegister(true)}>Regístrate aquí</button>
          </p>
        </div>
      </div>

      <RegisterModal
        show={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </div>
  );
};

export default LoginPage;
