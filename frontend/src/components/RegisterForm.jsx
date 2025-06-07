// frontend/src/components/RegisterForm.jsx
import React, { useState } from 'react';
import './RegisterForm.css'; // Importar el CSS para que los estilos se apliquen

// Define la URL base de tu API usando la variable de entorno
// El fallback 'http://localhost:5000' es para que funcione en desarrollo local
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const RegisterForm = ({ onRegister }) => {
  const [form, setForm] = useState({
    nombre: '',
    correo_electronico: '',
    contrasena: '',
    direccion: '',
    rol: 'usuario' // Valor por defecto
  });
  // Estado para el mensaje de error de validación de la contraseña
  const [passwordError, setPasswordError] = useState('');

  // Maneja los cambios en los campos del formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Limpia el error de contraseña al escribir en el campo de contraseña
    if (e.target.name === 'contrasena') {
      setPasswordError('');
    }
  };

  /**
   * Valida la contraseña según los requisitos:
   * - Mínimo 8 caracteres.
   * - Al menos una letra mayúscula.
   * - Al menos un carácter especial (signo).
   * @param {string} password La contraseña a validar.
   * @returns {string[]} Un array de mensajes de error si la contraseña no es válida, o vacío si es válida.
   */
  const validatePassword = (password) => {
    let errors = [];

    // 1. Mínimo 8 caracteres
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres.');
    }
    // 2. Al menos una letra mayúscula (usa una expresión regular para buscar cualquier mayúscula)
    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula.');
    }
    // 3. Al menos un signo (carácter especial) (usa una expresión regular para buscar caracteres especiales comunes)
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial (ej. !, @, #, $).');
    }

    return errors;
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valida la contraseña antes de intentar enviar el formulario al backend
    const passwordValidationErrors = validatePassword(form.contrasena);
    if (passwordValidationErrors.length > 0) {
      // Si hay errores de validación, los almacena en el estado y los muestra al usuario
      setPasswordError(passwordValidationErrors.join('\n')); // Une los errores con saltos de línea
      console.error('Errores de validación de contraseña:', passwordValidationErrors);
      // Muestra una alerta con los errores, como se usaba anteriormente
      alert('Errores de contraseña:\n' + passwordValidationErrors.join('\n'));
      return; // Detiene el envío del formulario si hay errores
    }

    try {
      // Realiza la llamada a la API para registrar al usuario
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        // Si el registro es exitoso, guarda los datos del usuario y notifica al componente padre
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        onRegister(data); // Cierra el modal o redirige
        console.log('✅ Registro exitoso. ¡Bienvenido!');
        // Aquí se podría integrar un modal de éxito más sofisticado en lugar de un alert
      } else {
        // Si hay un error en la respuesta de la API, lo muestra en la consola
        console.error('Error al registrar:', data.message || 'Error desconocido');
        // Aquí se podría integrar un modal de error
      }
    } catch (error) {
      // Maneja errores de conexión o del servidor
      console.error('Error en la conexión al registrar:', error);
      console.error('Error en la conexión con el servidor. Inténtalo de nuevo más tarde.');
      // Aquí se podría integrar un modal de error de conexión
    }
  };

  return (
    // Es crucial que el formulario esté envuelto en este div para que los estilos de RegisterForm.css se apliquen
    <div className="register-form-container">
      <form onSubmit={handleSubmit}>
        <h2>Registro</h2>

        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="direccion"
          placeholder="Dirección"
          value={form.direccion}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="correo_electronico"
          placeholder="Correo electrónico"
          value={form.correo_electronico}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="contrasena"
          placeholder="Contraseña"
          value={form.contrasena}
          onChange={handleChange}
          required
          // Aplica la clase 'input-error' si hay un mensaje de error de contraseña
          className={passwordError ? 'input-error' : ''}
        />
        {/* Muestra el mensaje de error de contraseña si existe */}
        {passwordError && <p className="password-error-message">{passwordError}</p>}

        <select name="rol" value={form.rol} onChange={handleChange}>
          <option value="usuario">Usuario</option>
          <option value="admin">Administrador</option>
        </select>

        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
};

export default RegisterForm;
