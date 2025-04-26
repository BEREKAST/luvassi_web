import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import './RegisterPage.css'; // ✅ Importamos solo CSS para estilo

const RegisterPage = () => {
  const navigate = useNavigate();

  const handleRegister = (data) => {
    console.log('Registro exitoso:', data);
    navigate('/dashboard');
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-card">
        <img src="/imagenes/logo-luva.png" alt="Logo Luvassí" className="register-logo" />
        <h1>Crear Nueva Cuenta</h1>
        <RegisterForm onRegister={handleRegister} />
      </div>
    </div>
  );
};

export default RegisterPage;
