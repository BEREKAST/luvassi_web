// src/components/UserMenu.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserMenu = () => {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('usuario'));
    if (storedUser) setUser(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="user-menu" style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none' }}>
        👤 {user.nombre}
      </button>
      {open && (
        <ul
          className="dropdown"
          style={{
            position: 'absolute',
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '5px',
            listStyle: 'none',
            padding: '0.5rem',
            marginTop: '0.5rem'
          }}
        >
          <li style={{ padding: '0.25rem 0' }}>
            <button onClick={() => navigate('/perfil')}>👁 Ver perfil</button>
          </li>
          <li style={{ padding: '0.25rem 0' }}>
            <button onClick={handleLogout}>🔓 Cerrar sesión</button>
          </li>
        </ul>
      )}
    </div>
  );
};

export default UserMenu;
