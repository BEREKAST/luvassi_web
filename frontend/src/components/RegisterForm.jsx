// src/components/RegisterForm.jsx
import React, { useState } from 'react';

const RegisterForm = ({ onRegister }) => {
  const [form, setForm] = useState({
    nombre: '',
    correo_electronico: '',
    contrasena: '',
    direccion: '',
    rol: 'usuario'
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Guardar usuario con id_cliente incluido en localStorage
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        onRegister(data); // ✅ Cierra modal o redirige
      } else {
        alert(data.message || 'Error al registrar');
      }
    } catch (error) {
      console.error(error);
      alert('Error en la conexión con el servidor');
    }
  };

  return (
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
      />

      <select name="rol" value={form.rol} onChange={handleChange}>
        <option value="usuario">Usuario</option>
        <option value="admin">Administrador</option>
      </select>

      <button type="submit">Registrarse</button>
    </form>
  );
};

export default RegisterForm;
