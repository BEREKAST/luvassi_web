// backend/db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'luvassi_db',
  password: '1331',
  port: 5432,
});

module.exports = pool;
