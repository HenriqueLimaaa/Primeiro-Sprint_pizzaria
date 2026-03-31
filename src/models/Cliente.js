  // ============================================================
  // Cliente.js — Model de Cliente (sql.js)
  // ============================================================

  // Importa funções do banco SQLite
  // ready → garante que o banco está pronto
  // query → executa SELECT retornando vários registros
  // get   → executa SELECT retornando um único registro
  // run   → executa INSERT, UPDATE, DELETE
  const { ready, query, run, get } = require('../database/sqlite');

  // Função para formatar os dados vindos do banco
  function formatarCliente(row) {

    // Se não existir resultado, retorna null
    if (!row) return null;

    // Converte o formato do banco para um objeto mais organizado
    return {
      _id:        row.id, // compatibilidade (ex: frontend estilo Mongo)
      id:         row.id,
      nome:       row.nome,
      telefone:   row.telefone,

      // Converte string JSON em objeto
      endereco:   JSON.parse(row.endereco || '{}'),

      observacoes: row.observacoes,

      // Converte 1/0 do banco para true/false
      ativo:      row.ativo === 1,

      createdAt:  row.created_at,
      updatedAt:  row.updated_at,
    };
  }

  // Objeto que representa o "model" de Cliente
  const Cliente = {

    // ============================================================
    // Buscar todos os clientes (com ou sem filtro)
    // ============================================================
    async findAll(busca = '') {
      await ready; // espera o banco estar pronto

      let rows;

      if (busca) {
        // Se houver busca, procura por nome OU telefone
        const t = `%${busca}%`;

        rows = query(
          'SELECT * FROM clientes WHERE ativo = 1 AND (nome LIKE ? OR telefone LIKE ?) ORDER BY nome',
          [t, t]
        );
      } else {
        // Sem busca → retorna todos ativos
        rows = query(
          'SELECT * FROM clientes WHERE ativo = 1 ORDER BY nome'
        );
      }

      // Formata todos os resultados antes de retornar
      return rows.map(formatarCliente);
    },

    // ============================================================
    // Buscar cliente pelo ID
    // ============================================================
    async findById(id) {
      await ready;

      // Busca um único registro
      const row = get(
        'SELECT * FROM clientes WHERE id = ?',
        [id]
      );

      // Formata o resultado
      return formatarCliente(row);
    },

    // ============================================================
    // Criar um novo cliente
    // ============================================================
    async create({ nome, telefone, endereco = {}, observacoes = '' }) {
      await ready;

      // Insere no banco
      const info = run(
        'INSERT INTO clientes (nome, telefone, endereco, observacoes) VALUES (?, ?, ?, ?)',
        [
          nome.trim(),                 // remove espaços extras
          telefone.trim(),
          JSON.stringify(endereco),   // converte objeto para string
          observacoes
        ]
      );

      // Retorna o cliente recém-criado
      return this.findById(info.lastInsertRowid);
    },

    // ============================================================
    // Atualizar cliente
    // ============================================================
    async update(id, { nome, telefone, endereco, observacoes, ativo }) {
      await ready;

      // Busca o cliente atual
      const atual = get(
        'SELECT * FROM clientes WHERE id = ?',
        [id]
      );

      // Se não existir, retorna null
      if (!atual) return null;

      // Pega endereço atual e converte para objeto
      const endAtual = JSON.parse(atual.endereco || '{}');

      // Junta endereço antigo com o novo (sem perder dados antigos)
      const endFinal = endereco
        ? { ...endAtual, ...endereco }
        : endAtual;

      // Atualiza no banco
      run(`
        UPDATE clientes SET
          nome        = ?,
          telefone    = ?,
          endereco    = ?,
          observacoes = ?,
          ativo       = ?,
          updated_at  = datetime('now') -- atualiza data automaticamente
        WHERE id = ?
      `, [
        // Se vier valor novo usa ele, senão mantém o antigo
        nome        ?? atual.nome,
        telefone    ?? atual.telefone,
        JSON.stringify(endFinal),
        observacoes ?? atual.observacoes,

        // Converte boolean para 1 ou 0
        ativo !== undefined ? (ativo ? 1 : 0) : atual.ativo,

        id
      ]);

      // Retorna o cliente atualizado
      return this.findById(id);
    },

    // ============================================================
    // Deletar cliente
    // ============================================================
    async delete(id) {
      await ready;

      const info = run(
        'DELETE FROM clientes WHERE id = ?',
        [id]
      );

      // Retorna true se deletou, false se não encontrou
      return info.changes > 0;
    },
  };

  // Exporta o model
  module.exports = Cliente;
