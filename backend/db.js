// backend/db.js

const { Pool } = require('pg');
require('dotenv').config(); // ✅ ¡IMPORTANTE! Esto carga las variables desde tu archivo .env

// Configuración del pool de conexiones
const poolConfig = {
  connectionString: process.env.DATABASE_URL, // Usa la URL completa de Render o de tu .env local
};

// Hacemos la configuración de SSL condicional para desarrollo local y producción (Render)
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = {
    rejectUnauthorized: false // Esto es CRUCIAL para conectar a Render
  };
} else {
  // === MODIFICACIÓN CLAVE AQUÍ PARA EL ENTORNO LOCAL ===
  // Si tu base de datos PostgreSQL local requiere SSL (como indican tus logs: "SSL/TLS required"),
  // entonces necesitas configurar `ssl: true` o `ssl: { rejectUnauthorized: false }` para LOCAL también.
  // La mayoría de las bases de datos locales no requieren SSL por defecto, pero si la tuya sí,
  // o si estás conectando a una DB remota desde local que lo requiere, necesitas esta línea.
  poolConfig.ssl = {
    rejectUnauthorized: false // Permite conexiones SSL/TLS aunque el certificado sea autofirmado (común en local o con servicios como Render)
  };
  // Si estuvieras seguro de que tu DB local NO usa SSL, la línea de abajo sería la correcta:
  // poolConfig.ssl = false;
  // Pero según tu error "SSL/TLS required", necesitas la primera opción.
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