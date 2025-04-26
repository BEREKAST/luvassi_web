// src/components/CarritoSidebar.jsx
import React, { useState, useEffect } from 'react';
import './CarritoSidebar.css';
import { useNavigate } from 'react-router-dom';

const CarritoSidebar = ({ carrito: carritoProp, mostrar, onClose }) => {
  const [carrito, setCarrito] = useState([]);
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    setCarrito(carritoProp);
  }, [carritoProp]);

  const total = carrito.reduce((sum, item) => sum + Number(item.precio), 0);

  if (!mostrar) return null;

  const finalizarCompra = async () => {
    if (!usuario || !usuario.id_cliente) {
      alert("Debes iniciar sesión para finalizar la compra.");
      return;
    }
    if (carrito.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }

    try {
      const productosParaPedido = carrito.map((prod) => ({
        id_producto: prod.id_producto,
        cantidad: 1
      }));

      console.log("🛒 Enviando pedido:", {
        id_cliente: usuario.id_cliente,
        productos: productosParaPedido
      });

      const res = await fetch('http://localhost:5000/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: usuario.id_cliente,
          productos: productosParaPedido
        })
      });

      if (res.ok) {
        alert("✅ Compra realizada con éxito");
        onClose();
        navigate('/perfil');
      } else {
        const error = await res.json();
        alert(`❌ Error del servidor: ${error.message}`);
        console.error("Respuesta con error:", error);
      }
    } catch (err) {
      console.error("Error en la compra:", err);
      alert("❌ Error en la conexión al servidor");
    }
  };

  const eliminarProducto = (index) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(index, 1);
    setCarrito(nuevoCarrito);
  };

  return (
    <div className="carrito-sidebar">
      <button className="close-btn" onClick={onClose}>✖</button>
      <h3>🛒 Tu carrito</h3>
      {carrito.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <>
          <ul>
            {carrito.map((prod, index) => (
              <li key={index}>
                <strong>{prod.nombre_producto}</strong> - Bs {Number(prod.precio).toFixed(2)}
                <button className="btn-eliminar" onClick={() => eliminarProducto(index)}>Eliminar</button>
              </li>
            ))}
          </ul>
          <div className="total-carrito">
            <p><strong>Total:</strong> Bs {total.toFixed(2)}</p>
            <button className="btn-comprar" onClick={finalizarCompra}>
              Finalizar Compra
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CarritoSidebar;
