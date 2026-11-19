window.petApi = async function (url, options = {}) {
  try {
    const response = await fetch(url, {credentials:'same-origin', ...options, headers:{'Content-Type':'application/json', ...options.headers}});
    const data = await response.json().catch(() => null);
    if (!data) {
      const local = !location.hostname || ['localhost', '127.0.0.1'].includes(location.hostname);
      throw new Error(local
        ? 'Abra o site pelo servidor helpPatas na porta 3000, em vez do Live Server.'
        : 'Não foi possível acessar o serviço. Tente novamente em instantes.');
    }
    if (!response.ok) { const error = new Error(data.error || 'Não foi possível concluir.'); error.status=response.status; throw error; }
    return data;
  } catch(error) {
    if(error instanceof TypeError) throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    throw error;
  }
};
