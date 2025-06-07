// frontend/src/components/InputForm.jsx
import React, { useState } from 'react';
import './InputForm.css'; // Importa el archivo CSS para este componente

// Este componente proporciona varios tipos de campos de entrada (input fields)
// para que los usuarios ingresen información, con estilos propios definidos en InputForm.css.

const InputForm = () => {
  // Estados para cada tipo de campo de entrada
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [pais, setPais] = useState('');
  const [tipoNotificacion, setTipoNotificacion] = useState(''); // Para botones de radio
  const [intereses, setIntereses] = useState({ // Para casillas de verificación
    deportes: false,
    musica: false,
    lectura: false,
  });

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos del formulario enviados:');
    console.log('Nombre:', nombre);
    console.log('Mensaje:', mensaje);
    console.log('País:', pais);
    console.log('Tipo de Notificación:', tipoNotificacion);
    console.log('Intereses:', intereses);
    // En lugar de alert(), considera usar un modal personalizado o una notificación
    alert('Formulario enviado (revisa la consola para ver los datos).');
    // Aquí es donde normalmente enviarías los datos a tu backend.
    // Opcional: para resetear el formulario después de enviar:
    // setNombre(''); setMensaje(''); setPais(''); setTipoNotificacion(''); setIntereses({ deportes: false, musica: false, lectura: false });
  };

  // Función para manejar cambios en las casillas de verificación
  const handleInteresesChange = (e) => {
    const { name, checked } = e.target;
    setIntereses((prevIntereses) => ({
      ...prevIntereses,
      [name]: checked,
    }));
  };

  return (
    <div className="input-form-container">
      <h2 className="input-form-title">Contáctanos</h2>
      <form onSubmit={handleSubmit} className="input-form">
        {/* Campo de Texto (Input Text) */}
        <div className="form-group">
          <label htmlFor="nombre" className="form-label">
            Nombre Completo:
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="form-input"
            placeholder="Introduce tu nombre"
            aria-label="Nombre Completo"
          />
        </div>

        {/* Área de Texto (Textarea) */}
        <div className="form-group">
          <label htmlFor="mensaje" className="form-label">
            Tu Mensaje:
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows="4"
            className="form-textarea"
            placeholder="Escribe tu mensaje aquí..."
            aria-label="Tu Mensaje"
          ></textarea>
        </div>

        {/* Menú Desplegable (Select/Dropdown) */}
        <div className="form-group">
          <label htmlFor="pais" className="form-label">
            País:
          </label>
          <select
            id="pais"
            name="pais"
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            className="form-select"
            aria-label="País"
          >
            <option value="">Selecciona un país</option>
            <option value="Bolivia">Bolivia</option>
            <option value="Argentina">Argentina</option>
            <option value="Chile">Chile</option>
            <option value="Peru">Perú</option>
          </select>
        </div>

        {/* Botones de Selección (Radio Buttons) */}
        <div className="form-group">
          <label className="form-label">
            Preferencias de Notificación:
          </label>
          <div className="form-radio-group">
            <label className="form-radio-label">
              <input
                type="radio"
                name="tipoNotificacion"
                value="email"
                checked={tipoNotificacion === 'email'}
                onChange={(e) => setTipoNotificacion(e.target.value)}
                className="form-radio-input"
                aria-label="Notificación por Email"
              />
              <span className="form-radio-text">Email</span>
            </label>
            <label className="form-radio-label">
              <input
                type="radio"
                name="tipoNotificacion"
                value="sms"
                checked={tipoNotificacion === 'sms'}
                onChange={(e) => setTipoNotificacion(e.target.value)}
                className="form-radio-input"
                aria-label="Notificación por SMS"
              />
              <span className="form-radio-text">SMS</span>
            </label>
            <label className="form-radio-label">
              <input
                type="radio"
                name="tipoNotificacion"
                value="none"
                checked={tipoNotificacion === 'none'}
                onChange={(e) => setTipoNotificacion(e.target.value)}
                className="form-radio-input"
                aria-label="Sin Notificación"
              />
              <span className="form-radio-text">Ninguna</span>
            </label>
          </div>
        </div>

        {/* Casillas de Verificación (Checkboxes) */}
        <div className="form-group">
          <label className="form-label">
            Tus Intereses:
          </label>
          <div className="form-checkbox-group">
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                name="deportes"
                checked={intereses.deportes}
                onChange={handleInteresesChange}
                className="form-checkbox-input"
                aria-label="Intereses: Helados"
              />
              <span className="form-checkbox-text">HELADOS PREFERIDOS</span>
            </label>
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                name="musica"
                checked={intereses.musica}
                onChange={handleInteresesChange}
                className="form-checkbox-input"
                aria-label="Intereses: COMPRAS POR MAYOR"
              />
              <span className="form-checkbox-text">Sabores</span>
            </label>
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                name="lectura"
                checked={intereses.lectura}
                onChange={handleInteresesChange}
                className="form-checkbox-input"
                aria-label="Intereses: SERVICIOS"
              />
              <span className="form-checkbox-text">EMPREDIMIENTO</span>
            </label>
          </div>
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          className="form-submit-button"
        >
          Enviar Formulario
        </button>
      </form>
    </div>
  );
};

export default InputForm;
