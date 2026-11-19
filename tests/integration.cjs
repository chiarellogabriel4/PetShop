// Explicit integration check against DATABASE_URL. Cleans only the UUIDs it creates.
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {createPool,migrate}=require('../server/db');
const {createApp}=require('../server/app');
const {hashPassword}=require('../server/security');
async function run(){
  const pool=createPool();await migrate(pool);
  const adminId=randomUUID(), suffix=randomUUID(), ids=[];
  let server;
  try{
    await pool.query("INSERT INTO helppatas.users(id,name,email,password_hash,role) VALUES($1,'Integration admin',$2,$3,'admin')",[adminId,`test-admin-${suffix}@example.invalid`,await hashPassword('Integration-secret-123')]);
    server=createApp(pool).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
    const origin=`http://127.0.0.1:${server.address().port}`;
    async function request(route,method='GET',body,cookie){const res=await fetch(origin+route,{method,headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return{status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};}
    assert.equal((await request('/api/admin/bookings')).status,401);
    const register=await request('/api/auth/register','POST',{name:'Integration customer',surname:'Test',email:`test-customer-${suffix}@example.invalid`,password:'Integration-secret-123',terms:true});
    assert.equal(register.status,201);ids.push(register.data.user.id);const customerCookie=register.cookie;
    assert.equal((await request('/api/admin/bookings','GET',null,customerCookie)).status,403);
    const customer2=await request('/api/auth/register','POST',{name:'Other customer',email:`test-other-${suffix}@example.invalid`,password:'Integration-secret-123',terms:true});ids.push(customer2.data.user.id);
    const booked=await request('/api/bookings','POST',{petName:'Integration pet',petType:'Gato',service:'Banho e Tosa',date:'2099-01-01',time:'09:30',price:0,status:'Concluído'},customerCookie);
    assert.equal(booked.status,201);assert.equal(booked.data.booking.price,69);assert.equal(booked.data.booking.status,'Pendente');
    const other=await request('/api/bookings','GET',null,customer2.cookie);assert.equal(other.data.bookings.some(b=>b.id===booked.data.booking.id),false);
    const login=await request('/api/auth/login','POST',{email:`test-admin-${suffix}@example.invalid`,password:'Integration-secret-123'});assert.equal(login.status,200);
    const updated=await request(`/api/admin/bookings/${booked.data.booking.id}/status`,'PATCH',{status:'Concluído'},login.cookie);assert.equal(updated.status,200);
    assert.equal((await request('/api/bookings','GET',null,customerCookie)).data.bookings[0].status,'Concluído');
    const customers=await request('/api/admin/customers','GET',null,login.cookie);assert.ok(customers.data.customers.every(c=>!('password_hash'in c)&&!('password'in c)));
    const badOrigin=await fetch(origin+'/api/auth/logout',{method:'POST',headers:{Origin:'https://other.invalid','Content-Type':'application/json',Cookie:login.cookie},body:'{}'});assert.equal(badOrigin.status,403);
    const env=await fetch(origin+'/.env');assert.equal(env.status,404);
    const config=await fetch(origin+'/server/db.js');assert.equal(config.status,404);
    const adminPage=await fetch(origin+'/admin.html',{redirect:'manual'});assert.equal(adminPage.status,302);
    await request('/api/auth/logout','POST',{},login.cookie);assert.equal((await request('/api/admin/bookings','GET',null,login.cookie)).status,401);
    console.log('Integration passed: Neon persistence, authentication, roles, isolation, CSRF, private files, logout.');
  } finally {
    if(server)await new Promise(r=>server.close(r));
    const all=[adminId,...ids];
    await pool.query('DELETE FROM helppatas.bookings WHERE customer_id=ANY($1::uuid[])',[all]);
    await pool.query('DELETE FROM helppatas.users WHERE id=ANY($1::uuid[])',[all]);await pool.end();
  }
}
run().catch(e=>{console.error('Integration failed:',e.name,e.code||'',e.message?.includes('assert')?'assertion':'check tests/integration.cjs');process.exitCode=1;});
