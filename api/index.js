const { createPool, migrate } = require('../server/db');
const { createApp } = require('../server/app');

let initialized;
async function initialize() {
  const pool = createPool();
  pool.on('error', () => console.error('Conexão com o banco interrompida.'));
  try {
    await migrate(pool);
    // Bootstrap is deliberately disabled online: use the administrator already in Neon.
    return createApp(pool, { production: true, setupToken: '' });
  } catch (error) {
    await pool.end();
    throw error;
  }
}

module.exports = async function handler(req, res) {
  try {
    initialized ||= initialize();
    const app = await initialized;
    return app(req, res);
  } catch (error) {
    initialized = undefined;
    console.error('Falha ao iniciar API:', error.code || error.name);
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ error: 'Serviço temporariamente indisponível. Verifique a configuração do servidor.' }));
  }
};
