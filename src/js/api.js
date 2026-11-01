// Camada de acesso a dados: encapsula a Fetch API sobre o JSON Server.

async function requisitar(caminho, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(caminho, {
      headers: { 'Content-Type': 'application/json' },
      ...opcoes,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o JSON Server está rodando (npm start).');
  }
  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} ao acessar ${caminho}`);
  }
  return resposta.json();
}

export const api = {
  listar: (caminho) => requisitar(caminho),
  obter: (caminho) => requisitar(caminho),
  criar: (caminho, dados) => requisitar(caminho, { method: 'POST', body: JSON.stringify(dados) }),
  substituir: (caminho, dados) => requisitar(caminho, { method: 'PUT', body: JSON.stringify(dados) }),
  atualizar: (caminho, dados) => requisitar(caminho, { method: 'PATCH', body: JSON.stringify(dados) }),
  remover: (caminho) => requisitar(caminho, { method: 'DELETE' }),
};
