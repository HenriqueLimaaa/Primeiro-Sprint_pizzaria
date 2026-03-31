// Carrega variáveis de ambiente do arquivo .env
require('dotenv').config()

// Importa as bibliotecas necessárias
const express = require('express') // Framework para criar o servidor
const cors = require('cors')       // Permite acesso de outras origens (ex: front-end)
const path = require('path')       // Trabalhar com caminhos de arquivos

// Cria a aplicação Express
const app = express()

// Define a porta (usa a do .env ou 3001 como padrão)
const PORT = process.env.PORT || 3001

// Middlewares globais
app.use(cors()) // Libera requisições externas
app.use(express.json()) // Permite trabalhar com JSON no body das requisições

// Serve arquivos estáticos (HTML, CSS, JS) da pasta "public"
app.use(express.static(path.join(__dirname, 'public')))

// Importa a conexão com o banco (SQLite)
const { ready } = require('./src/database/sqlite')

// Importa as rotas da API
const routes = require('./src/routes/index')

// Aguarda o banco estar pronto antes de iniciar o servidor
ready.then(() => {

  // Define o prefixo "/api" para todas as rotas
  app.use('/api', routes)

  // Rota de teste da API
  app.get('/teste', (req, res) => {
    res.json({
      mensagem: 'API da Pizzaria funcionando!',
      status: 'online',
      porta: PORT
    })
  })

  // Rota principal (carrega o front-end)
  app.get('', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
  })

  // Inicia o servidor
  app.listen(PORT, () => {
    console.log('=================================')
    console.log('Servidor rodando na porta ' + PORT)
    console.log('API: http://localhost:' + PORT + '/api')
    console.log('Front-end: http://localhost:' + PORT)
    console.log('=================================')
  })

// Caso dê erro ao conectar com o banco
}).catch(err => {
  console.error('Erro ao inicializar banco:', err)

  // Encerra a aplicação com erro
  process.exit(1)
})
