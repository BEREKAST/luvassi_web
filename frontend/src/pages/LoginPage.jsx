import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterModal from '../components/RegisterModal';

const LoginPage = () => {
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = (usuario) => {
    console.log('Login exitoso', usuario);
    // aquí podrías guardar el usuario o redirigir
  };

  return (
    <div>
      <h1>Página de Login</h1>
      <LoginForm onLogin={handleLogin} />

      <p>
        ¿No tienes cuenta?{' '}
        <button onClick={() => setShowRegister(true)}>Regístrate aquí</button>
      </p>

      {/* Modal que se activa con el botón */}
      <RegisterModal
        show={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </div>
  );
};

export default LoginPage;
