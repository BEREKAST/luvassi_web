// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ carrito = [], mostrarCarrito, setMostrarCarrito }) => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario'));
    } catch (e) {
      console.error("Error al parsear usuario de localStorage en Navbar:", e);
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setUsuario(JSON.parse(localStorage.getItem('usuario')));
      } catch (e) {
        console.error("Error al actualizar usuario desde localStorage en Navbar:", e);
        setUsuario(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    handleStorageChange(); // Forzar la actualización al montar

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
    navigate('/login');
  };

  return (
    <header className="info-header sticky">
      <div className="logo">
        <strong>luvassi</strong><span>/web</span>
      </div>
      <nav>
        <Link to="/">Inicio</Link>
        <Link to="/servicios">Servicios</Link>
        <Link to="/productos">Productos</Link>
        <Link to="/blog">Blog</Link>

        {/* ELIMINADO: Ya no hay un enlace directo a "Gestión Pedidos" aquí. */}
        {/* Este enlace se moverá dentro del dropdown del perfil si el usuario es admin. */}
        {/* Mantengo "Mis Pedidos" para usuarios normales aquí si lo deseas accesible directamente */}
        {usuario && usuario.rol === 'usuario' && (
          <Link to="/perfil">Mis Pedidos</Link>
        )}

        {/* ✅ Botón carrito con toggle (mostrar/ocultar) */}
        <button
          className="btn-carrito"
          onClick={() => setMostrarCarrito(prev => !prev)}
        >
          🛒
          {carrito.length > 0 && (
            <span className="carrito-badge">{carrito.length}</span>
          )}
        </button>

        {!usuario ? (
          <Link to="/login" className="login-link">Iniciar sesión</Link>
        ) : (
          <div className="usuario-dropdown">
            <span>👤 {usuario.nombre}</span>
            <div className="dropdown-content">
              {usuario.rol === 'usuario' && <Link to="/perfil">Mi Perfil</Link>} {/* Para usuario normal */}
              {usuario.rol === 'admin' && <Link to="/admin/pedidos">Gestión Pedidos Admin</Link>} {/* Solo para admin */}
              <button onClick={handleLogout}>Cerrar sesión</button>
            </div>
          </div>
        )}
      </nav>
      <a href="https://wa.me/59160371640" className="whatsapp-button">💬</a>
    </header>
  );
};

export default Navbar;  