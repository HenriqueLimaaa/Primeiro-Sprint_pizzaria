// ============================================================
// Usuario.js — Model de Usuário (sql.js)
// ============================================================

// Importa funções do banco
const { ready, query, run, get } = require('../database/sqlite');

// Importa bcrypt para criptografar senhas
const bcrypt = require('bcryptjs');

// Função para formatar os dados do usuário (sem senha!)
function formatarUsuario(row) {

  // Se não existir resultado
  if (!row) return null;

  return {
    _id:       row.id,
    id:        row.id,
    nome:      row.nome,
    email:     row.email,
    perfil:    row.perfil,

    // Converte 1/0 em boolean
    ativo:     row.ativo === 1,

    // Datas
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Model de Usuário
const Usuario = {

  // ============================================================
  // Listar todos os usuários
  // ============================================================
  async findAll() {
    await ready;

    // OBS: não retorna senha por segurança
    const rows = query(`
      SELECT id, nome, email, perfil, ativo, created_at, updated_at
      FROM usuarios ORDER BY created_at DESC
    `);

    return rows.map(formatarUsuario);
  },

  // ============================================================
  // Buscar usuário por email (usado no login)
  // ============================================================
  async findByEmail(email) {
    await ready;

    // Normaliza email (minúsculo e sem espaços)
    return get(
      'SELECT * FROM usuarios WHERE email = ?',
      [email.toLowerCase().trim()]
    );
  },

  // ============================================================
  // Buscar usuário por ID
  // ============================================================
  async findById(id) {
    await ready;

    // Também não retorna senha
    const row = get(`
      SELECT id, nome, email, perfil, ativo, created_at, updated_at
      FROM usuarios WHERE id = ?
    `, [id]);

    return formatarUsuario(row);
  },

  // ============================================================
  // Criar novo usuário
  // ============================================================
  async create({ nome, email, senha, perfil = 'Atendente' }) {
    await ready;

    // Criptografa a senha (hash)
    const hash = await bcrypt.hash(senha, 10);

    // Insere no banco
    const info = run(
      'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
      [
        nome.trim(),
        email.toLowerCase().trim(),
        hash, // salva senha criptografada
        perfil
      ]
    );

    // Retorna usuário criado (sem senha)
    return this.findById(info.lastInsertRowid);
  },

  // ============================================================
  // Atualizar usuário
  // ============================================================
  async update(id, { nome, email, senha, perfil, ativo }) {
    await ready;

    // Busca usuário atual
    const atual = get(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    if (!atual) return null;

    // Mantém senha atual se não for alterada
    let senhaFinal = atual.senha;

    // Se vier nova senha → criptografa
    if (senha) {
      senhaFinal = await bcrypt.hash(senha, 10);
    }

    // Atualiza no banco
    run(`
      UPDATE usuarios SET
        nome       = ?,
        email      = ?,
        senha      = ?,
        perfil     = ?,
        ativo      = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      nome   ?? atual.nome,
      email  ?? atual.email,
      senhaFinal,
      perfil ?? atual.perfil,

      // Converte boolean para 1/0
      ativo !== undefined
        ? (ativo ? 1 : 0)
        : atual.ativo,

      id
    ]);

    // Retorna usuário atualizado
    return this.findById(id);
  },

  // ============================================================
  // Deletar usuário
  // ============================================================
  async delete(id) {
    await ready;

    const info = run(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );

    return info.changes > 0;
  },

  // ============================================================
  // Verificar senha (login)
  // ============================================================
  verificarSenha(senhaDigitada, hashSalvo) {

    // Compara senha digitada com hash salvo no banco
    return bcrypt.compare(senhaDigitada, hashSalvo);
  },
};

// Exporta o model
module.exports = Usuario;
