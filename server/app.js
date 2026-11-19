const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { randomUUID, randomBytes, timingSafeEqual } = require('node:crypto');
const path = require('node:path');
const { hashPassword, verifyPassword, digest } = require('./security');

const services = {'Banho e Tosa':69,'Consulta Veterinária':89,'Vacinação':120,'Hospedagem':49,'Creche Pet':59,'Emergência 24h':0};
const statuses = ['Pendente','Confirmado','Em atendimento','Concluído','Cancelado'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const publicUser = u => ({id:u.id,name:u.name,surname:u.surname,email:u.email,role:u.role});
function text(value, name, max, required = true) {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw Object.assign(Error(`Confira o campo ${name}.`),{status:400});
  return value.trim();
}
function account(body) {
  const name=text(body.name,'nome',100), surname=text(body.surname,'sobrenome',100,false), email=text(body.email,'e-mail',160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(Error('Informe um e-mail válido.'),{status:400});
  if(typeof body.password!=='string' || body.password.length<10 || body.password.length>128) throw Object.assign(Error('A senha deve ter entre 10 e 128 caracteres.'),{status:400});
  return {name,surname,email,password:body.password};
}
function bookingData(body, user, admin) {
  const petName=text(body.petName,'nome do pet',80), petType=text(body.petType,'tipo do pet',50), service=text(body.service,'serviço',100);
  if (!Object.hasOwn(services,service)) throw Object.assign(Error('Serviço inválido.'),{status:400});
  const date=text(body.date,'data',10), time=text(body.time,'horário',5);
  const parsed=new Date(`${date}T12:00:00Z`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw Object.assign(Error('Data ou horário inválidos.'),{status:400});
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if (!admin && date<today) throw Object.assign(Error('Escolha uma data a partir de hoje.'),{status:400});
  const price=admin?Number(body.price):services[service], status=admin?body.status:'Pendente';
  if(!Number.isFinite(price)||price<0||price>100000||!statuses.includes(status)) throw Object.assign(Error('Valor ou status inválido.'),{status:400});
  const customerName=admin?text(body.customerName,'tutor',100):`${user.name} ${user.surname}`.trim();
  const customerEmail=admin?text(body.customerEmail,'e-mail do tutor',160,false):user.email;
  if(customerEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) throw Object.assign(Error('E-mail do tutor inválido.'),{status:400});
  return {petName,petType,service,date,time,price,status,customerName,customerEmail,notes:text(body.notes,'observações',1000,false)};
}
function petData(body) {
  const name=text(body.name,'nome do pet',80), petType=text(body.petType,'tipo do pet',50,false);
  const raw=body.photo == null ? '' : body.photo;
  if(raw === '') return {name,petType,photo:null,type:null};
  if(typeof raw !== 'string' || raw.length > 1800000) throw Object.assign(Error('A foto deve ter no máximo 1,3 MB.'),{status:400});
  const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(raw);
  if(!match) throw Object.assign(Error('Envie uma imagem JPG, PNG ou WEBP válida.'),{status:400});
  const photo=Buffer.from(match[2],'base64');
  if(photo.length===0 || photo.length>1300000) throw Object.assign(Error('A foto deve ter no máximo 1,3 MB.'),{status:400});
  const signatures={
    'image/jpeg':photo[0]===0xff&&photo[1]===0xd8&&photo[2]===0xff,
    'image/png':photo.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    'image/webp':photo.subarray(0,4).toString('ascii')==='RIFF'&&photo.subarray(8,12).toString('ascii')==='WEBP'
  };
  if(!signatures[match[1]]) throw Object.assign(Error('O conteúdo da foto não corresponde ao formato informado.'),{status:400});
  return {name,petType,photo,type:match[1]};
}
const bookingColumns=`id, pet_id AS "petId", customer_id AS "customerId", customer_name AS "customerName", customer_email AS "customerEmail", pet_name AS "petName", pet_type AS "petType", service, to_char(date,'YYYY-MM-DD') AS date, to_char(time,'HH24:MI') AS time, price::float8 AS price, status, notes, created_at AS "createdAt", updated_at AS "updatedAt"`;
const adminBookingColumns=bookingColumns.replace('pet_id AS "petId"','COALESCE(b.pet_id,(SELECT p.id FROM helppatas.pets p WHERE p.customer_id=b.customer_id AND lower(trim(p.name))=lower(trim(b.pet_name)) LIMIT 1)) AS "petId"');

function createApp(pool, {setupToken='', production=false}={}) {
  const app=express();
  app.disable('x-powered-by');
  if(production) app.set('trust proxy',1);
  app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],fontSrc:["'self'",'https://fonts.gstatic.com'],imgSrc:["'self'",'data:','https://images.unsplash.com','https://ui-avatars.com'],upgradeInsecureRequests:production?[]:null}},strictTransportSecurity:production?undefined:false}));
  app.use('/api',rateLimit({windowMs:60000,limit:150,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Muitas solicitações. Aguarde um minuto.'}}));
  app.use(express.json({limit:'2mb'}));
  app.use('/api',(req,res,next)=>{
    res.set('Cache-Control','no-store');
    if(!['GET','HEAD','OPTIONS'].includes(req.method)) {
      const expected=`${req.protocol}://${req.get('host')}`;
      if(req.get('origin')!==expected || !req.is('application/json')) return res.status(403).json({error:'Solicitação não autorizada. Abra o site pelo servidor.'});
    }
    next();
  });
  app.use(async(req,res,next)=>{
    try {
      const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('hp_session='))?.slice(11);
      if(raw&&/^[a-f0-9]{64}$/.test(raw)) {
        const {rows}=await pool.query(`SELECT u.* FROM helppatas.sessions s JOIN helppatas.users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()`,[digest(raw)]);
        req.user=rows[0]; req.sessionHash=digest(raw);
      }
      next();
    } catch(e){next(e);}
  });
  const auth=(req,res,next)=>req.user?next():res.status(401).json({error:'Entre na sua conta para continuar.'});
  const panel=(req,res,next)=>['admin','staff'].includes(req.user?.role)?next():res.status(req.user?403:401).json({error:'Acesso exclusivo da administraÃ§Ã£o.'});
  const owner=(req,res,next)=>req.user?.role==='admin'?next():res.status(req.user?403:401).json({error:'Somente o administrador pode gerenciar a equipe.'});
  const authLimit=rateLimit({windowMs:15*60000,limit:15,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Muitas tentativas. Aguarde 15 minutos.'}});
  async function session(res,user) {
    const token=randomBytes(32).toString('hex');
    await pool.query('DELETE FROM helppatas.sessions WHERE expires_at < now()');
    await pool.query(`INSERT INTO helppatas.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')`,[digest(token),user.id]);
    res.cookie('hp_session',token,{httpOnly:true,sameSite:'lax',secure:production,maxAge:7*86400000,path:'/'});
  }
  app.get('/api/auth/me',(req,res)=>res.json({user:req.user?publicUser(req.user):null}));
  app.post('/api/auth/register',authLimit,async(req,res)=>{
    const a=account(req.body);
    if(req.body.terms!==true) return res.status(400).json({error:'Aceite os termos para continuar.'});
    const {rows}=await pool.query(`INSERT INTO helppatas.users(id,name,surname,email,password_hash) VALUES($1,$2,$3,$4,$5) RETURNING *`,[randomUUID(),a.name,a.surname,a.email,await hashPassword(a.password)]);
    await session(res,rows[0]);res.status(201).json({user:publicUser(rows[0])});
  });
  app.post('/api/auth/login',authLimit,async(req,res)=>{
    const email=text(req.body.email,'e-mail',160).toLowerCase();
    if(typeof req.body.password!=='string'||req.body.password.length>128) return res.status(400).json({error:'Confira a senha.'});
    const {rows}=await pool.query('SELECT * FROM helppatas.users WHERE email=$1',[email]);
    // A real scrypt operation even for unknown accounts avoids a fast missing-user path.
    const encoded=rows[0]?.password_hash || `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`;
    if(!await verifyPassword(req.body.password,encoded)||!rows[0]) return res.status(401).json({error:'E-mail ou senha inválidos.'});
    if(req.sessionHash) await pool.query('DELETE FROM helppatas.sessions WHERE token_hash=$1',[req.sessionHash]);
    await session(res,rows[0]);res.json({user:publicUser(rows[0])});
  });
  app.post('/api/auth/logout',async(req,res)=>{
    if(req.sessionHash) await pool.query('DELETE FROM helppatas.sessions WHERE token_hash=$1',[req.sessionHash]);
    res.clearCookie('hp_session',{path:'/',httpOnly:true,sameSite:'lax',secure:production});res.json({ok:true});
  });
  app.post('/api/setup',authLimit,async(req,res)=>{
    const incoming=String(req.body.token||'');
    if(!setupToken||incoming.length!==setupToken.length||!timingSafeEqual(Buffer.from(incoming),Buffer.from(setupToken))) return res.status(403).json({error:'Chave de configuração inválida.'});
    const a=account(req.body), client=await pool.connect();let created;
    try {
      await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(61924017)');
      const exists=await client.query("SELECT 1 FROM helppatas.users WHERE role='admin' LIMIT 1");
      if(exists.rowCount) {await client.query('ROLLBACK');return res.status(409).json({error:'A administração já foi configurada.'});}
      const r=await client.query(`INSERT INTO helppatas.users(id,name,surname,email,password_hash,role) VALUES($1,$2,$3,$4,$5,'admin') RETURNING *`,[randomUUID(),a.name,a.surname,a.email,await hashPassword(a.password)]);
      created=r.rows[0];await client.query('COMMIT');
    }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
    await session(res,created);res.status(201).json({user:publicUser(created)});
  });
  app.get('/api/bookings',auth,async(req,res)=>{const {rows}=await pool.query(`SELECT ${bookingColumns} FROM helppatas.bookings WHERE customer_id=$1 ORDER BY date,time`,[req.user.id]);res.json({bookings:rows});});
  app.post('/api/bookings',auth,async(req,res)=>{
    const b=bookingData(req.body,req.user,false);
    const pet=await pool.query('SELECT id FROM helppatas.pets WHERE id=$1 AND customer_id=$2 OR customer_id=$2 AND lower(trim(name))=lower(trim($3)) ORDER BY (id=$1) DESC LIMIT 1',[uuid.test(String(req.body.petId||''))?req.body.petId:null,req.user.id,b.petName]);
    const {rows}=await pool.query(`INSERT INTO helppatas.bookings(id,pet_id,customer_id,customer_name,customer_email,pet_name,pet_type,service,date,time,price,status,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING ${bookingColumns}`,[randomUUID(),pet.rows[0]?.id||null,req.user.id,b.customerName,b.customerEmail,b.petName,b.petType,b.service,b.date,b.time,b.price,b.status,b.notes]);
    res.status(201).json({booking:rows[0]});
  });
  app.get('/api/pets',auth,async(req,res)=>{
    const {rows}=await pool.query(`SELECT id,name,pet_type AS "petType",photo_type AS "photoType",(photo_data IS NOT NULL) AS "hasPhoto" FROM helppatas.pets WHERE customer_id=$1 ORDER BY name`,[req.user.id]);
    res.json({pets:rows.map(p=>({...p,photoUrl:p.hasPhoto?`/api/pets/${p.id}/photo`:null}))});
  });
  app.get('/api/pets/:id/photo',auth,async(req,res)=>{
    if(!uuid.test(req.params.id)) return res.status(400).json({error:'Identificador inválido.'});
    const {rows}=await pool.query('SELECT photo_data,photo_type FROM helppatas.pets WHERE id=$1 AND customer_id=$2',[req.params.id,req.user.id]);
    if(!rows.length||!rows[0].photo_data)return res.status(404).end();
    res.set({'Content-Type':rows[0].photo_type,'Cache-Control':'private, no-store'}).send(rows[0].photo_data);
  });
  app.post('/api/pets',auth,async(req,res)=>{
    const p=petData(req.body);
    const {rows}=await pool.query(`INSERT INTO helppatas.pets(id,customer_id,name,pet_type,photo_data,photo_type) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,name,pet_type AS "petType",photo_type AS "photoType",(photo_data IS NOT NULL) AS "hasPhoto"`,[randomUUID(),req.user.id,p.name,p.petType,p.photo,p.type]);
    const pet=rows[0];res.status(201).json({pet:{...pet,photoUrl:pet.hasPhoto?`/api/pets/${pet.id}/photo`:null}});
  });
  app.put('/api/pets/:id',auth,async(req,res)=>{
    if(!uuid.test(req.params.id)) return res.status(400).json({error:'Identificador inválido.'});
    const p=petData(req.body);
    const {rows}=await pool.query(`UPDATE helppatas.pets SET name=$3,pet_type=$4,photo_data=COALESCE($5,photo_data),photo_type=COALESCE($6,photo_type),updated_at=now() WHERE id=$1 AND customer_id=$2 RETURNING id,name,pet_type AS "petType",photo_type AS "photoType",(photo_data IS NOT NULL) AS "hasPhoto"`,[req.params.id,req.user.id,p.name,p.petType,p.photo,p.type]);
    if(!rows.length)return res.status(404).json({error:'Pet não encontrado.'});
    const pet=rows[0];res.json({pet:{...pet,photoUrl:pet.hasPhoto?`/api/pets/${pet.id}/photo`:null}});
  });
  app.delete('/api/pets/:id',auth,async(req,res)=>{
    if(!uuid.test(req.params.id)) return res.status(400).json({error:'Identificador inválido.'});
    const result=await pool.query('DELETE FROM helppatas.pets WHERE id=$1 AND customer_id=$2',[req.params.id,req.user.id]);
    if(!result.rowCount)return res.status(404).json({error:'Pet não encontrado.'});
    res.json({ok:true});
  });
  app.use('/api/admin',panel);
  app.get('/api/admin/pets/:id/photo',async(req,res)=>{
    if(!uuid.test(req.params.id)) return res.status(400).json({error:'Identificador inválido.'});
    const {rows}=await pool.query('SELECT photo_data,photo_type FROM helppatas.pets WHERE id=$1',[req.params.id]);
    if(!rows.length||!rows[0].photo_data)return res.status(404).end();
    res.set({'Content-Type':rows[0].photo_type,'Cache-Control':'private, no-store'}).send(rows[0].photo_data);
  });
  app.get('/api/admin/bookings',async(req,res)=>{res.json({bookings:(await pool.query(`SELECT ${adminBookingColumns} FROM helppatas.bookings b ORDER BY date,time`)).rows});});
  app.get('/api/admin/customers',async(req,res)=>{res.json({customers:(await pool.query(`SELECT id,name,surname,email FROM helppatas.users WHERE role='customer' ORDER BY name`)).rows});});
  app.get('/api/admin/staff',panel,async(req,res)=>{res.json({staff:(await pool.query(`SELECT id,name,surname,email,role,created_at AS "createdAt" FROM helppatas.users WHERE role='staff' ORDER BY name`)).rows});});
  app.post('/api/admin/staff',owner,async(req,res)=>{
    const a=account(req.body);
    const {rows}=await pool.query(`INSERT INTO helppatas.users(id,name,surname,email,password_hash,role) VALUES($1,$2,$3,$4,$5,'staff') RETURNING id,name,surname,email,role,created_at AS "createdAt"`,[randomUUID(),a.name,a.surname,a.email,await hashPassword(a.password)]);
    res.status(201).json({staff:rows[0]});
  });
  app.post('/api/admin/bookings',async(req,res)=>{
    const b=bookingData(req.body,req.user,true);
    const customer=await pool.query('SELECT id FROM helppatas.users WHERE email=$1',[b.customerEmail.toLowerCase()]);
    const pet=customer.rows[0]?await pool.query('SELECT id FROM helppatas.pets WHERE customer_id=$1 AND lower(trim(name))=lower(trim($2)) LIMIT 1',[customer.rows[0].id,b.petName]):{rows:[]};
    const {rows}=await pool.query(`INSERT INTO helppatas.bookings(id,pet_id,customer_id,customer_name,customer_email,pet_name,pet_type,service,date,time,price,status,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING ${bookingColumns}`,[randomUUID(),pet.rows[0]?.id||null,customer.rows[0]?.id||null,b.customerName,b.customerEmail,b.petName,b.petType,b.service,b.date,b.time,b.price,b.status,b.notes]);res.status(201).json({booking:rows[0]});
  });
  app.put('/api/admin/bookings/:id',async(req,res)=>{
    if(!uuid.test(req.params.id)) return res.status(400).json({error:'Identificador inválido.'});
    const b=bookingData(req.body,req.user,true);
    const {rows}=await pool.query(`UPDATE helppatas.bookings SET customer_name=$2,customer_email=$3,pet_name=$4,pet_type=$5,service=$6,date=$7,time=$8,price=$9,status=$10,notes=$11,updated_at=now() WHERE id=$1 RETURNING ${bookingColumns}`,[req.params.id,b.customerName,b.customerEmail,b.petName,b.petType,b.service,b.date,b.time,b.price,b.status,b.notes]);
    if(!rows.length)return res.status(404).json({error:'Agendamento não encontrado.'});res.json({booking:rows[0]});
  });
  app.delete('/api/admin/bookings/:id',async(req,res)=>{
    if(!uuid.test(req.params.id)) return res.status(400).json({error:'Identificador inválido.'});
    const result=await pool.query('DELETE FROM helppatas.bookings WHERE id=$1',[req.params.id]);
    if(!result.rowCount)return res.status(404).json({error:'Agendamento não encontrado.'});
    res.json({ok:true});
  });
  app.patch('/api/admin/bookings/:id/status',async(req,res)=>{
    if(!uuid.test(req.params.id)||!statuses.includes(req.body.status))return res.status(400).json({error:'Status ou identificador inválido.'});
    const {rows}=await pool.query(`UPDATE helppatas.bookings SET status=$2,updated_at=now() WHERE id=$1 RETURNING ${bookingColumns}`,[req.params.id,req.body.status]);
    if(!rows.length)return res.status(404).json({error:'Agendamento não encontrado.'});res.json({booking:rows[0]});
  });
  app.use('/api',(req,res)=>res.status(404).json({error:'Rota não encontrada.'}));
  const root=path.resolve(__dirname,'..');
  app.get(['/admin.html','/admin'],(req,res,next)=>{if(!req.user)return res.redirect('/login.html?next=admin');if(!['admin','staff'].includes(req.user.role))return res.status(403).send('Acesso exclusivo da administração.');next();});
  const files=new Set(['index.html','login.html','criar-conta.html','agendamento.html','banho-e-tosa.html','loja.html','dashboard-cliente.html','admin.html','setup.html','admin.css','admin.js','style.css','visual.css','script.js','api.js','account.js','setup.js','grooming.js']);
  app.use('/assets',express.static(path.join(root,'assets'),{dotfiles:'deny',index:false}));
  app.get('/',(req,res)=>res.sendFile(path.join(root,'index.html')));
  app.get('/:file',(req,res,next)=>files.has(req.params.file)?res.sendFile(path.join(root,req.params.file)):next());
  app.use((req,res)=>res.status(404).send('Página não encontrada.'));
  app.use((err,req,res,next)=>{
    if(err.code==='23505')return res.status(409).json({error:'Este e-mail já está cadastrado.'});
    const status=err.status>=400&&err.status<500?err.status:500;
    if(status===500)console.error('Falha na operação:',err.code||err.name); // Never log connection strings, passwords or request bodies.
    res.status(status).json({error:status===500?'Não foi possível concluir. Tente novamente.':err.message});
  });
  return app;
}
module.exports={createApp,account,bookingData};
