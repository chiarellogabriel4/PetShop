'use strict';
(() => {
  let bookings = [], customers = [], staff = [], currentUser = null;
  const statuses = ['Pendente', 'Confirmado', 'Em atendimento', 'Concluído', 'Cancelado'];
  const prices = {'Banho e Tosa':69,'Consulta Veterinária':89,'Vacinação':120,'Hospedagem':49,'Creche Pet':59,'Emergência 24h':0};
  const $ = id => document.getElementById(id), form = $('adminBookingForm'), dialog = $('bookingDialog'), staffForm = $('staffForm'), staffDialog = $('staffDialog');
  const money = n => Number(n || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function read(key) { return key === "petcareUsers" ? customers : bookings; }
  function toast(message) { $('adminToast').textContent=message; $('adminToast').classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('adminToast').classList.remove('show'),3200); }
  function filtered() { return read('bookings').filter(b=>norm(`${b.petName} ${b.customerName} ${b.service}`).includes(norm($('bookingSearch').value)) && (!$('statusFilter').value || b.status===$('statusFilter').value) && (!$('dateFilter').value || b.date===$('dateFilter').value)).sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)); }
  function render() {
    try {
      const all=read('bookings'), done=all.filter(b=>b.status==='Concluído'), items=filtered();
      $('metricToday').textContent=all.filter(b=>b.date===today() && b.status!=='Cancelado').length;
      $('metricPending').textContent=all.filter(b=>b.status==='Pendente').length;
      $('metricDone').textContent=done.length;
      $('metricRevenue').textContent=money(done.reduce((sum,b)=>sum+(Number(b.price)||0),0));
      $('bookingRows').innerHTML=items.map(b=>`<tr><td class="booking-pet-cell">${b.petId?`<img class="pet-booking-thumb" src="/api/admin/pets/${esc(b.petId)}/photo" alt="Foto de ${esc(b.petName)}">`:'<span class="pet-booking-placeholder" aria-hidden="true">🐾</span>'}<div><strong>${esc(b.petName)}</strong><small>${esc(b.customerName || 'Tutor não informado')}</small></div></td><td>${esc(b.service)}<small>${esc(b.petType)}</small></td><td>${esc(String(b.date).split('-').reverse().join('/'))}<small>${esc(b.time)}</small></td><td>${money(b.price)}</td><td class="booking-note" title="${esc(b.notes || 'Sem observações')}">${esc(b.notes || 'Sem observações')}</td><td><select class="status" data-id="${esc(b.id)}" data-status="${esc(b.status)}" aria-label="Status do atendimento de ${esc(b.petName)}">${statuses.map(s=>`<option${s===b.status?' selected':''}>${s}</option>`).join('')}</select></td><td><button class="edit-button" data-edit="${esc(b.id)}">Editar<span class="sr-only"> atendimento de ${esc(b.petName)}</span></button><button class="delete-button" data-delete="${esc(b.id)}">Excluir<span class="sr-only"> atendimento de ${esc(b.petName)}</span></button></td></tr>`).join('');
      $('bookingEmpty').hidden=items.length>0; $('bookingCount').textContent=`${items.length} de ${all.length} agendamento(s)`;
      const clients=read('petcareUsers').filter(c=>norm(`${c.name} ${c.surname || ''} ${c.email}`).includes(norm($('clientSearch').value)));
      $('clientList').innerHTML=clients.length?clients.map(c=>`<article class="client"><span class="avatar" aria-hidden="true">${esc((c.name || '?').slice(0,1).toUpperCase())}</span><div><strong>${esc(c.name)} ${esc(c.surname)}</strong><small>${esc(c.email)}</small></div></article>`).join(''):'<div class="empty"><h3>Nenhum cliente encontrado</h3><p>As contas criadas no site aparecerão aqui.</p></div>';
      if(currentUser?.role==='admin') [...$('clientList').querySelectorAll('.client')].forEach((card,index)=>{
        const client=clients[index];
        if(!client) return;
        card.insertAdjacentHTML('beforeend',`<button class="secondary promote-client" type="button" data-promote-client="${esc(client.id)}">Tornar funcionário</button>`);
      });
    } catch { toast('Não foi possível ler os dados locais. Nenhum dado foi alterado.'); }
      $('newStaff').hidden=currentUser?.role!=='admin';
      $('staffList').innerHTML=staff.length?staff.map(c=>`<article class="client"><span class="avatar" aria-hidden="true">${esc((c.name || '?').slice(0,1).toUpperCase())}</span><div><strong>${esc(c.name)} ${esc(c.surname)}</strong><small>${esc(c.email)} · acesso operacional</small></div></article>`).join(''):'<div class="empty"><h3>Nenhum funcionário cadastrado</h3><p>Adicione pessoas da equipe para compartilhar o acesso ao painel.</p></div>';
  }
  async function refresh() {
    try {const [me,b,c,s]=await Promise.all([petApi('/api/auth/me'),petApi('/api/admin/bookings'),petApi('/api/admin/customers'),petApi('/api/admin/staff')]);currentUser=me.user;bookings=b.bookings;customers=c.customers;staff=s.staff;render();}
    catch(error){toast(error.message);if(error.status===401)location.href='login.html?next=admin';}
  }
  function openForm(b) { form.reset(); form.elements.id.value=''; form.elements.date.value=today(); form.elements.price.value=69; $('formError').textContent=''; $('dialogTitle').textContent=b?'Editar agendamento':'Novo agendamento'; if(b) for(const [k,v] of Object.entries(b)) if(form.elements.namedItem(k)) form.elements.namedItem(k).value=v??''; dialog.showModal(); }
  $('todayLabel').textContent=new Date().toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});
  $('newBooking').addEventListener('click',()=>openForm());
  for(const id of ['closeDialog','cancelDialog']) $(id).addEventListener('click',()=>dialog.close());
  form.elements.service.addEventListener('change',()=>{form.elements.price.value=prices[form.elements.service.value]??0;});
  form.addEventListener('submit',async event=>{
    event.preventDefault(); if(!form.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form));
    for(const k of ['petName','petType','customerName','customerEmail','notes']) data[k]=data[k].trim();
    if(!data.petName || !data.petType || !data.customerName) { $('formError').textContent='Preencha pet, tipo e tutor com informações válidas.'; return; }
    try {
      const button=form.querySelector('[type=submit]');button.disabled=true;
      try {
        await petApi(data.id?'/api/admin/bookings/'+data.id:'/api/admin/bookings',{method:data.id?'PUT':'POST',body:JSON.stringify({...data,price:Number(data.price)})});
        dialog.close();await refresh();toast('Agendamento salvo.');
      } finally {button.disabled=false;}
    } catch(error) { $('formError').textContent=error.message; }
  });
  $('bookingRows').addEventListener('click',event=>{ const button=event.target.closest('[data-edit]'); if(!button) return; try {const b=read('bookings').find(b=>b.id===button.dataset.edit); if(b) openForm(b);} catch {toast('Não foi possível abrir o agendamento.');} });
  $('bookingRows').addEventListener('click',async event=>{const button=event.target.closest('[data-delete]');if(!button)return;const booking=read('bookings').find(b=>b.id===button.dataset.delete);if(!booking)return;if(!confirm(`Excluir o agendamento de ${booking.petName}? Esta ação não pode ser desfeita.`))return;button.disabled=true;try{await petApi('/api/admin/bookings/'+button.dataset.delete,{method:'DELETE',body:'{}'});await refresh();toast('Agendamento excluído.');}catch(error){button.disabled=false;toast(error.message);}});
  $('newStaff').addEventListener('click',()=>{staffForm.reset();$('staffFormError').textContent='';staffDialog.showModal();});
  $('clientList').addEventListener('click',async event=>{
    const button=event.target.closest('[data-promote-client]');
    if(!button) return;
    const client=customers.find(item=>item.id===button.dataset.promoteClient);
    if(!client || !confirm(`Definir ${client.name} ${client.surname || ''} como funcionário?`)) return;
    button.disabled=true;
    try {
      await petApi(`/api/admin/customers/${button.dataset.promoteClient}/role`,{method:'PATCH',body:JSON.stringify({role:'staff'})});
      await refresh();
      toast('Cliente promovido a funcionário.');
    } catch(error) { button.disabled=false; toast(error.message); }
  });
  for(const id of ['closeStaffDialog','cancelStaffDialog']) $(id).addEventListener('click',()=>staffDialog.close());
  staffForm.addEventListener('submit',async event=>{
    event.preventDefault();if(!staffForm.reportValidity())return;
    const data=Object.fromEntries(new FormData(staffForm));
    try {const button=staffForm.querySelector('[type=submit]');button.disabled=true;try{await petApi('/api/admin/staff',{method:'POST',body:JSON.stringify(data)});staffDialog.close();await refresh();toast('Funcionário cadastrado com acesso ao painel.');}finally{button.disabled=false;}}
    catch(error){$('staffFormError').textContent=error.message;}
  });
  $('bookingRows').addEventListener('change',async event=>{
    const select=event.target.closest('select[data-id]');if(!select)return;
    if(select.value==='Cancelado'&&!confirm('Cancelar o atendimento? O registro permanece no hist'+String.fromCharCode(243)+'rico.')){render();return;}
    select.disabled=true;
    try{await petApi('/api/admin/bookings/'+select.dataset.id+'/status',{method:'PATCH',body:JSON.stringify({status:select.value})});await refresh();toast('Status atualizado.');}
    catch(error){toast(error.message);render();}
  });
  for(const id of ['bookingSearch','statusFilter','dateFilter','clientSearch']) $(id).addEventListener('input',render);
  $('clearFilters').addEventListener('click',()=>{for(const id of ['bookingSearch','statusFilter','dateFilter']) $(id).value='';render();});
  $('exportBookings').addEventListener('click',()=>{
    try {const items=filtered();if(!items.length){toast('Não há agendamentos para exportar com esses filtros.');return;}
      const cell=v=>{const s=String(v??'');return `"${(/^[\s]*[=+@-]/.test(s)?"'"+s:s).replace(/"/g,'""')}"`;};
      const rows=[['Pet','Tutor','E-mail','Serviço','Data','Horário','Valor estimado','Status'],...items.map(b=>[b.petName,b.customerName,b.customerEmail,b.service,b.date,b.time,b.price,b.status])];
      const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
      const link=document.createElement('a');link.href=url;link.download=`helppatas-agenda-${today()}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Agenda exportada.');
    } catch {toast('Não foi possível exportar a agenda.');}
  });
  document.querySelectorAll('nav a').forEach(link=>link.addEventListener('click',()=>{document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a===link));}));
  $('adminLogout').addEventListener('click',async()=>{try{await petApi('/api/auth/logout',{method:'POST',body:'{}'});location.href='login.html';}catch(error){toast(error.message);}});
  window.addEventListener('focus',refresh);
  refresh();
})();
