import React, { useState } from 'react'; // Necesitamos useState
import RegisterForm from './RegisterForm';
import './Modal.css'; // Asegúrate de que este CSS base para modales exista
// Opcional: Si los estilos del modal personalizado no están en Modal.css, puedes importarlos desde RegisterForm.css
import './RegisterForm.css'; // Para que los estilos .custom-modal-overlay etc. estén disponibles

const RegisterModal = ({ show, onClose }) => {
  // Estados para el modal de notificación personalizado
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState(''); // 'success' o 'error'

  if (!show) return null;

  // handleSuccess ahora recibe si la operación fue exitosa y el mensaje
  const handleSuccess = (success, message) => {
    setNotificationMessage(message);
    setNotificationType(success ? 'success' : 'error');
    setShowNotificationModal(true); // Muestra el modal de notificación
    // NOTA: El modal de registro principal (RegisterModal) no se cierra inmediatamente.
    // Se cerrará cuando el usuario haga clic en "Aceptar" en el modal de notificación.
  };

  // Función para cerrar el modal de notificación y el modal de registro principal
  const closeNotificationModal = () => {
    setShowNotificationModal(false);
    setNotificationMessage('');
    setNotificationType('');
    onClose(); // Cierra el modal de registro principal (RegisterModal)
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>❌</button>
        <img src="/imagenes/logo.jpg" alt="Logo Luvassí" className="modal-logo" />
        <h2>Crear Cuenta Nueva</h2>

        {/* RegisterForm debe llamar a onRegister(true, 'Mensaje de éxito') o onRegister(false, 'Mensaje de error') */}
        <RegisterForm onRegister={handleSuccess} /> {/* Pasa la nueva función handleSuccess */}

        <hr />
        <p className="continue-text">o continuar con</p>

        <div className="social-buttons">
          <button className="google-btn">Google</button>
          <button className="facebook-btn">Facebook</button>
        </div>
      </div>

      {/* Modal de notificación personalizado (se muestra aquí) */}
      {showNotificationModal && (
        <div className="custom-modal-overlay">
          <div className={`custom-modal-content ${notificationType}`}>
            <p>{notificationMessage}</p>
            <button onClick={closeNotificationModal}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterModal;
