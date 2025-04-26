import React from 'react';
import RegisterForm from './RegisterForm';
import './Modal.css'; // ✅ Usaremos este CSS mejorado

const RegisterModal = ({ show, onClose }) => {
  if (!show) return null;

  const handleSuccess = (data) => {
    alert('Usuario registrado correctamente');
    console.log(data);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>❌</button>
        <img src="/imagenes/logo.jpg" alt="Logo Luvassí" className="modal-logo" />
        <h2>Crear Cuenta Nueva</h2>

        <RegisterForm onRegister={handleSuccess} />

        <hr />
        <p className="continue-text">o continuar con</p>

        <div className="social-buttons">
          <button className="google-btn">Google</button>
          <button className="facebook-btn">Facebook</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;

