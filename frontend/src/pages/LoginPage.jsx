import React, { useState } from 'react';
import Navbar from '../components/Navbar'; // ✅ Barra superior
import LoginForm from '../components/LoginForm';
import RegisterModal from '../components/RegisterModal';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (usuario) => {
    console.log('Login exitoso', usuario);
    localStorage.setItem('usuario', JSON.stringify(usuario.usuario));
    navigate('/'); // ✅ Redirige al inicio
    window.location.reload(); // ✅ Refresca para que el header cambie
  };

  return (
    <div>
      <Navbar /> {/* ✅ Barra superior */}
      <h1>Página de Login</h1>
      <LoginForm onLogin={handleLogin} />

      <p>
        ¿No tienes cuenta?{' '}
        <button onClick={() => setShowRegister(true)}>Regístrate aquí</button>
      </p>

      <RegisterModal
        show={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </div>
  );
};

export default LoginPage;
