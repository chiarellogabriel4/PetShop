'use strict';
(() => {
  const list = document.getElementById('staffRequestListPanel') || document.getElementById('staffRequestList');
  if (!list) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const toast = message => { const element=document.getElementById('adminToast'); if(element){element.textContent=message;element.classList.add('show');setTimeout(()=>element.classList.remove('show'),3200);} };
  function render(requests) {
    list.innerHTML = requests.length ? requests.map(request => {
      const date = request.createdAt ? new Date(request.createdAt).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}) : 'Data não informada';
      return `<article class="client staff-request-item"><span class="avatar" aria-hidden="true">${esc((request.name || '?').slice(0,1).toUpperCase())}</span><div class="staff-request-details"><strong>${esc(request.name)} ${esc(request.surname)}</strong><small><b>E-mail:</b> ${esc(request.email)}</small><small><b>Telefone:</b> ${esc(request.phone || 'Não informado')}</small><small><b>Cargo desejado:</b> ${esc(request.requestedPosition)}</small><small><b>Enviado em:</b> ${esc(date)}</small><small><b>Status:</b> ${esc(request.status)}</small>${request.status === 'Pendente' ? `<div class="request-actions"><button class="primary" data-request-action="Aprovado" data-request-id="${esc(request.id)}">Aprovar e criar acesso</button><button class="secondary" data-request-action="Recusado" data-request-id="${esc(request.id)}">Recusar</button></div>` : ''}</div></article>`;
    }).join('') : '<div class="empty"><h3>Nenhuma solicitação</h3><p>Os pedidos enviados pela página de solicitação aparecerão aqui.</p></div>';
  }
  async function load() {
    try { render((await petApi('/api/admin/staff-requests')).requests); }
    catch (error) { list.innerHTML = `<div class="empty"><p>${esc(error.message)}</p></div>`; }
  }
  list.addEventListener('click', async event => {
    const button = event.target.closest('[data-request-id]');
    if (!button) return;
    const status = button.dataset.requestAction;
    if (status === 'Recusado' && !confirm('Recusar esta solicitação?')) return;
    button.disabled = true;
    try { const result=await petApi(`/api/admin/staff-requests/${button.dataset.requestId}`,{method:'PATCH',body:JSON.stringify({status})});toast(result.message);await load(); }
    catch (error) { button.disabled=false;toast(error.message); }
  });
  load();
})();
