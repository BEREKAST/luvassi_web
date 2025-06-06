// backend/db.js

const { Pool } = require('pg');
require('dotenv').config(); // ✅ ¡IMPORTANTE! Esto carga las variables desde tu archivo .env

// Configuración del pool de conexiones usando la DATABASE_URL de Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Usa la URL completa de Render
  ssl: {
    rejectUnauthorized: false // Esto es CRUCIAL para conectar a Render desde tu entorno local
  }
});

// Función para probar la conexión al iniciar el backend
const testDbConnection = async () => {
  let client;
  try {
    client = await pool.connect(); // Obtener un cliente del pool
    await client.query('SELECT 1'); // Ejecutar una consulta simple para verificar la conexión
    console.log('✅ Conexión exitosa con la base de datos PostgreSQL de Render.');
  } catch (err) {
    console.error('❌ Error al conectar con la base de datos de Render:', err.message);
    // console.error(err); // Descomenta esta línea para ver el stack trace completo si lo necesitas para depuración
  } finally {
    if (client) {
      client.release(); // Liberar el cliente de vuelta al pool
    }
  }
};

// Llama a la función de prueba de conexión inmediatamente para verificarla al inicio
testDbConnection();

// Exporta el pool para que otros módulos de tu backend puedan usarlo
module.exports = pool;