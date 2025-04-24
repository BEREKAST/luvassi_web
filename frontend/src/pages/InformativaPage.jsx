import React from 'react';
import './InformativaPage.css';
import { Link } from 'react-router-dom';

const InformativaPage = () => {
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
        </nav>
        <a href="https://wa.me/59160371640" className="whatsapp-button">💬</a>
      </header>

      {/* Contenido principal */}
      <main className="info-main">
        <section className="principal">
          <div className="fecha-badge">
            <p className="dia">16</p>
            <p className="mes">Jun</p>
          </div>
          <img src="https://i.imgur.com/jy1a9Dq.png" alt="Banner" />
          <h2>
            ¿Qué tipos de <span className="resaltado">sitios web existen</span> y cuál se ajusta más a tu negocio?
          </h2>
          <p className="accion">Conócelos &gt;&gt;</p>

          <div className="helado-info">
            <h3>Los sabores más populares en heladerías artesanales</h3>
            <p>Desde la clásica vainilla hasta exóticas fusiones como maracuyá con albahaca. La innovación y la frescura marcan la diferencia en este sector.</p>
            <img src="https://i.imgur.com/PAk9FO3.jpg" alt="Sabores artesanales" />
          </div>

          <div className="helado-info">
            <h3>¿Cómo mejorar tu presentación en vitrinas?</h3>
            <p>El diseño del escaparate influye directamente en las decisiones de compra. Usa colores llamativos, recipientes elegantes y etiquetas bien diseñadas.</p>
            <img src="https://i.imgur.com/yDw2A47.jpg" alt="Vitrina de helados" />
          </div>

          <div className="helado-info">
            <h3>Incorpora redes sociales a tu estrategia</h3>
            <p>Publicar historias y encuestas de nuevos sabores, promociones del día y fotos de clientes felices puede atraer tráfico a tu tienda física o web.</p>
            <img src="https://i.imgur.com/BB4lqtU.jpg" alt="Heladería en redes sociales" />
          </div>
        </section>

        <aside className="noticias">
          <h3>Últimas noticias</h3>
          <ul>
            <li>
              <Link to="/noticia-sitios">
                <img src="https://i.imgur.com/jy1a9Dq.png" alt="n1" />
                <div>
                  <p className="titulo">¿Qué tipos de sitios w</p>
                  <span>junio 16, 2021</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/noticia-universo">
                <img src="https://i.imgur.com/6TJ6gCv.png" alt="n2" />
                <div>
                  <p className="titulo">El universo detrás de u</p>
                  <span>junio 1, 2021</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/noticia-heladeria">
                <img src="https://i.imgur.com/DbWj6QA.png" alt="heladeria" />
                <div>
                  <p className="titulo">Cómo destacar tu heladería artesanal</p>
                  <span>abril 24, 2025</span>
                </div>
              </Link>
            </li>
          </ul>

          {/* Tags */}
          <div className="tags">
            <h4>Tags</h4>
            <span className="tag">desarrollo web</span>
            <span className="tag">educación virtual</span>
            <span className="tag">heladería artesanal</span>
            <span className="tag">diseño web</span>
            <span className="tag">UX/UI</span>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default InformativaPage;
