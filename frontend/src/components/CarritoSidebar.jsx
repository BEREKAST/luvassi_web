import React from 'react';
import './CarritoSidebar.css';

const CarritoSidebar = ({ carrito, mostrar, onClose }) => {
  // Aseguramos que cada precio sea tratado como número
  const total = carrito.reduce((sum, item) => sum + Number(item.precio), 0);

  if (!mostrar) return null;

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
              </li>
            ))}
          </ul>
          <div className="total-carrito">
            <p><strong>Total:</strong> Bs {total.toFixed(2)}</p>
            <button className="btn-comprar">Finalizar Compra</button>
          </div>
        </>
      )}
    </div>
  );
};

export default CarritoSidebar;
