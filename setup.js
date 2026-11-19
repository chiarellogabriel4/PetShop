const setupToken = location.hash.slice(1);
history.replaceState(null, '', location.pathname);
const setupForm = document.getElementById('setupForm');
if (!setupToken) {document.getElementById('setupMessage').textContent='Abra o link privado de configuração exibido no terminal do servidor.';setupForm.querySelector('button').disabled=true;}
setupForm.addEventListener('submit', async event => {
  event.preventDefault(); const button=setupForm.querySelector('button');
  const data=Object.fromEntries(new FormData(setupForm));
  if(data.password!==data.confirmPassword) {document.getElementById('setupMessage').textContent='As senhas não conferem.';return;}
  button.disabled=true;
  try {await petApi('/api/setup',{method:'POST',body:JSON.stringify({...data,token:setupToken})});location.href='/admin.html';}
  catch(error){document.getElementById('setupMessage').textContent=error.message;button.disabled=false;}
});
