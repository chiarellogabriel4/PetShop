const { test }=require('node:test');
const assert=require('node:assert/strict');
const { createApp }=require('../server/app');

test('customer dashboard route serves the page after authentication',async()=>{
  const app=createApp({query:async()=>({rows:[]})});
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  try {
    const response=await fetch(`http://127.0.0.1:${server.address().port}/dashboard-cliente.html`);
    assert.equal(response.status,200);
    assert.match(await response.text(),/<title>helpPatas petshop \| Dashboard do Cliente<\/title>/);
  } finally {
    await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  }
});
