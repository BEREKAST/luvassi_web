// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ carrito = [], mostrarCarrito, setMostrarCarrito }) => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  const handleLogout = () => {
    localStorage.removeItem('usuario');
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
        <Link to="/portafolio">Portafolio</Link>
        <Link to="/blog">Blog</Link>

        {/* ✅ Enlace de Pedidos solo para admin */}
        {usuario && usuario.rol === 'admin' && (
          <Link to="/orders">Pedidos</Link>
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
              <Link to="/perfil">Ver perfil</Link>
              {usuario.rol === 'admin' && <Link to="/dashboard">Dashboard</Link>}
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
