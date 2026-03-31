// Importa a biblioteca jsonwebtoken (usada para criar e validar tokens JWT)
const jwt = require('jsonwebtoken');

// Middleware de autenticação (protege rotas)
function autenticar(req, res, next) {

  // Pega o header "Authorization" da requisição
  const authHeader = req.headers['authorization'];

  // Extrai o token (formato esperado: "Bearer TOKEN")
  const token = authHeader && authHeader.split(' ')[1];

  // Se não houver token, bloqueia o acesso
  if (!token) {
    return res.status(401).json({
      erro: 'Token não fornecido. Faça login.'
    });
  }

  try {
    // Verifica se o token é válido usando a chave secreta
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Salva os dados do usuário dentro da requisição
    // (assim outras rotas conseguem acessar req.usuario)
    req.usuario = payload;

    // Libera o acesso para a próxima função/rota
    next();

  } catch (erro) {

    // Se o token for inválido ou expirado
    return res.status(401).json({
      erro: 'Token inválido ou expirado.'
    });
  }
}

// Exporta a função para ser usada em outras partes do sistema
module.exports = autenticar;
