// backend/db.js

const { Pool } = require('pg');
require('dotenv').config(); // ✅ ¡IMPORTANTE! Esto carga las variables desde tu archivo .env

// Configuración del pool de conexiones
// Hacemos la configuración de SSL condicional para desarrollo local y producción (Render)
const poolConfig = {
  connectionString: process.env.DATABASE_URL, // Usa la URL completa de Render o de tu .env local
};

// Si NO estamos en desarrollo (es decir, en producción como Render), habilitamos SSL
// Render inyecta NODE_ENV = 'production' por defecto.
// Para local, NODE_ENV suele ser undefined o 'development'.
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = {
    rejectUnauthorized: false // Esto es CRUCIAL para conectar a Render
  };
} else {
  // Para desarrollo local, si tu DB local no usa SSL o usa auto-firmado,
  // puedes configurar ssl: false o ssl: { rejectUnauthorized: false }
  // Si tu DB local NO usa SSL, simplemente omite la propiedad ssl para local
  // o configúrala como ssl: false.
  // En la mayoría de los casos, si tu DB local no está configurada para SSL, omitirlo es lo mejor.
  // Si tu DB local SÍ usa SSL pero es autofirmado, podrías necesitar rejectUnauthorized: false también.
  // Por simplicidad y para evitar errores si no usas SSL localmente:
  // poolConfig.ssl = false; // Descomenta esta línea si tu DB local no usa SSL y te da problemas.
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