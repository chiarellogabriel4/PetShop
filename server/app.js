const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { randomUUID, randomBytes, timingSafeEqual, createPublicKey, createVerify, createSign } = require('node:crypto');
const path = require('node:path');
const { hashPassword, verifyPassword, digest } = require('./security');

const services = {'Banho e Tosa':69,'Consulta Veterinária':89,'Vacinação':120,'Hospedagem':49,'Creche Pet':59,'Emergência 24h':0};
const statuses = ['Pendente','Confirmado','Em atendimento','Concluído','Cancelado'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const publicUser = u => ({id:u.id,name:u.name,surname:u.surname,email:u.email,role:u.role,avatar:u.avatar_url||(u.avatar_data?'/api/profile/avatar':null)});
const base64url = value => Buffer.from(value).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const decodeBase64url = value => Buffer.from(value.replace(/-/g,'+').replace(/_/g,'/'),'base64');
function decodeJwt(token) {
  const parts=String(token||'').split('.');
  if(parts.length!==3) throw Object.assign(Error('Token OAuth inválido.'),{status:401});
  try { return {header:JSON.parse(decodeBase64url(parts[0]).toString()),payload:JSON.parse(decodeBase64url(parts[1]).toString()),signingInput:`${parts[0]}.${parts[1]}`,signature:decodeBase64url(parts[2])}; }
  catch { throw Object.assign(Error('Token OAuth inválido.'),{status:401}); }
}
async function verifyJwt(token, jwksUrl, expected) {
  const decoded=decodeJwt(token);
  if(decoded.header.alg!=='RS256'&&decoded.header.alg!=='ES256') throw Object.assign(Error('Algoritmo OAuth não permitido.'),{status:401});
  const response=await fetch(jwksUrl); if(!response.ok) throw Object.assign(Error('Não foi possível validar o provedor OAuth.'),{status:502});
  const {keys}=await response.json(); const jwk=keys.find(key=>key.kid===decoded.header.kid&&key.alg===decoded.header.alg);
  if(!jwk) throw Object.assign(Error('Chave de assinatura OAuth não encontrada.'),{status:401});
  const verifier=createVerify(decoded.header.alg==='RS256'?'RSA-SHA256':'SHA256'); verifier.update(decoded.signingInput); verifier.end();
  let signature=decoded.signature;
  if(decoded.header.alg==='ES256'&&signature.length===64) { const r=signature.subarray(0,32),s=signature.subarray(32); const derLength=6+((r[0]&0x80)?1:0)+((s[0]&0x80)?1:0); signature=Buffer.concat([Buffer.from([0x30,derLength,0x02,32+(r[0]&0x80?1:0)]),r[0]&0x80?Buffer.from([0]):Buffer.alloc(0),r,Buffer.from([0x02,32+(s[0]&0x80?1:0)]),s[0]&0x80?Buffer.from([0]):Buffer.alloc(0),s]); }
  if(!verifier.verify(createPublicKey({key:jwk,format:'jwk'}),signature)) throw Object.assign(Error('Assinatura OAuth inválida.'),{status:401});
  const now=Math.floor(Date.now()/1000);
  if(expected.iss&&!expected.iss.includes(decoded.payload.iss)||expected.aud&&decoded.payload.aud!==expected.aud||decoded.payload.exp<now||decoded.payload.iat>now+120) throw Object.assign(Error('Claims OAuth inválidos.'),{status:401});
  if(expected.nonce&&decoded.payload.nonce!==expected.nonce) throw Object.assign(Error('Nonce OAuth inválido.'),{status:401});
  return decoded.payload;
}
function appleClientSecret() {
  const key=String(process.env.APPLE_PRIVATE_KEY||'').replace(/\\n/g,'\n');
  const header=base64url(JSON.stringify({alg:'ES256',kid:process.env.APPLE_KEY_ID,typ:'JWT'}));
  const payload=base64url(JSON.stringify({iss:process.env.APPLE_TEAM_ID,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+86400*150,aud:'https://appleid.apple.com',sub:process.env.APPLE_CLIENT_ID}));
  const input=`${header}.${payload}`; const signer=createSign('SHA256'); signer.update(input); signer.end(); const der=signer.sign(key);
  let offset=2; const read=()=>{const length=der[offset+1];const start=offset+2;offset=start+length;return der.subarray(start,start+length)}; const r=read(),s=read();
  return `${input}.${base64url(Buffer.concat([r.length>32?r.subarray(r.length-32):Buffer.concat([Buffer.alloc(32-r.length),r]),s.length>32?s.subarray(s.length-32):Buffer.concat([Buffer.alloc(32-s.length),s])]))}`;
}
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
function staffRequestData(body) {
  const name=text(body.name,'nome',100), surname=text(body.surname,'sobrenome',100,false);
  const email=text(body.email,'e-mail',160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(Error('Informe um e-mail válido.'),{status:400});
  const requestedPosition=text(body.requestedPosition,'cargo desejado',100);
  const phone=text(body.phone,'telefone',30,false);
  if(typeof body.password!=='string' || body.password.length<10 || body.password.length>128) throw Object.assign(Error('A senha deve ter entre 10 e 128 caracteres.'),{status:400});
  return {name,surname,email,phone,requestedPosition,password:body.password};
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
  app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],fontSrc:["'self'",'https://fonts.gstatic.com'],imgSrc:["'self'",'data:','https://images.unsplash.com','https://ui-avatars.com','https://*.googleusercontent.com'],upgradeInsecureRequests:production?[]:null}},strictTransportSecurity:production?undefined:false}));
  app.use('/api',rateLimit({windowMs:60000,limit:150,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Muitas solicitações. Aguarde um minuto.'}}));
  app.use(express.json({limit:'2mb'}));
  app.use(express.urlencoded({extended:false}));
  app.use('/api',(req,res,next)=>{
    res.set('Cache-Control','no-store');
    const oauthCallback=/^\/api\/auth\/(google|apple)\/callback$/.test(req.path);
    if(!['GET','HEAD','OPTIONS'].includes(req.method)&&!oauthCallback) {
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
  const panel=(req,res,next)=>['admin','staff'].includes(req.user?.role)?next():res.status(req.user?403:401).json({error:'Acesso exclusivo da administração.'});
  const owner=(req,res,next)=>req.user?.role==='admin'?next():res.status(req.user?403:401).json({error:'Somente o administrador pode gerenciar a equipe.'});
  const authLimit=rateLimit({windowMs:15*60000,limit:15,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Muitas tentativas. Aguarde 15 minutos.'}});
  async function session(res,user) {
    const token=randomBytes(32).toString('hex');
    await pool.query('DELETE FROM helppatas.sessions WHERE expires_at < now()');
    await pool.query(`INSERT INTO helppatas.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')`,[digest(token),user.id]);
    res.cookie('hp_session',token,{httpOnly:true,sameSite:'lax',secure:production,maxAge:7*86400000,path:'/'});
  }
  const socialProviderConfig = {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY)
  };
  app.get('/api/auth/providers',(req,res)=>res.json(socialProviderConfig));
  for (const provider of ['google','apple']) {
    app.get(`/api/auth/${provider}/start`,(req,res)=>{
      const name = provider === 'google' ? 'Google' : 'Apple';
      if (!socialProviderConfig[provider]) return res.status(503).json({error:`O login com ${name} ainda não foi configurado. Preencha as variáveis OAuth no arquivo .env.`});
      res.status(501).json({error:`O login com ${name} está aguardando a configuração do callback OAuth.`});
    });
  }
  function oauthCookie(res,name,value) { res.cookie(name,value,{httpOnly:true,sameSite:'lax',secure:production,maxAge:10*60*1000,path:'/'}); }
  function oauthState(res,provider) { const state=randomBytes(32).toString('hex'),nonce=randomBytes(32).toString('hex');oauthCookie(res,`oauth_state_${provider}`,state);oauthCookie(res,`oauth_nonce_${provider}`,nonce);return {state,nonce}; }
  function oauthCookieValue(req,name) { return (req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(`${name}=`))?.slice(name.length+1); }
  function checkOAuthState(req,res,provider,state) { const expected=oauthCookieValue(req,`oauth_state_${provider}`),nonce=oauthCookieValue(req,`oauth_nonce_${provider}`);res.clearCookie(`oauth_state_${provider}`,{path:'/'});res.clearCookie(`oauth_nonce_${provider}`,{path:'/'});if(!expected||!state||expected.length!==String(state).length||!timingSafeEqual(Buffer.from(expected),Buffer.from(String(state))))throw Object.assign(Error('Estado OAuth inválido ou expirado.'),{status:401});return nonce; }
  async function oauthUser(provider,claims) {
    const email=String(claims.email||'').toLowerCase();if(!email||claims.email_verified===false)throw Object.assign(Error('O provedor não confirmou o e-mail desta conta.'),{status:401});
    const existing=await pool.query('SELECT * FROM helppatas.users WHERE (oauth_provider=$1 AND oauth_subject=$2) OR email=$3 LIMIT 1',[provider,claims.sub,email]);
    const displayName=String(claims.name||email.split('@')[0]||'Cliente').trim().slice(0,100);const [name,...surnameParts]=displayName.split(/\s+/);const surname=surnameParts.join(' ').slice(0,100);
    if(existing.rows[0]) { const user=existing.rows[0];if(user.oauth_provider&&(user.oauth_provider!==provider||user.oauth_subject!==claims.sub))throw Object.assign(Error('Este e-mail já está vinculado a outro login social.'),{status:409});const {rows}=await pool.query('UPDATE helppatas.users SET oauth_provider=$2,oauth_subject=$3,avatar_url=COALESCE($4,avatar_url),name=COALESCE(NULLIF($5,\'\'),name),surname=COALESCE(NULLIF($6,\'\'),surname) WHERE id=$1 RETURNING *',[user.id,provider,claims.sub,claims.picture||null,name,surname]);return rows[0]; }
    const {rows}=await pool.query('INSERT INTO helppatas.users(id,name,surname,email,password_hash,oauth_provider,oauth_subject,avatar_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[randomUUID(),name,surname,email,await hashPassword(randomBytes(32).toString('hex')),provider,claims.sub,claims.picture||null]);return rows[0];
  }
  const oauthRedirect=()=>`${(process.env.OAUTH_REDIRECT_BASE_URL||`${production?'https':'http'}://${process.env.PUBLIC_HOST||'127.0.0.1:3000'}`).replace(/\/$/,'')}`;
  app.get('/api/auth/google/begin',(req,res)=>{if(!socialProviderConfig.google)return res.status(503).json({error:'O login com Google ainda não foi configurado.'});const {state,nonce}=oauthState(res,'google');const redirect=`${oauthRedirect()}/api/auth/google/callback`;const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');for(const [k,v] of Object.entries({client_id:process.env.GOOGLE_CLIENT_ID,redirect_uri:redirect,response_type:'code',scope:'openid email profile',state,nonce}))url.searchParams.set(k,v);res.json({url:url.toString()});});
  app.get('/api/auth/google/callback',async(req,res)=>{try{const nonce=checkOAuthState(req,res,'google',req.query.state);const redirect=`${oauthRedirect()}/api/auth/google/callback`;const body=new URLSearchParams({code:String(req.query.code||''),client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,redirect_uri:redirect,grant_type:'authorization_code'});const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});const tokens=await response.json();if(!response.ok)throw Error(tokens.error_description||'Falha ao trocar o código Google.');const claims=await verifyJwt(tokens.id_token,'https://www.googleapis.com/oauth2/v3/certs',{iss:'https://accounts.google.com',aud:process.env.GOOGLE_CLIENT_ID,nonce});const user=await oauthUser('google',claims);await session(res,user);res.redirect('/dashboard-cliente.html');}catch(error){res.redirect(`/login.html?oauth_error=${encodeURIComponent(error.message||'Falha no login Google.')}`);}});
  app.get('/api/auth/apple/begin',(req,res)=>{if(!socialProviderConfig.apple)return res.status(503).json({error:'O login com Apple ainda não foi configurado.'});const {state,nonce}=oauthState(res,'apple');const redirect=`${oauthRedirect()}/api/auth/apple/callback`;const url=new URL('https://appleid.apple.com/auth/authorize');for(const [k,v] of Object.entries({client_id:process.env.APPLE_CLIENT_ID,redirect_uri:redirect,response_type:'code',response_mode:'form_post',scope:'name email',state,nonce}))url.searchParams.set(k,v);res.json({url:url.toString()});});
  app.post('/api/auth/apple/callback',async(req,res)=>{try{const nonce=checkOAuthState(req,res,'apple',req.body.state);const redirect=`${oauthRedirect()}/api/auth/apple/callback`;const body=new URLSearchParams({client_id:process.env.APPLE_CLIENT_ID,client_secret:appleClientSecret(),code:String(req.body.code||''),grant_type:'authorization_code',redirect_uri:redirect});const response=await fetch('https://appleid.apple.com/auth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});const tokens=await response.json();if(!response.ok)throw Error(tokens.error_description||'Falha ao trocar o código Apple.');const claims=await verifyJwt(tokens.id_token,'https://appleid.apple.com/auth/keys',{iss:'https://appleid.apple.com',aud:process.env.APPLE_CLIENT_ID,nonce});const user=await oauthUser('apple',claims);await session(res,user);res.redirect('/dashboard-cliente.html');}catch(error){res.redirect(`/login.html?oauth_error=${encodeURIComponent(error.message||'Falha no login Apple.')}`);}});
  app.get('/api/auth/me',(req,res)=>res.json({user:req.user?publicUser(req.user):null}));
  app.get('/api/profile/avatar',auth,async(req,res)=>{
    const {rows}=await pool.query('SELECT avatar_data,avatar_type FROM helppatas.users WHERE id=$1',[req.user.id]);
    if(!rows.length||!rows[0].avatar_data)return res.status(404).end();
    res.set({'Content-Type':rows[0].avatar_type,'Cache-Control':'private, no-store'}).send(rows[0].avatar_data);
  });
  app.put('/api/profile/avatar',auth,async(req,res)=>{
    const image=petData({name:'avatar',petType:'',photo:req.body.photo});
    await pool.query('UPDATE helppatas.users SET avatar_data=$2,avatar_type=$3,avatar_url=NULL WHERE id=$1',[req.user.id,image.photo,image.type]);
    const {rows}=await pool.query('SELECT * FROM helppatas.users WHERE id=$1',[req.user.id]);
    res.json({user:publicUser(rows[0])});
  });
  app.delete('/api/profile/avatar',auth,async(req,res)=>{await pool.query('UPDATE helppatas.users SET avatar_data=NULL,avatar_type=NULL WHERE id=$1',[req.user.id]);res.json({user:publicUser({...req.user,avatar_data:null,avatar_url:null})});});
  app.post('/api/auth/register',authLimit,async(req,res)=>{
    const a=account(req.body);
    if(req.body.terms!==true) return res.status(400).json({error:'Aceite os termos para continuar.'});
    const {rows}=await pool.query(`INSERT INTO helppatas.users(id,name,surname,email,password_hash) VALUES($1,$2,$3,$4,$5) RETURNING *`,[randomUUID(),a.name,a.surname,a.email,await hashPassword(a.password)]);
    await session(res,rows[0]);res.status(201).json({user:publicUser(rows[0])});
  });
  app.post('/api/staff-requests',authLimit,async(req,res)=>{
    const request=staffRequestData(req.body);
    const existing=await pool.query('SELECT 1 FROM helppatas.users WHERE email=$1 UNION ALL SELECT 1 FROM helppatas.staff_requests WHERE email=$1 AND status=\'Pendente\' LIMIT 1',[request.email]);
    if(existing.rowCount) throw Object.assign(Error('Já existe uma conta ou solicitação pendente para este e-mail.'),{status:409});
    await pool.query(`INSERT INTO helppatas.staff_requests(id,name,surname,email,phone,requested_position,password_hash) VALUES($1,$2,$3,$4,$5,$6,$7)`,[randomUUID(),request.name,request.surname,request.email,request.phone,request.requestedPosition,await hashPassword(request.password)]);
    res.status(201).json({message:'Solicitação enviada. Aguarde a análise da administração.'});
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
  app.get('/api/admin/staff-requests',owner,async(req,res)=>{res.json({requests:(await pool.query(`SELECT id,name,surname,email,phone,requested_position AS "requestedPosition",status,created_at AS "createdAt" FROM helppatas.staff_requests WHERE status <> 'Recusado' ORDER BY CASE WHEN status='Pendente' THEN 0 ELSE 1 END, created_at DESC`)).rows});});
  app.patch('/api/admin/staff-requests/:id',owner,async(req,res)=>{
    if(!uuid.test(req.params.id)||!['Aprovado','Recusado'].includes(req.body.status)) return res.status(400).json({error:'Solicitação ou status inválido.'});
    const client=await pool.connect();
    try {
      await client.query('BEGIN');
      const result=await client.query(`SELECT * FROM helppatas.staff_requests WHERE id=$1 AND status='Pendente' FOR UPDATE`,[req.params.id]);
      if(!result.rows.length){await client.query('ROLLBACK');return res.status(404).json({error:'Solicitação não encontrada ou já analisada.'});}
      const request=result.rows[0];
      if(req.body.status==='Aprovado') await client.query(`INSERT INTO helppatas.users(id,name,surname,email,password_hash,role) VALUES($1,$2,$3,$4,$5,'staff')`,[randomUUID(),request.name,request.surname,request.email,request.password_hash]);
      await client.query(`UPDATE helppatas.staff_requests SET status=$2,reviewed_at=now(),reviewed_by=$3 WHERE id=$1`,[request.id,req.body.status,req.user.id]);
      await client.query('COMMIT');
      res.json({ok:true,message:req.body.status==='Aprovado'?'Solicitação aprovada e acesso criado.':'Solicitação recusada.'});
    } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  });
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
  const files=new Set(['index.html','login.html','criar-conta.html','agendamento.html','banho-e-tosa.html','loja.html','admin.html','staff-request.html','setup.html','admin.css','admin.js','staff-request.js','staff-requests-admin.js','style.css','visual.css','script.js','api.js','account.js','setup.js','grooming.js']);
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
