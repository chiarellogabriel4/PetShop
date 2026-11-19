const { randomBytes } = require('node:crypto');
const { createPool, migrate } = require('./db');
const { createApp } = require('./app');
async function start() {
  const pool=createPool();
  pool.on('error',()=>console.error('Conexão ao banco interrompida.'));
  await migrate(pool);
  const {rowCount}=await pool.query("SELECT 1 FROM helppatas.users WHERE role='admin' LIMIT 1");
  const setupToken=rowCount?'':randomBytes(32).toString('hex');
  const port=Number(process.env.PORT||3000), production=process.env.NODE_ENV==='production';
  const app=createApp(pool,{setupToken,production});
  const server=app.listen(port,production?'0.0.0.0':'127.0.0.1',()=>{
    console.log(`helpPatas: http://127.0.0.1:${port}`);
    if(setupToken)console.log(`Configure o primeiro administrador neste endereço privado: http://127.0.0.1:${port}/setup.html#${setupToken}`);
  });
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>pool.end().then(()=>process.exit(0))));
}
start().catch(e=>{console.error('Servidor não iniciado. Confira a conexão DATABASE_URL.',e.code||e.name);process.exit(1);});
