// frontend/src/pages/InformativaPage.jsx
import React from 'react';
import './InformativaPage.css';
import { Link, useNavigate } from 'react-router-dom';
import InputForm from '../components/InputForm'; // Importa el componente InputForm

const InformativaPage = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario')); // Obtener el usuario del localStorage

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/');
    window.location.reload(); // Recargar para limpiar el estado de autenticación
  };

  // Verificar si el usuario tiene rol de administrador
  const isAdmin = usuario && usuario.rol === 'admin';

  return (
    <div className="info-container">
      {/* Header fijo */}
      <header className="info-header sticky">
        <div className="logo"><strong>luvassi</strong><span>/web</span></div>
        <nav>
          <Link to="/">Inicio</Link>
          <Link to="/servicios">Servicios</Link>
          <Link to="/productos">Productos</Link>
          <Link to="/portafolio">Portafolio</Link>
          <Link to="/blog">Blog</Link>

          {usuario ? (
            <div className="user-menu">
              <span>👋 Hola, {usuario.nombre}</span>
              {/* Enlace al perfil/pedidos del usuario normal (Mis Pedidos) */}
              {!isAdmin && <Link to="/perfil">Mis Pedidos</Link>} {/* Visible solo para usuarios NO admin */}

              {/* Enlaces de administración, visibles solo si es admin */}
              {isAdmin && (
                <>
                  <Link to="/admin/pedidos">Gestión Pedidos Admin</Link>
                  <Link to="/admin/sales-history">Historial de Ventas</Link> {/* Nuevo enlace para el historial */}
                </>
              )}
              <button onClick={handleLogout} className="logout-btn">Cerrar sesión</button>
            </div>
          ) : (
            <Link to="/login" className="login-link">Iniciar sesión</Link>
          )}
        </nav>
        <a href="https://wa.me/59160371640" className="whatsapp-button">💬</a>
      </header>

      {/* Contenido principal */}
      <main className="info-main">
        <section className="principal">
          <div className="fecha-badge">
            <p className="dia">24</p>
            <p className="mes">Abr</p>
          </div>
          <img src="/imagenes/portada.jpg" alt="Banner Feria Luvassi" />

          <h2><span className="resaltado">¡Nuevo sabor Lima!</span> llegó para refrescar tu día 🍋</h2>
          <p className="accion">Descúbrelo &gt;&gt;</p>

          <div className="helado-info">
            <h3>Explosión de frescura con sabor Lima</h3>
            <p>Prepárate para una experiencia refrescante. Nuestro nuevo helado artesanal de LIMA te hará disfrutar como nunca. ¡Una delicia que no te puedes perder! 🤤</p>
            <img src="/imagenes/lima.jpg" alt="Helado de lima" />
          </div>

          <div className="helado-info">
            <h3>Participamos en la Feria del 3º ENEE</h3>
            <p>No te pierdas nuestra presencia en la feria agroecológica este 12 de abril. Estaremos en Sopocachi: Final Belisario Salinas y Abdon Saavedra de 9:00 a 15:00 hrs. 🌿🍧</p>
            <img src="/imagenes/3en.jpg" alt="Stand en feria agroecológica" />
          </div>

          <div className="helado-info">
            <h3>Nuestras direcciones y contacto</h3>
            <p>
              🏪 Achumani: Av. José Manuel Chinchilla, entre calles 18 y 19<br/>
              🏪 Mallasa: entre la Av. Florida y calle 4<br/>
              🏪 Sopocachi: Av. Ecuador #2286, entre Guachalla y Gutiérrez<br/>
              📲 WhatsApp: <a href="https://wa.me/59176710868" target="_blank">76710868</a>
            </p>
          </div>
        </section>

        <aside className="noticias">
          <h3>Últimas noticias</h3>
          <ul>
            <li>
              <Link to="/noticia-lima">
                <img src="/imagenes/lima.jpg" alt="Nuevo sabor lima" />
                <div>
                  <p className="titulo">¡Nuevo helado sabor Lima!</p>
                  <span>abril 10, 2025</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/noticia-feria">
                <img src="/imagenes/3en.jpg" alt="Feria agroecológica" />
                <div>
                  <p className="titulo">Nos vemos en la Feria del 3º ENEE 🌿</p>
                  <span>abril 12, 2025</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/noticia-locacion">
                <img src="/imagenes/direcion.jpg" alt="Direcciones Luvassi" />
                <div>
                  <p className="titulo">¿Dónde puedes encontrarnos?</p>
                  <span>abril 5, 2025</span>
                </div>
              </Link>
            </li>
          </ul>

          <div className="tags">
            <h4>Tags</h4>
            <span className="tag">helado artesanal</span>
            <span className="tag">sabor lima</span>
            <span className="tag">feria ecosocial</span>
            <span className="tag">postre saludable</span>
            <span className="tag">emprendimiento</span>
          </div>
        </aside>
      </main>

      {/* Aquí es donde se inserta el componente InputForm */}
      {/* Lo he colocado después del <main> pero antes del <footer> para que sea visible en la página */}
      <InputForm />

      <footer className="info-footer">
        <p><strong>LUVASSÍ</strong> – Heladería artesanal con sabor natural.</p>
        <p>Somos una iniciativa boliviana que apuesta por ingredientes locales, recetas saludables y conexión con nuestra comunidad.</p>
        <p>📍 Achumani, Mallasa, Sopocachi | 📞 WhatsApp: 76710868</p>
        <p className="copy">&copy; 2025 Luvassí. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default InformativaPage;
