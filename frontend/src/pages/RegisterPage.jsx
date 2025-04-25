import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';

const RegisterPage = () => {
  const navigate = useNavigate();

  const handleRegister = (data) => {
    console.log('Registro exitoso:', data);
    navigate('/dashboard');
  };

  return (
    <div>
      <h1>Página de Registro</h1>
      <RegisterForm onRegister={handleRegister} />
    </div>
  );
};

export default RegisterPage;
