import React from 'react';
import './ProductCard.css';

const ProductCard = ({ producto, onAddToCart }) => {
  return (
    <div className="product-card">
      <img src={producto.imagen_url} alt={producto.nombre_producto} />
      <h4>{producto.nombre_producto}</h4>
      <p>{producto.descripcion}</p>
      <strong>Bs {producto.precio}</strong>
      <button onClick={() => onAddToCart(producto)}>Añadir al carrito 🛒</button>
    </div>
  );
};

export default ProductCard;
