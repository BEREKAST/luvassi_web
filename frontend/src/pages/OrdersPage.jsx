// frontend/src/pages/OrdersPage.jsx
import React, { useState, useEffect } from 'react';
import './OrdersPage.css'; // Asegúrate de que este archivo CSS exista y esté en la ruta correcta
import { useNavigate } from 'react-router-dom';

const OrdersPage = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Obtener el usuario del localStorage
  // Usar useState para que el componente reaccione si el usuario cambia (aunque no es común que cambie en esta página)
  const [usuario, setUsuario] = useState(() => {
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

    // 1. Redirigir si el usuario no está logueado o no es un cliente válido
    if (!usuario || !usuario.id_cliente) {
      console.log("Usuario no logueado o sin id_cliente. Redirigiendo a /login.");
      // Solo redirige si el usuario no está en la página de login para evitar bucles
      if (window.location.pathname !== '/login') {
        navigate('/login');
      }
      setLoading(false); // Detener el loading si no hay usuario para evitar spinner infinito
      return; // Detiene la ejecución del useEffect
    }

    const fetchPedidos = async () => {
      console.log(`Intentando obtener pedidos para id_cliente: ${usuario.id_cliente}`);
      try {
        setLoading(true); // Inicia el estado de carga
        setError(null);   // Limpia errores previos

        const res = await fetch(`http://localhost:5000/api/pedidos/cliente/${usuario.id_cliente}`);
        console.log("Respuesta del servidor (status):", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("Datos de pedidos recibidos:", data);
          setPedidos(data.pedidos || []); // Asegúrate de que siempre sea un array
          if (data.pedidos && data.pedidos.length === 0) {
            console.log("No hay pedidos para este cliente.");
          }
        } else {
          const errorData = await res.json();
          console.error("Error al cargar pedidos (respuesta del servidor):", errorData);
          setError(errorData.message || 'Error al cargar los pedidos.');
          setPedidos([]); // Limpiar pedidos en caso de error
        }
      } catch (err) {
        console.error('Error de conexión al obtener pedidos:', err);
        setError('No se pudo conectar con el servidor para obtener los pedidos.');
        setPedidos([]); // Limpiar pedidos en caso de error de conexión
      } finally {
        setLoading(false); // Finaliza el estado de carga
        console.log("Carga de pedidos finalizada.");
      }
    };

    fetchPedidos();
  }, [usuario, navigate]); // Dependencias: usuario y navigate. El efecto se ejecuta cuando cambian.

  // 2. Renderizado condicional basado en los estados
  if (loading) {
    return (
      <div className="orders-container">
        <p>Cargando pedidos...</p>
        {/* Añadido un spinner básico en línea para visibilidad */}
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

  // 3. Renderizado de los pedidos si no hay errores y la carga ha terminado
  return (
    <div className="orders-container">
      <h2>Mis Órdenes</h2>
      {pedidos.length === 0 ? (
        <p>No tienes pedidos realizados aún.</p>
      ) : (
        <div className="pedidos-list">
          {pedidos.map((pedido) => (
            // Usar pedido.id_pedido como key para una mejor renderización de listas
            <div key={pedido.id_pedido} className="pedido-card">
              <h3>Pedido #{pedido.id_pedido}</h3>
              <p>Estado: <strong>{pedido.estado_pedido}</strong></p>
              <p>Fecha: {new Date(pedido.fecha_pedido).toLocaleDateString()}</p>
              <p>Total: Bs {Number(pedido.total).toFixed(2)}</p>

              <h4>Productos:</h4>
              <ul className="productos-detalle-list">
                {pedido.productos_detalle.map((prod, index) => (
                  <li key={index} className="producto-item"> {/* index es aceptable aquí si los productos dentro de un pedido no cambian de orden */}
                    {prod.imagen && (
                      <img
                        src={`http://localhost:5000${prod.imagen}`}
                        alt={prod.nombre_producto}
                        className="producto-imagen"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/50x50/cccccc/000000?text=No+Img" }} // Fallback image
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
