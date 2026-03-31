// Define a URL base da API (backend)
const API = '/api';

// Arrays para armazenar pizzas e clientes em cache (evita várias requisições)
let cPizzas   = [];
let cClientes = [];

// Recupera token e usuário do localStorage (sessão salva)
let TOKEN          = localStorage.getItem('pz_token') || '';
let USUARIO_LOGADO = JSON.parse(localStorage.getItem('pz_usuario') || 'null');

// Variável usada ao fechar uma mesa
let mesaEmFechamento = null;

// ======================= LOGIN =======================

// Função responsável por fazer login
async function fazerLogin() {
  // Captura valores digitados
  const email = document.getElementById('l-email').value.trim();
  const senha = document.getElementById('l-senha').value;

  // Elementos da interface
  const btn   = document.getElementById('btn-login');
  const erro  = document.getElementById('login-erro');

  // Validação simples
  if (!email || !senha) {
    erro.style.display = 'block';
    erro.textContent   = 'Preencha e-mail e senha.';
    return;
  }

  // Feedback visual
  btn.disabled    = true;
  btn.textContent = 'Entrando...';
  erro.style.display = 'none';

  try {
    // Requisição para API de login
    const res  = await fetch(API + '/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, senha }),
    });

    const data = await res.json();

    // Se erro, dispara exception
    if (!res.ok) throw new Error(data.erro || 'Credenciais inválidas');

    // Salva token e usuário
    TOKEN = data.token;
    USUARIO_LOGADO = data.usuario;

    localStorage.setItem('pz_token', TOKEN);
    localStorage.setItem('pz_usuario', JSON.stringify(data.usuario));

    // Aplica permissões do usuário
    aplicarPerfil(data.usuario);

    // Libera interface
    document.body.classList.add('logado');

  } catch (e) {
    // Exibe erro
    erro.style.display = 'block';
    erro.textContent   = e.message;
  } finally {
    // Restaura botão
    btn.disabled    = false;
    btn.textContent = 'Entrar';
  }
}

// ======================= LOGOUT =======================

// Limpa sessão do usuário
function sair() {
  TOKEN = '';
  USUARIO_LOGADO = null;

  localStorage.removeItem('pz_token');
  localStorage.removeItem('pz_usuario');

  document.body.classList.remove('logado');
  document.getElementById('l-senha').value = '';
}

// Se já estiver logado, reaplica sessão
if (TOKEN && USUARIO_LOGADO) {
  aplicarPerfil(USUARIO_LOGADO);
  document.body.classList.add('logado');
}

// ======================= UI =======================

// Toast (mensagem rápida na tela)
function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `show ${tipo}`;
  setTimeout(() => el.className = '', 3000);
}

// Abrir modal
function abrir(id)  { document.getElementById(id).classList.add('open'); }

// Fechar modal
function fechar(id) { document.getElementById(id).classList.remove('open'); }

// Fecha modal ao clicar fora
document.querySelectorAll('.modal-bg').forEach(bg =>
  bg.addEventListener('click', e => {
    if (e.target === bg) bg.classList.remove('open');
  })
);

// Formata valor para Real (R$)
function R$(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}

// Badge de status do pedido
function badge(s) {
  const r = {
    recebido:     '📥 Recebido',
    em_preparo:   '👨‍🍳 Em Preparo',
    saiu_entrega: '🛵 Saiu p/ Entrega',
    entregue:     '✅ Entregue',
    cancelado:    '❌ Cancelado',
  };
  return `<span class="badge b-${s}">${r[s] || s}</span>`;
}

// ======================= API GENÉRICA =======================

// Função padrão para chamadas à API
async function api(method, url, body) {
  const opts = {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${TOKEN}`, // autenticação
    },
  };

  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(API + url, opts);
  const data = await res.json();

  // Se token expirou
  if (res.status === 401) {
    sair();
    throw new Error('Sessão expirada');
  }

  // Tratamento de erro
  if (!res.ok) throw new Error(data.erro || 'Erro na requisição');

  return data;
}

// ======================= PERFIL =======================

// Controla o que cada tipo de usuário pode ver
function aplicarPerfil(usuario) {
  document.getElementById('sb-nome').textContent   = usuario.nome;
  document.getElementById('sb-perfil').textContent = usuario.perfil;

  const perfil  = usuario.perfil;
  const isAdmin = perfil === 'Administrador';
  const isGar   = perfil === 'Garcom';

  // Função auxiliar para mostrar/esconder elementos
  function show(id, visible, type = 'flex') {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? type : 'none';
  }

  function showEl(el, visible, type = 'flex') {
    if (el) el.style.display = visible ? type : 'none';
  }

  // Controle de permissões
  show('menu-usuarios',   isAdmin, 'block');
  show('btn-usuarios',    isAdmin, 'flex');
  show('sb-group-garcom', isGar,   'block');
  show('btn-nav-mesas',   isGar,   'flex');

  // Esconde páginas para garçom
  showEl(document.querySelector('[onclick*="clientes"]'),  !isGar);
  showEl(document.querySelector('[onclick*="pedidos"]'),   !isGar);
  showEl(document.querySelector('[onclick*="dashboard"]'), !isGar);

  // Ajusta textos dinamicamente
  const labelPizzas = document.getElementById('nav-pizzas-label');
  if (labelPizzas) labelPizzas.textContent = isGar ? 'Cardápio' : 'Pizzas';

  // Redirecionamento automático
  if (isGar) {
    ir('mesas', document.getElementById('btn-nav-mesas'));
  } else {
    ir('dashboard', document.querySelector('[onclick*="dashboard"]'));
  }
}

// ======================= NAVEGAÇÃO =======================

// Troca de páginas do sistema
function ir(pg, btn) {
  const perfil = document.getElementById('sb-perfil').textContent;

  // Restrições de acesso
  if (pg === 'usuarios' && perfil !== 'Administrador') {
    toast('Acesso restrito a Administradores', 'err'); return;
  }

  if (pg === 'mesas' && perfil !== 'Garcom') {
    toast('Área exclusiva para Garçom', 'err'); return;
  }

  // Remove páginas ativas
  document.querySelectorAll('.secao').forEach(s => s.classList.remove('ativa'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('ativo'));

  // Ativa nova página
  document.getElementById('pg-' + pg).classList.add('ativa');
  if (btn) btn.classList.add('ativo');

  // Funções que carregam dados
  const loaders = {
    dashboard: carregarDashboard,
    pedidos:   carregarPedidos,
    pizzas:    carregarPizzas,
    clientes:  carregarClientes,
    usuarios:  carregarUsuarios,
    mesas:     carregarMesas,
  };

  // Executa carregamento da página
  if (loaders[pg]) loaders[pg]();
}

// ======================= PEDIDOS / MESA =======================

// Recalcula valores do pedido da mesa
function recalcMesa() {
  let sub = 0;

  document.querySelectorAll('#itens-mesa-lista .item-row').forEach(row => {
    const sel = row.querySelector('.ip');
    const tam = row.querySelector('.it').value.toLowerCase();
    const qtd = parseInt(row.querySelector('.iq').value) || 0;

    // Pega preço do dataset (data-p, data-m, data-g)
    const pc  = parseFloat(sel.options[sel.selectedIndex]?.dataset?.[tam] || 0);

    const s   = pc * qtd;
    sub += s;

    row.querySelector('.is').textContent = R$(s);
  });

  document.getElementById('pm-sub').textContent = R$(sub);
  document.getElementById('pm-tot').textContent = R$(sub);
}

// ======================= RESUMO =======================
// Esse código faz:
// ✔ Login e controle de sessão
// ✔ Controle de permissões por perfil
// ✔ Comunicação com API (CRUD completo)
// ✔ Gerenciamento de pedidos, mesas, pizzas e clientes
// ✔ Atualização dinâmica da interface (DOM)
// ✔ Cálculo automático de valores
