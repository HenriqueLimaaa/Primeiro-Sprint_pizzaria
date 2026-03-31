🍕 Pizzaria - Sistema de Pedidos

Sistema web para gerenciamento de pedidos de uma pizzaria, desenvolvido com Node.js, SQLite e frontend simples em HTML, CSS e JavaScript.

📁 Estrutura do Projeto
Primeiro-Sprint_pizzaria/
│
├── public/              # Arquivos do frontend
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── src/
│   ├── database/        # Configuração do banco SQLite
│   │   └── sqlite.js
│   │
│   ├── middlewares/     # Middlewares (ex: autenticação)
│   │   └── auth.js
│   │
│   ├── models/          # Modelos do sistema
│   │   ├── Cliente.js
│   │   ├── Pedido.js
│   │   ├── Pizza.js
│   │   └── Usuario.js
│   │
│   └── routes/          # Rotas da aplicação
│       └── index.js
│
├── .env                 # Variáveis de ambiente
├── .gitignore           # Arquivos ignorados pelo Git
├── index.js             # Arquivo principal do servidor
├── package.json         # Configurações do projeto
├── package-lock.json
├── pizzaria.db          # Banco de dados SQLite
├── seed.js              # Script para popular o banco
└── README.md            # Documentação
🚀 Tecnologias Utilizadas
Node.js
Express
SQLite
JavaScript (Frontend e Backend)
HTML5 + CSS3
dotenv
bcryptjs
⚙️ Funcionalidades
Cadastro de usuários
Autenticação (login)
Cadastro de clientes
Cadastro de pizzas
Criação de pedidos
Associação de itens aos pedidos
Integração com banco de dados SQLite
🛠️ Instalação e Execução
1. Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd Primeiro-Sprint_pizzaria
2. Instale as dependências
npm install
3. Configure o arquivo .env

Exemplo:

PORT=3000
4. Rode o seed (popular banco)
node seed.js
5. Inicie o servidor
node index.js
🌐 Acesso ao Sistema

Abra no navegador:

http://localhost:3000
🧠 Organização do Código
📌 Models (src/models)

Responsáveis por representar e manipular os dados:

Cliente
Pedido
Pizza
Usuário
📌 Routes (src/routes)

Define as rotas da aplicação (API).

📌 Database (src/database)

Configuração e conexão com o banco SQLite.

📌 Middlewares (src/middlewares)

Funções intermediárias, como:

Autenticação
Validação
🔐 Segurança
Senhas criptografadas com bcrypt
Uso de variáveis de ambiente com dotenv
📦 Banco de Dados

O sistema utiliza SQLite, armazenado no arquivo:

pizzaria.db
🧪 Seed do Banco

O arquivo seed.js:

Limpa o banco
Insere dados iniciais para testes
📄 .gitignore

Certifique-se de ignorar:

node_modules/
.env
pizzaria.db
👨‍💻 Autor

Desenvolvido por:
Eduardo de Figueiredo Ferreira Gandra
Henrique Lima da Silva
