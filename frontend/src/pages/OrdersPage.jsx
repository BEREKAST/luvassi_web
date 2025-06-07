// frontend/src/pages/OrdersPage.jsx
import React, { useState, useEffect } from 'react';
import './OrdersPage.css';
import { useNavigate } from 'react-router-dom';

// Define la URL base de tu API usando la variable de entorno
// El fallback 'http://localhost:5000' es para que funcione en desarrollo local
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const OrdersPage = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // CORRECCIÓN: 'setUsuario' eliminado porque no se utiliza
  const [usuario] = useState(() => { // <--- CAMBIO AQUÍ
    try {
      return JSON.parse(localStorage.getItem('usuario'));
    } catch (e) {
      console.error("Error al parsear usuario de localStorage:", e);
      return null;
    }
  });

  useEffect(() => {
    console.log("useEffect: Iniciando carga de pedidos...");
    console.log("Usuario en localStorage (desde estado):", usuario);

    if (!usuario || !usuario.id_cliente) {
      console.log("Usuario no logueado o sin id_cliente. Redirigiendo a /login.");
      if (window.location.pathname !== '/login') {
        navigate('/login');
      }
      setLoading(false);
      return;
    }

    const fetchPedidos = async () => {
      console.log(`Intentando obtener pedidos para id_cliente: ${usuario.id_cliente}`);
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/pedidos/cliente/${usuario.id_cliente}`);
        console.log("Respuesta del servidor (status):", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("Datos de pedidos recibidos:", data);

          // El backend devuelve un array de pedidos directamente, no un objeto { pedidos: [] }
          setPedidos(data || []);

          if (data && data.length === 0) {
            console.log("No hay pedidos para este cliente.");
          }
        } else {
          const errorData = await res.json();
          console.error("Error al cargar pedidos (respuesta del servidor):", errorData);
          setError(errorData.message || 'Error al cargar los pedidos.');
          setPedidos([]);
        }
      } catch (err) {
        console.error('Error de conexión al obtener pedidos:', err);
        setError('No se pudo conectar con el servidor para obtener los pedidos.');
        setPedidos([]);
      } finally {
        setLoading(false);
        console.log("Carga de pedidos finalizada.");
      }
    };

    fetchPedidos();
  }, [usuario, navigate]); // Las dependencias están correctas

  if (loading) {
    return (
      <div className="orders-container">
        <p>Cargando pedidos...</p>
        <div style={{
          border: '4px solid rgba(0, 0, 0, 0.1)',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-container error-message">
        <h3>¡Ups! Algo salió mal.</h3>
        <p>Error: {error}</p>
        <p>Por favor, intenta recargar la página o contacta al soporte.</p>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <h2>Mis Órdenes</h2>
      {pedidos.length === 0 ? (
        <p>No tienes pedidos realizados aún.</p>
      ) : (
        <div className="pedidos-list">
          {pedidos.map((pedido) => (
            <div key={pedido.id_pedido} className="pedido-card">
              <h3>Pedido #{pedido.id_pedido}</h3>
              <p>Estado: <strong>{pedido.estado_pedido}</strong></p>
              <p>Fecha: {new Date(pedido.fecha_pedido).toLocaleDateString()}</p>
              <p>Total: Bs {Number(pedido.total).toFixed(2)}</p>

              <h4>Productos:</h4>
              <ul className="productos-detalle-list">
                {pedido.productos && pedido.productos.map((prod, index) => (
                  <li key={index} className="producto-item">
                    {prod.imagen && (
                      <img
                        src={`${API_BASE_URL}${prod.imagen}`}
                        alt={prod.nombre_producto}
                        className="producto-imagen"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/50x50/cccccc/000000?text=No+Img" }}
                      />
                    )}
                    <span>{prod.nombre_producto} (x{prod.cantidad}) - Bs {Number(prod.precio_unitario).toFixed(2)} c/u</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;