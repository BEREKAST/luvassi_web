// backend/db.js

const { Pool } = require('pg');
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

// Configuración del pool de conexiones
const poolConfig = {
  connectionString: process.env.DATABASE_URL, // Usará la URL de .env en local, o de Render en Render
};

// Lógica condicional para SSL (importante para Render y tu entorno local ahora)
if (process.env.NODE_ENV === 'production') {
  // Para Render (producción), siempre requiere SSL con rejectUnauthorized: false
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
} else {
  // Para desarrollo local, si tu DB local requiere SSL (como lo indican tus logs),
  // necesitas esta configuración. Si NO lo requiriera, podrías usar ssl: false o no definirla.
  poolConfig.ssl = {
    rejectUnauthorized: false // Esto es para DBs locales que requieren SSL pero usan certificados autofirmados
  };
}

const pool = new Pool(poolConfig);

// Función para probar la conexión al iniciar el backend
const testDbConnection = async () => {
  let client;
  try {
    client = await pool.connect(); // Obtener un cliente del pool
    await client.query('SELECT 1'); // Ejecutar una consulta simple para verificar la conexión
    console.log('✅ Conexión exitosa con la base de datos PostgreSQL.'); // Mensaje más genérico
  } catch (err) {
    console.error('❌ Error al conectar con la base de datos PostgreSQL:', err.message);
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