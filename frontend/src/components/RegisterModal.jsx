import React from 'react';
import RegisterForm from './RegisterForm';
import './Modal.css';

const RegisterModal = ({ show, onClose }) => {
  if (!show) return null;

  const handleSuccess = (data) => {
    alert('Usuario registrado correctamente');
    console.log(data);
    onClose(); // cerrar modal luego de registrar
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Crear cuenta</h2>
        <button onClick={onClose}>❌</button>
        
        <RegisterForm onRegister={handleSuccess} />

        <hr />
        <p style={{ textAlign: 'center' }}>o continuar con</p>

        <button className="google-btn">Google</button>
        <button className="facebook-btn">Facebook</button>
      </div>
    </div>
  );
};

export default RegisterModal;
