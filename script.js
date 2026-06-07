/* =========================================
   FoodLoop - script.js v2
   ========================================= */

// ===== UTILIDADES =====

function getAlimentos() {
  return JSON.parse(localStorage.getItem('foodloop_alimentos')) || [];
}

function salvarAlimentos(lista) {
  localStorage.setItem('foodloop_alimentos', JSON.stringify(lista));
}

function getEstoque() {
  return JSON.parse(localStorage.getItem('foodloop_estoque')) || [];
}

function getUsuario() {
  return localStorage.getItem('foodloop_user') || null;
}

function getTipoUsuario() {
  return localStorage.getItem('foodloop_user_tipo') || null;
}

function diasParaValidade(dataValidade) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const validade = new Date(dataValidade + 'T00:00:00');
  return Math.round((validade - hoje) / (1000 * 60 * 60 * 24));
}

function formatarData(data) {
  if (!data) return '—';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

window.emojiAlimento = function(nome) {
  const n = (nome || '').toLowerCase();
  if (/p[aã]o|bisc|bolacha|bolo/.test(n)) return '🍞';
  if (/fruta|ma[çc]a|banana|laranja|manga|uva|melo[aã]|abacaxi/.test(n)) return '🍎';
  if (/leite|iogurte|queijo|manteiga/.test(n)) return '🥛';
  if (/carne|frango|peixe|ovo/.test(n)) return '🥩';
  if (/arroz|feij[aã]o|macarr[aã]o|massa/.test(n)) return '🍚';
  if (/vegetal|legume|cenoura|batata|alface|tomate|cebola/.test(n)) return '🥦';
  if (/refrigerante|suco|bebida|['água]gua/.test(n)) return '🧃';
  if (/chocolate|doce|a[çc][uú]car/.test(n)) return '🍫';
  return '🥡';
};

// ===== TOAST SYSTEM =====

function criarToastContainer() {
  if (document.getElementById('toast-container')) return;
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
}

window.mostrarToast = function(mensagem, tipo = 'sucesso', duracao = 3500) {
  criarToastContainer();
  const container = document.getElementById('toast-container');

  const icons = { sucesso: '✅', erro: '❌', info: '💡' };
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.innerHTML = `<span>${icons[tipo] || '💬'}</span> ${mensagem}`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duracao);
};

// ===== HEADER SCROLL EFFECT =====

function initScrollHeader() {
  const header = document.querySelector('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ===== HERO PARTICLES =====

function initParticles() {
  const container = document.querySelector('.hero-particles');
  if (!container) return;

  const emojis = ['🍎', '🥦', '🍞', '🥕', '🍋', '🥑', '🍇', '🌽', '🫐', '🍅', '🥚', '🥝'];
  const count = window.innerWidth < 600 ? 8 : 14;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${10 + Math.random() * 16}s`;
    p.style.animationDelay = `${-Math.random() * 20}s`;
    p.style.fontSize = `${1.2 + Math.random() * 1.4}rem`;
    container.appendChild(p);
  }
}

// ===== SAUDAÇÃO NO HEADER =====

function exibirSaudacao() {
  const userArea = document.getElementById('user-area');
  if (!userArea) return;

  const usuario = getUsuario();
  const tipo = getTipoUsuario();

  if (usuario) {
    let botoes = '';
    if (tipo === 'doador') {
      botoes = `
        <a href="cadastro-alimento.html" class="btn-nav-verde">➕ Adicionar</a>
        <a href="gestao.html" class="btn-nav-verde" style="background:var(--laranja);box-shadow:var(--sombra-laranja);">📊 Gestão</a>
      `;
    }
    userArea.innerHTML = `
      <span class="saudacao">Olá, ${usuario}! 👋</span>
      ${botoes}
      <button onclick="sair()" class="btn-sair">Sair</button>
    `;
  } else {
    userArea.innerHTML = `<a href="cadastro.html" class="btn-nav-destaque">Entrar / Cadastrar</a>`;
  }
}

window.sair = function() {
  localStorage.removeItem('foodloop_user');
  localStorage.removeItem('foodloop_user_tipo');
  mostrarToast('Até logo! 👋', 'info');
  setTimeout(() => window.location.reload(), 800);
};

// ===== CARREGAR ALIMENTOS =====

function carregarAlimentos(filtro = '') {
  const lista = document.getElementById('lista-alimentos');
  if (!lista) return;

  const alimentos = getAlimentos();

  let disponiveis = alimentos.filter(a => {
    if (!a.validade) return true;
    return diasParaValidade(a.validade) >= 0;
  });

  if (filtro) {
    const f = filtro.toLowerCase();
    disponiveis = disponiveis.filter(a =>
      `${a.nome} ${a.doador} ${a.local} ${a.categoria}`.toLowerCase().includes(f)
    );
  }

  if (disponiveis.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🍃</span>
        <h3>${filtro ? 'Nenhum resultado encontrado' : 'Nenhum alimento disponível ainda'}</h3>
        <p>${filtro ? `Tente buscar outro termo.` : 'Seja o primeiro a cadastrar um alimento para doação!'}</p>
        <br>
        <a href="cadastro-alimento.html" class="btn-adicionar-alimento" id="empty-cadastrar-btn" style="display: none;">➕ Cadastrar Alimento</a>
      </div>
    `;
    // Controle do botão no empty state
    if (getTipoUsuario() === 'doador') {
      const btn = document.getElementById('empty-cadastrar-btn');
      if (btn) btn.style.display = 'inline-flex';
    }
    return;
  }

  lista.innerHTML = disponiveis.map((a, idx) => {
    const dias = diasParaValidade(a.validade);
    let validadeClass = '';
    let validadeTexto = `Válido até ${formatarData(a.validade)}`;

    if (dias === 0) {
      validadeClass = 'validade vencendo';
      validadeTexto = '⚡ Vence hoje!';
    } else if (dias <= 3) {
      validadeClass = 'validade vencendo';
      validadeTexto = `⚠️ Vence em ${dias} dia(s)`;
    } else if (dias <= 7) {
      validadeClass = 'validade';
      validadeTexto = `✅ ${dias} dias restantes`;
    } else {
      validadeClass = 'validade';
    }

    const emoji = window.emojiAlimento(a.nome);

    return `
      <div class="card-alimento" style="animation-delay: ${idx * 0.06}s">
        <div class="card-alimento-img">${emoji}</div>
        <div class="info">
          <h3>${a.nome}</h3>
          <p>👤 <strong>${a.doador || 'Anônimo'}</strong></p>
          <p>📍 ${a.local || 'Não informado'}</p>
          ${a.quantidade ? `<p>📦 Quantidade: ${a.quantidade}</p>` : ''}
          <p class="${validadeClass}">${validadeTexto}</p>
          ${a.categoria ? `<span class="tag-categoria">${a.categoria}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ===== BUSCA COM IA =====

async function buscarComIA(query) {
  const resultados = document.getElementById('resultados-busca');
  const btn = document.getElementById('btn-busca');
  if (!resultados || !btn) return;

  btn.textContent = '⏳ Buscando...';
  btn.disabled = true;
  btn.classList.add('loading');

  resultados.innerHTML = `<div class="resultado-ia">🔍 Analisando "<em>${query}</em>"...</div>`;

  const alimentos = getAlimentos();
  const disponiveis = alimentos.filter(a => {
    if (!a.validade) return true;
    return diasParaValidade(a.validade) >= 0;
  });

  const termos = query.toLowerCase().split(/\s+/);
  const encontradosLocais = disponiveis.filter(a => {
    const texto = `${a.nome} ${a.doador || ''} ${a.local || ''} ${a.categoria || ''}`.toLowerCase();
    return termos.some(t => texto.includes(t));
  });

  try {
    const resposta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Você é um assistente amigável do FoodLoop, plataforma de doação de alimentos em Ibirapitanga-BA.
O usuário buscou: "${query}".
Alimentos disponíveis no sistema: ${JSON.stringify(disponiveis.map(a => a.nome))}.
Responda em português, de forma calorosa e breve (máximo 2-3 frases):
1. Se houver alimentos compatíveis na lista, mencione quais encontrou.
2. Dê uma dica rápida sobre esse tipo de alimento (conservação, uso, receita simples).
3. Se não houver correspondências, sugira o que o usuário pode fazer.`
        }]
      })
    });

    const data = await resposta.json();
    const textoIA = data.content?.[0]?.text || '';

    let html = '';

    if (encontradosLocais.length > 0) {
      html = `<div class="resultado-ia">
        🧠 <strong>IA diz:</strong> ${textoIA}
        <hr style="margin:1rem 0;border:none;border-top:1px solid rgba(255,255,255,0.1);">
        <strong>Encontrado no sistema (${encontradosLocais.length} item${encontradosLocais.length > 1 ? 's' : ''}):</strong><br>
        ${encontradosLocais.map(a => `• <strong>${a.nome}</strong> — ${a.local || ''} · ${formatarData(a.validade)}`).join('<br>')}
      </div>`;
    } else {
      html = `<div class="resultado-ia">🧠 <strong>IA diz:</strong> ${textoIA || 'Não encontrei esse alimento no sistema agora. Que tal cadastrar um ou verificar mais tarde?'}</div>`;
    }

    resultados.innerHTML = html;

  } catch {
    if (encontradosLocais.length > 0) {
      resultados.innerHTML = `<div class="resultado-ia">
        <strong>📦 Encontrado (${encontradosLocais.length} item${encontradosLocais.length > 1 ? 's' : ''}):</strong><br>
        ${encontradosLocais.map(a => `• <strong>${a.nome}</strong> — ${a.local || ''} · ${formatarData(a.validade)}`).join('<br>')}
      </div>`;
    } else {
      resultados.innerHTML = `<div class="resultado-ia">Nenhum alimento encontrado para "<strong>${query}</strong>". Tente outro termo ou <a href="cadastro-alimento.html" style="color:var(--laranja-vivo)">cadastre um alimento</a>.</div>`;
    }
  } finally {
    btn.textContent = 'Buscar com IA 🧠';
    btn.disabled = false;
    btn.classList.remove('loading');
  }
}

function inicializarBusca() {
  const btn = document.getElementById('btn-busca');
  const input = document.getElementById('busca');
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const query = input.value.trim();
    if (query) buscarComIA(query);
  });

  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      const query = input.value.trim();
      if (query) buscarComIA(query);
    }
  });
}

// ===== COUNTER ANIMATION =====

function animateCounter(el, target, duration = 1200) {
  if (!el) return;
  const start = 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ===== SCROLL REVEAL =====

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.passo-card, .tipo-card, .resumo-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ===== CONTROLE DO BOTÃO CADASTRAR ALIMENTO (APENAS ESTABELECIMENTOS) =====
function controlarBotaoCadastrar() {
  const btn = document.getElementById('btn-cadastrar-alimento');
  if (!btn) return;
  if (getTipoUsuario() === 'doador') {
    btn.style.display = 'inline-flex';
  } else {
    btn.style.display = 'none';
  }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function () {
  criarToastContainer();
  initScrollHeader();
  initParticles();
  exibirSaudacao();
  controlarBotaoCadastrar();
  carregarAlimentos();
  inicializarBusca();
  initScrollReveal();

  // Atualiza contador de alimentos com animação
  const alimentos = getAlimentos();
  const disponiveis = alimentos.filter(a => {
    if (!a.validade) return true;
    return diasParaValidade(a.validade) >= 0;
  });
  const stat = document.getElementById('stat-alimentos');
  if (stat) animateCounter(stat, disponiveis.length);
});
