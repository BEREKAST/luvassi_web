// frontend/src/components/LoginForm.jsx
import React, { useState } from 'react';

// Define la URL base de tu API usando la variable de entorno
// El fallback 'http://localhost:5000' es para que funcione en desarrollo local
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = {
      correo_electronico: email,
      contrasena: password
    };

    try {
      // MODIFICACIÓN: Usar API_BASE_URL para la llamada fetch de login
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });

      const data = await res.json();

      if (res.ok) {
        onLogin(data);
      } else {
        alert(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Error de conexión al iniciar sesión:', err);
      alert('Error de conexión con el backend. Inténtalo de nuevo más tarde.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Iniciar Sesión</h2>
      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Ingresar</button>
    </form>
  );
}

export default LoginForm;