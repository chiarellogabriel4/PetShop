const { test }=require('node:test');
const assert=require('node:assert/strict');
const {hashPassword,verifyPassword}=require('../server/security');
const {account,bookingData}=require('../server/app');
test('passwords are salted and verifiable, never stored as plaintext',async()=>{
  const a=await hashPassword('A-strong-test-password'), b=await hashPassword('A-strong-test-password');
  assert.notEqual(a,b);assert.ok(!a.includes('A-strong-test-password'));
  assert.equal(await verifyPassword('A-strong-test-password',a),true);
  assert.equal(await verifyPassword('incorrect',a),false);
});
test('account validation enforces email and a useful password minimum',()=>{
  assert.throws(()=>account({name:'Test',email:'wrong',password:'1234567890'}));
  assert.throws(()=>account({name:'Test',email:'test@example.com',password:'short'}));
});
test('customers cannot set price, status or another customer identity',()=>{
  const b=bookingData({petName:'Pet',petType:'Gato',service:'Banho e Tosa',date:'2099-01-01',time:'09:30',price:0,status:'Concluído',customerName:'Other'}, {name:'Real',surname:'Customer',email:'real@example.com'}, false);
  assert.equal(b.price,69);assert.equal(b.status,'Pendente');assert.equal(b.customerName,'Real Customer');
  assert.throws(()=>bookingData({...b,date:'2099-02-31'}, {},true));
  assert.throws(()=>bookingData({...b,service:'Unknown'}, {},true));
});
