window.petApi = async function (url, options = {}) {
  try {
    const response = await fetch(url, {credentials:'same-origin', ...options, headers:{'Content-Type':'application/json', ...options.headers}});
    const data = await response.json().catch(() => null);
    if (!data) throw new Error('Abra o site pelo servidor helpPatas na porta 3000, em vez do Live Server.');
    if (!response.ok) { const error = new Error(data.error || 'Não foi possível concluir.'); error.status=response.status; throw error; }
    return data;
  } catch(error) {
    if(error instanceof TypeError) throw new Error('Não foi possível conectar ao servidor. Abra o site na porta 3000.');
    throw error;
  }
};
