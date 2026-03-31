// ============================================================
// Pizza.js — Model de Pizza (sql.js)
// ============================================================

// Importa funções do banco SQLite
const { ready, query, run, get } = require('../database/sqlite');

// Função para formatar os dados vindos do banco
function formatarPizza(row) {

  // Se não existir resultado
  if (!row) return null;

  return {
    _id:         row.id, // compatibilidade (ex: frontend)
    id:          row.id,
    nome:        row.nome,
    descricao:   row.descricao,
    ingredientes: row.ingredientes,

    // Converte string JSON em objeto (preços por tamanho)
    precos:      JSON.parse(row.precos || '{"P":0,"M":0,"G":0}'),

    // Converte 1/0 do banco para true/false
    disponivel:  row.disponivel === 1,

    categoria:   row.categoria,

    // Datas
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

// Model de Pizza
const Pizza = {

  // ============================================================
  // Buscar todas as pizzas
  // ============================================================
  async findAll() {
    await ready;

    // Ordena por categoria e nome
    const rows = query(
      'SELECT * FROM pizzas ORDER BY categoria, nome'
    );

    return rows.map(formatarPizza);
  },

  // ============================================================
  // Buscar pizza por ID
  // ============================================================
  async findById(id) {
    await ready;

    const row = get(
      'SELECT * FROM pizzas WHERE id = ?',
      [id]
    );

    return formatarPizza(row);
  },

  // ============================================================
  // Criar nova pizza
  // ============================================================
  async create({
    nome,
    descricao = '',
    ingredientes,
    precos = {},
    disponivel = true,
    categoria = 'tradicional'
  }) {
    await ready;

    // Insere no banco
    const info = run(
      'INSERT INTO pizzas (nome, descricao, ingredientes, precos, disponivel, categoria) VALUES (?, ?, ?, ?, ?, ?)',
      [
        nome.trim(),           // remove espaços extras
        descricao.trim(),
        ingredientes.trim(),

        // Garante estrutura padrão de preços
        JSON.stringify({
          P: precos.P || 0,
          M: precos.M || 0,
          G: precos.G || 0
        }),

        // Converte boolean para 1 ou 0
        disponivel ? 1 : 0,

        categoria
      ]
    );

    // Retorna a pizza criada
    return this.findById(info.lastInsertRowid);
  },

  // ============================================================
  // Atualizar pizza
  // ============================================================
  async update(id, {
    nome,
    descricao,
    ingredientes,
    precos,
    disponivel,
    categoria
  }) {
    await ready;

    // Busca pizza atual
    const atual = get(
      'SELECT * FROM pizzas WHERE id = ?',
      [id]
    );

    // Se não existir
    if (!atual) return null;

    // Converte preços atuais
    const precosAtuais = JSON.parse(
      atual.precos || '{"P":0,"M":0,"G":0}'
    );

    // Mescla preços antigos com novos
    const precosFinal = precos
      ? {
          P: precos.P ?? precosAtuais.P,
          M: precos.M ?? precosAtuais.M,
          G: precos.G ?? precosAtuais.G
        }
      : precosAtuais;

    // Atualiza no banco
    run(`
      UPDATE pizzas SET
        nome         = ?,
        descricao    = ?,
        ingredientes = ?,
        precos       = ?,
        disponivel   = ?,
        categoria    = ?,
        updated_at   = datetime('now') -- atualiza data
      WHERE id = ?
    `, [
      // Mantém valor antigo se não vier novo
      nome         ?? atual.nome,
      descricao    ?? atual.descricao,
      ingredientes ?? atual.ingredientes,
      JSON.stringify(precosFinal),

      // Converte boolean
      disponivel !== undefined
        ? (disponivel ? 1 : 0)
        : atual.disponivel,

      categoria ?? atual.categoria,
      id
    ]);

    // Retorna pizza atualizada
    return this.findById(id);
  },

  // ============================================================
  // Deletar pizza
  // ============================================================
  async delete(id) {
    await ready;

    const info = run(
      'DELETE FROM pizzas WHERE id = ?',
      [id]
    );

    // Retorna true se deletou
    return info.changes > 0;
  },
};

// Exporta o model
module.exports = Pizza;
