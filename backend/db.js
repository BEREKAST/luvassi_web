// backend/db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgre',
  host: 'localhost',
  database: 'luvassi_db_ihyw',
  password: '1331',
  port: 5432,
});

// Verificar la conexión al iniciar el backend
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error al conectar con la base de datos:', err.stack);
  }
  console.log('✅ Conexión exitosa con la base de datos PostgreSQL');
  release();
});

module.exports = pool;
