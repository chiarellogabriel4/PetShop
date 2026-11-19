const accountMessage = document.getElementById('accountMessage');
const safeText = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadAccount() {
  try {
    const {user}=await petApi('/api/auth/me');
    if(!user){location.href='login.html';return;}
    document.getElementById('accountName').textContent=`Olá, ${user.name}!`;
    document.getElementById('adminLink').hidden=user.role!=='admin';
    const {bookings}=await petApi('/api/bookings');
    document.getElementById('accountBookings').innerHTML=bookings.map(b=>`<tr><td><strong>${safeText(b.petName)}</strong><small>${safeText(b.petType)}</small></td><td>${safeText(b.service)}</td><td>${safeText(b.date.split('-').reverse().join('/'))}<small>${safeText(b.time)}</small></td><td>${safeText(b.status)}</td><td>${Number(b.price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td></tr>`).join('');
    accountMessage.textContent=bookings.length?'Os valores são estimados. A equipe confirmará os detalhes do atendimento.':'Você ainda não tem agendamentos. Escolha um serviço para começar.';
  } catch(error){accountMessage.textContent=error.message;}
}
document.getElementById('accountLogout').addEventListener('click',async()=>{try{await petApi('/api/auth/logout',{method:'POST',body:'{}'});location.href='login.html';}catch(error){accountMessage.textContent=error.message;}});
window.addEventListener('focus',loadAccount);
loadAccount();
