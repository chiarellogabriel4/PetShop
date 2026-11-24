'use strict';
(() => {
  const form = document.getElementById('staffRequestForm');
  const message = document.getElementById('staffRequestMessage');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    message.textContent = 'Enviando solicitação...';
    message.className = '';
    try {
      const data = Object.fromEntries(new FormData(form));
      delete data.terms;
      const result = await petApi('/api/staff-requests', {method:'POST', body:JSON.stringify(data)});
      message.textContent = result.message;
      message.className = 'success-message';
      form.reset();
    } catch (error) {
      message.textContent = error.message;
      message.className = 'error-message';
    } finally { button.disabled = false; }
  });
})();
