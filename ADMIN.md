# Administração conectada ao Neon

## Iniciar

Use Node.js 24 ou superior. Execute `npm.cmd install` uma vez e `npm.cmd start` para iniciar. Também há a tarefa **helpPatas: servidor** no VS Code.

Abra `http://127.0.0.1:3000`. O Live Server na porta 5500 e páginas abertas por arquivo não executam a API. O servidor só publica arquivos permitidos; configuração, código do servidor e logs não são públicos.

A conexão fica em `.env`, ignorado pelo Git. Use [.env.example](./.env.example) apenas como modelo, sem credenciais. Não publique o projeto por um servidor que permita baixar arquivos privados.

## Primeiro administrador

Se não houver administrador, o terminal mostra um link privado de configuração. Abra-o, escolha nome, e-mail e uma senha de pelo menos 10 caracteres. A senha é escolhida por você; não há senha padrão. Após criar a conta, o primeiro acesso é desativado enquanto houver um administrador no banco. O link muda ao reiniciar o servidor.

Os próximos acessos usam [Login](./login.html). Contas administrativas são direcionadas ao painel; clientes acessam a própria área. Um cadastro público nunca recebe permissão administrativa.

## Como usar

- Cadastre um atendimento em Novo agendamento. Edite dados e observações pelo botão Editar.
- Atualize o status na agenda. O cancelamento pede confirmação e mantém o registro no histórico.
- Busque por pet, tutor ou serviço e filtre por data e status. Exportar CSV gera um relatório dos registros filtrados, sem senhas.
- As contas de clientes cadastradas no site aparecem em Clientes. Os indicadores usam registros reais, sem exemplos fictícios.
- Agendamentos feitos pelo site são salvos como pendentes. O valor de serviços concluídos é estimado, não um registro de pagamentos. Hospedagem e creche usam preço inicial diário; ajuste o total ao editar.

## Dados e segurança

As tabelas ficam no schema `helppatas`, criado de forma aditiva, sem substituir tabelas existentes. Contas, sessões e agendamentos ficam no Neon. Senhas são protegidas com scrypt e salt individual. Cookies de sessão são HttpOnly e SameSite; tokens no banco são hashes, com validade de sete dias. A API valida dados e verifica a permissão em cada rota administrativa. Há limite de tentativas de login e verificação de origem para operações de escrita.

Contas e agendamentos da demonstração antiga em localStorage não são importados automaticamente, para não reutilizar senhas sem proteção nem dados fictícios. Os clientes devem criar uma conta nova. Só o carrinho continua local. Login Google/Apple, recuperação de senha, pagamentos e confirmação por e-mail ainda não estão implementados.

## Publicação e testes

### Vercel

A publicação usa [vercel.json](./vercel.json) e a função [api/index.js](./api/index.js). Todas as páginas, inclusive a administração, passam pelo Express; apenas o diretório `public` é publicado diretamente. O arquivo privado `.env` não é enviado.

No projeto da Vercel, abra **Settings → Environment Variables**, adicione `DATABASE_URL` com a conexão atual do Neon e selecione **Production** (e **Preview** se também for testar previews). Use o mesmo banco para entrar com o administrador já criado. Não envie a senha pelo chat.

Depois envie estas alterações ao repositório conectado à Vercel e faça um novo deployment. Se o projeto tiver configurações manuais antigas, use **Framework Preset: Other**, raiz do projeto nesta pasta e Node.js 24. O arquivo de configuração define o diretório público.

Verifique `/api/auth/me`: sem login, deve retornar JSON com `user: null`, nunca HTML ou erro 404. Entre pelo login publicado. Cookies em produção são enviados apenas por HTTPS. A criação inicial de administrador está desativada na função online.

O servidor de desenvolvimento escuta apenas nesta máquina. Para publicação, hospede o Node atrás de HTTPS, defina `NODE_ENV=production` e configure um único proxy confiável (o servidor usa `trust proxy = 1`). Configure também recuperação de acesso, monitoramento e backups conforme sua operação. O CSV é um relatório, não um backup restaurável. Esta entrega não publica o site.

`npm.cmd test` executa testes de senha e validação. `node --env-file=.env tests/integration.cjs` verifica persistência no Neon, sessões, restrições administrativas, isolamento de clientes, origem, arquivos privados e logout. O teste cria contas temporárias próprias e remove apenas os registros que criou.
