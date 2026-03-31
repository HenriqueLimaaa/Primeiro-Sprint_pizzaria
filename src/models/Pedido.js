// ============================================================
// Pedido.js — Model de Pedido (sql.js)
// ============================================================

// Importa funções do banco
const { ready, query, run, get } = require('../database/sqlite');

// Query base para buscar pedidos com dados do cliente (JOIN)
const SELECT_PEDIDO = `
  SELECT
    p.*, -- todos os campos do pedido
    c.nome     AS cliente_nome,
    c.telefone AS cliente_telefone
  FROM pedidos p
  LEFT JOIN clientes c ON c.id = p.cliente_id
`;

// Função que formata o pedido para um objeto organizado
function formatarPedido(row, itens = []) {

  // Se não existir resultado
  if (!row) return null;

  return {
    _id:           row.id,
    id:            row.id,

    // Número do pedido
    numeroPedido:  row.numero_pedido,

    // Dados do cliente (embutido)
    cliente: {
      _id:      row.cliente_id,
      id:       row.cliente_id,
      nome:     row.cliente_nome,
      telefone: row.cliente_telefone,
    },

    // Lista de itens do pedido
    itens: itens.map(it => ({
      _id:           it.id,
      pizza:         it.pizza_id,
      nomePizza:     it.nome_pizza,
      tamanho:       it.tamanho,
      quantidade:    it.quantidade,
      precoUnitario: it.preco_unitario,
      subtotal:      it.subtotal,
    })),

    // Valores financeiros
    subtotal:       row.subtotal,
    taxaEntrega:    row.taxa_entrega,
    total:          row.total,

    // Informações adicionais
    formaPagamento: row.forma_pagamento,
    troco:          row.troco,
    status:         row.status,
    observacoes:    row.observacoes,
    mesa:           row.mesa,
    origem:         row.origem,
    garcom:         row.garcom_id,

    // Datas
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

// Model de Pedido
const Pedido = {

  // ============================================================
  // Buscar todos os pedidos
  // ============================================================
  async findAll({ garcomId } = {}) {
    await ready;

    let rows;

    if (garcomId) {
      // Filtra por garçom (se informado)
      rows = query(
        `${SELECT_PEDIDO} WHERE p.garcom_id = ? ORDER BY p.created_at DESC`,
        [garcomId]
      );
    } else {
      // Retorna todos
      rows = query(
        `${SELECT_PEDIDO} ORDER BY p.created_at DESC`
      );
    }

    // Para cada pedido, busca seus itens
    return rows.map(row => {
      const itens = query(
        'SELECT * FROM itens_pedido WHERE pedido_id = ?',
        [row.id]
      );

      return formatarPedido(row, itens);
    });
  },

  // ============================================================
  // Buscar pedido por ID
  // ============================================================
  async findById(id) {
    await ready;

    const row = get(
      `${SELECT_PEDIDO} WHERE p.id = ?`,
      [id]
    );

    if (!row) return null;

    // Busca os itens do pedido
    const itens = query(
      'SELECT * FROM itens_pedido WHERE pedido_id = ?',
      [id]
    );

    return formatarPedido(row, itens);
  },

  // ============================================================
  // Criar novo pedido
  // ============================================================
  async create({
    clienteId,
    itens,
    taxaEntrega = 0,
    formaPagamento,
    troco = 0,
    observacoes = '',
    mesa = null,
    origem = 'balcao',
    garcomId = null
  }) {
    await ready;

    // Importa model de Pizza
    const Pizza = require('./Pizza');

    let subtotal = 0;
    const itensProcessados = [];

    // Processa cada item do pedido
    for (const item of itens) {

      // Busca pizza no banco
      const pizza = await Pizza.findById(item.pizza);

      if (!pizza) {
        throw new Error(`Pizza ID ${item.pizza} não encontrada`);
      }

      // Pega preço baseado no tamanho
      const preco = pizza.precos[item.tamanho] || 0;

      // Calcula subtotal do item
      const subItem = preco * item.quantidade;

      subtotal += subItem;

      // Salva item processado
      itensProcessados.push({
        pizzaId:       pizza.id,
        nomePizza:     pizza.nome,
        tamanho:       item.tamanho,
        quantidade:    item.quantidade,
        precoUnitario: preco,
        subtotal:      subItem,
      });
    }

    // Calcula total do pedido
    const total = subtotal + (taxaEntrega || 0);

    // Gera número do pedido (simples: contagem + 1)
    const contagem = get('SELECT COUNT(*) as total FROM pedidos');
    const numeroPedido = (contagem?.total || 0) + 1;

    // Insere pedido
    const infoPedido = run(`
      INSERT INTO pedidos
        (numero_pedido, cliente_id, subtotal, taxa_entrega, total,
         forma_pagamento, troco, observacoes, mesa, origem, garcom_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      numeroPedido,
      clienteId,
      subtotal,
      taxaEntrega || 0,
      total,
      formaPagamento,
      troco || 0,
      observacoes,
      mesa,
      origem,
      garcomId
    ]);

    const pedidoId = infoPedido.lastInsertRowid;

    // Insere os itens do pedido
    for (const it of itensProcessados) {
      run(`
        INSERT INTO itens_pedido
          (pedido_id, pizza_id, nome_pizza, tamanho, quantidade, preco_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        pedidoId,
        it.pizzaId,
        it.nomePizza,
        it.tamanho,
        it.quantidade,
        it.precoUnitario,
        it.subtotal
      ]);
    }

    // Retorna pedido completo
    return this.findById(pedidoId);
  },

  // ============================================================
  // Atualizar status do pedido
  // ============================================================
  async updateStatus(id, status) {
    await ready;

    const info = run(
      "UPDATE pedidos SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, id]
    );

    // Se atualizou, retorna pedido atualizado
    return info.changes > 0
      ? this.findById(id)
      : null;
  },

  // ============================================================
  // Deletar pedido
  // ============================================================
  async delete(id) {
    await ready;

    // Remove itens primeiro (não há CASCADE)
    run(
      'DELETE FROM itens_pedido WHERE pedido_id = ?',
      [id]
    );

    // Remove pedido
    const info = run(
      'DELETE FROM pedidos WHERE id = ?',
      [id]
    );

    return info.changes > 0;
  },
};

// Exporta o model
module.exports = Pedido;
