const currentYear = document.getElementById('currentYear');
if (currentYear) currentYear.textContent = new Date().getFullYear();

const STORAGE_KEY = 'petcareUsers';
const SESSION_KEY = 'petcareSession';
const CART_KEY = 'petcareCart';

const bookingForm = document.getElementById('bookingForm');
const serviceSelect = document.getElementById('service');
const dateInput = document.getElementById('date');
const timeSelect = document.getElementById('time');
const summaryService = document.getElementById('summaryService');
const summaryDate = document.getElementById('summaryDate');
const summaryTime = document.getElementById('summaryTime');
const summaryPrice = document.getElementById('summaryPrice');
const toast = document.getElementById('toast');
const appointmentsList = document.getElementById('appointmentsList');
const serviceCards = document.querySelectorAll('.service-card');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const clientPanel = document.getElementById('clientPanel');
const closePanelBtn = document.getElementById('closePanelBtn');
const searchInput = document.getElementById('searchInput');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const whatsappFloat = document.querySelector('.whatsapp-float');
const chatWidget = document.getElementById('chatWidget');
const closeChatBtn = document.getElementById('closeChatBtn');
const ctaMainBtn = document.getElementById('ctaMainBtn');
const quickDashboardBtn = document.getElementById('quickDashboardBtn');
const quickAppointmentsBtn = document.getElementById('quickAppointmentsBtn');
const quickGroomingBtn = document.getElementById('quickGroomingBtn');
const quickStockBtn = document.getElementById('quickStockBtn');
const loginForm = document.getElementById('loginForm');
const createAccountForm = document.getElementById('createAccountForm');
const dashboardWelcome = document.getElementById('dashboardWelcome');
const cartToggle = document.getElementById('cartToggle');
const cartOverlay = document.getElementById('cartOverlay');
const cartDrawer = document.getElementById('cartDrawer');
const closeCartBtn = document.getElementById('closeCart');
const cartItemsList = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');

const priceMap = {
  'Banho e Tosa': 'R$ 69,00',
  'Consulta Veterinária': 'R$ 89,00',
  'Vacinação': 'R$ 120,00',
  'Hospedagem': 'R$ 49,00/dia',
  'Creche Pet': 'R$ 59,00/dia',
  'Emergência 24h': 'Sob consulta'
};

const catalogProducts = [
  {
    name: 'Ração Premium',
    category: 'Rações',
    badge: 'Ração',
    price: 129,
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80',
    description: 'Formulação completa para saúde, energia e sabor irresistível.'
  },
  {
    name: 'Camada Comfort',
    category: 'Camas',
    badge: 'Cama',
    price: 149,
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80',
    description: 'Macio, respirável e pensado para descanso prolongado do pet.'
  },
  {
    name: 'Casinha Deluxe',
    category: 'Casinhas',
    badge: 'Casinha',
    price: 249,
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80',
    description: 'Estrutura elegante e resistente para maior conforto e segurança.'
  },
  {
    name: 'Pote de Ração Pro',
    category: 'Potes de Ração',
    badge: 'Acessório',
    price: 59,
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=900&q=80',
    description: 'Capacidade ideal, design prático e manutenção fácil no dia a dia.'
  },
  {
    name: 'Coleira Premium',
    category: 'Coleiras',
    badge: 'Acessório',
    price: 69,
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=900&q=80',
    description: 'Conforto e estilo com material resistente e fácil de limpar.'
  },
  {
    name: 'Suplemento Vital',
    category: 'Remédios',
    badge: 'Saúde',
    price: 87,
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
    description: 'Auxilia na rotina de bem-estar com suporte para saúde e vitalidade.'
  },
  {
    name: 'Brinquedo Interativo',
    category: 'Brinquedos',
    badge: 'Brinquedo',
    price: 49,
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80',
    description: 'Durável, divertido e feito para estimular o corpo e a mente.'
  },
  {
    name: 'Kit de Higiene',
    category: 'Higiene',
    badge: 'Kit',
    price: 99,
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=900&q=80',
    description: 'Produtos essenciais para limpeza, cuidado e manutenção diária.'
  }
];

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function getCartItems() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCartItems(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function buildProductFromCard(card) {
  if (!card) {
    return null;
  }

  const name = card.dataset.name || card.querySelector('h3')?.textContent.trim() || 'Produto';
  const category = card.dataset.category || 'Geral';
  const badge = card.dataset.badge || card.querySelector('.product-badge')?.textContent.trim() || 'Produto';
  const description = card.dataset.description || card.querySelector('p')?.textContent.trim() || '';
  const image = card.dataset.image || card.querySelector('img')?.src || '';
  const priceValue = card.dataset.price || card.querySelector('.price')?.textContent.replace(/[^\d,]/g, '').replace(',', '.');
  const price = Number(priceValue) || 0;

  return {
    name,
    category,
    badge,
    description,
    image,
    price
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function openCart() {
  if (cartDrawer) {
    cartDrawer.classList.add('open');
  }

  if (cartOverlay) {
    cartOverlay.classList.add('visible');
  }
}

function closeCart() {
  if (cartDrawer) {
    cartDrawer.classList.remove('open');
  }

  if (cartOverlay) {
    cartOverlay.classList.remove('visible');
  }
}

function renderCart() {
  if (!cartItemsList || !cartTotal || !cartCount || !cartEmpty) {
    return;
  }

  const items = getCartItems();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  cartCount.textContent = String(totalItems);
  cartTotal.textContent = formatCurrency(totalValue);

  if (!items.length) {
    cartEmpty.style.display = 'block';
    cartItemsList.innerHTML = '';
    return;
  }

  cartEmpty.style.display = 'none';
  cartItemsList.innerHTML = items.map((item, index) => `
    <li class="cart-item">
      <img src="${item.image}" alt="${item.name}" />
      <div>
        <h4>${item.name}</h4>
        <p>${item.category}</p>
        <div class="cart-item-controls">
          <button class="qty-btn" type="button" data-action="decrease" data-index="${index}">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" type="button" data-action="increase" data-index="${index}">+</button>
        </div>
        <strong>${formatCurrency(Number(item.price) * item.quantity)}</strong>
      </div>
      <button class="btn btn-soft" type="button" data-action="remove" data-index="${index}">Remover</button>
    </li>
  `).join('');
}

function addToCart(product) {
  const normalizedProduct = buildProductFromCard(product && product.closest ? product.closest('.product-card') : null) || product;

  if (!normalizedProduct || !normalizedProduct.name) {
    return;
  }

  const cartItems = getCartItems();
  const existingItem = cartItems.find(item => item.name === normalizedProduct.name);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.push({
      ...normalizedProduct,
      quantity: 1
    });
  }

  saveCartItems(cartItems);
  renderCart();
  openCart();
  showToast(`${normalizedProduct.name} adicionado ao carrinho.`);
}

function setupCartInteractions() {
  if (cartToggle) {
    cartToggle.addEventListener('click', openCart);
  }

  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', closeCart);
  }

  if (cartOverlay) {
    cartOverlay.addEventListener('click', closeCart);
  }

  if (cartItemsList) {
    cartItemsList.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) {
        return;
      }

      const action = button.dataset.action;
      const index = Number(button.dataset.index);
      const items = getCartItems();

      if (action === 'increase') {
        items[index].quantity += 1;
      }

      if (action === 'decrease') {
        if (items[index].quantity > 1) {
          items[index].quantity -= 1;
        } else {
          items.splice(index, 1);
        }
      }

      if (action === 'remove') {
        items.splice(index, 1);
      }

      saveCartItems(items);
      renderCart();
    });
  }
}

function showToast(message) {
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
    return;
  }

  window.alert(message);
}

function renderCatalogProducts(filter = 'todos') {
  const productGrid = document.getElementById('productGrid');

  if (!productGrid) {
    return;
  }

  const filteredProducts = filter === 'todos'
    ? catalogProducts
    : catalogProducts.filter(product => product.category === filter);

  productGrid.innerHTML = filteredProducts.map((product, index) => `
    <article class="product-card" style="animation-delay:${index * 60}ms;">
      <div class="product-image">
        <span class="product-badge">${product.badge}</span>
        <img src="${product.image}" alt="${product.name}" />
      </div>
      <div class="product-body">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-meta">
          <span class="price">R$ ${product.price}</span>
          <button class="btn btn-primary add-to-cart" type="button">Comprar</button>
        </div>
      </div>
    </article>
  `).join('');

  productGrid.querySelectorAll('.add-to-cart').forEach(button => {
    const product = filteredProducts[Array.from(productGrid.querySelectorAll('.add-to-cart')).indexOf(button)];

    button.addEventListener('click', () => {
      addToCart(product);
    });
  });
}

function setupCatalogFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');

  if (!filterButtons.length) {
    return;
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedFilter = button.dataset.filter;

      filterButtons.forEach(item => item.classList.toggle('active', item === button));
      renderCatalogProducts(selectedFilter);
    });
  });

  renderCatalogProducts();
}

function updateSummary() {
  if (!serviceSelect || !dateInput || !timeSelect || !summaryService || !summaryDate || !summaryTime || !summaryPrice) {
    return;
  }

  const service = serviceSelect.value || '-';
  const date = dateInput.value ? new Date(dateInput.value + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  summaryService.textContent = service;
  summaryDate.textContent = date;
  summaryTime.textContent = timeSelect.value || '-';
  summaryPrice.textContent = service && priceMap[service] ? priceMap[service] : 'R$ 0,00';
}

function scrollToSection(sectionId, message) {
  const targetSection = document.getElementById(sectionId);

  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (message) {
    showToast(message);
  }
}

function registerDashboardGreeting() {
  if (!dashboardWelcome) {
    return;
  }

  const currentUser = getCurrentUser();

  if (currentUser && currentUser.name) {
    dashboardWelcome.textContent = `Acompanhe serviços, entregas, benefícios e desempenho dos seus pets em tempo real, ${currentUser.name}.`;
  }
}

function handleLogin(event) {
  event.preventDefault();

  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');

  if (!emailInput || !passwordInput) {
    return;
  }

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showToast('Preencha e-mail e senha para continuar.');
    return;
  }

  const users = getUsers();
  const user = users.find(item => item.email.toLowerCase() === email && item.password === password);

  if (!user) {
    showToast('E-mail ou senha inválidos.');
    return;
  }

  saveCurrentUser({
    id: user.id,
    name: user.name,
    email: user.email
  });

  showToast('Login realizado com sucesso!');
  setTimeout(() => {
    window.location.href = 'dashboard-cliente.html';
  }, 300);
}

function handleCreateAccount(event) {
  event.preventDefault();

  const nomeInput = document.getElementById('nome');
  const sobrenomeInput = document.getElementById('sobrenome');
  const registerEmailInput = document.getElementById('registerEmail');
  const senhaInput = document.getElementById('senha');
  const confirmarSenhaInput = document.getElementById('confirmarSenha');
  const termsCheckbox = document.getElementById('termsCheckbox');

  if (!nomeInput || !sobrenomeInput || !registerEmailInput || !senhaInput || !confirmarSenhaInput || !termsCheckbox) {
    return;
  }

  const name = nomeInput.value.trim();
  const surname = sobrenomeInput.value.trim();
  const email = registerEmailInput.value.trim().toLowerCase();
  const password = senhaInput.value.trim();
  const confirmPassword = confirmarSenhaInput.value.trim();

  if (!name || !surname || !email || !password || !confirmPassword) {
    showToast('Preencha todos os campos para criar sua conta.');
    return;
  }

  if (password.length < 6) {
    showToast('A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  if (password !== confirmPassword) {
    showToast('As senhas não conferem.');
    return;
  }

  if (!termsCheckbox.checked) {
    showToast('Você precisa aceitar os termos para continuar.');
    return;
  }

  const users = getUsers();
  const existingUser = users.some(item => item.email.toLowerCase() === email);

  if (existingUser) {
    showToast('Este e-mail já está cadastrado.');
    return;
  }

  const user = {
    id: Date.now(),
    name,
    surname,
    email,
    password
  };

  users.push(user);
  saveUsers(users);
  saveCurrentUser({
    id: user.id,
    name: user.name,
    email: user.email
  });

  showToast('Conta criada com sucesso!');
  setTimeout(() => {
    window.location.href = 'dashboard-cliente.html';
  }, 300);
}

const revealTargets = document.querySelectorAll('section, .service-card, .product-card, .testimonial-card, .article-card, .stat, .overview-item, .booking-card, .booking-summary, .contact-card, .dashboard-card');

if (revealTargets.length) {
  revealTargets.forEach((element, index) => {
    element.classList.add('reveal');
    element.style.transitionDelay = `${index * 45}ms`;
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealTargets.forEach(element => revealObserver.observe(element));
  } else {
    revealTargets.forEach(element => element.classList.add('is-visible'));
  }
}

if (serviceSelect) {
  serviceSelect.addEventListener('change', updateSummary);
}

if (dateInput) {
  dateInput.addEventListener('input', updateSummary);
}

if (timeSelect) {
  timeSelect.addEventListener('change', updateSummary);
}

if (bookingForm) {
  bookingForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(bookingForm);
    const service = formData.get('service');
    const petName = formData.get('petName');
    const date = formData.get('date');
    const time = formData.get('time');

    if (!service || !petName || !date || !time) {
      showToast('Preencha todos os campos obrigatórios.');
      return;
    }

    const appointmentDate = new Date(date + 'T00:00:00');
    const shortDay = String(appointmentDate.getDate()).padStart(2, '0');
    const shortMonth = appointmentDate.toLocaleDateString('pt-BR', { month: 'short' });

    const newItem = document.createElement('li');
    newItem.innerHTML = `
      <div class="appointment-date">${shortDay} <small>${shortMonth.toUpperCase()}</small></div>
      <div>
        <h4 style="margin:0 0 4px;">${service} - ${petName}</h4>
        <p style="margin:0; color: rgba(51,51,51,.7);">${time} — Agendamento online</p>
      </div>
      <span class="status-badge confirmed">Confirmado</span>
    `;

    if (appointmentsList) {
      appointmentsList.prepend(newItem);
    }

    bookingForm.reset();
    updateSummary();
    showToast('Agendamento confirmado com sucesso!');

    if (clientPanel) {
      clientPanel.classList.add('open');
    }
  });
}

serviceCards.forEach(card => {
  card.addEventListener('click', () => {
    const service = card.dataset.service;
    if (!service) return;

    if (serviceSelect) {
      serviceSelect.value = service;
      updateSummary();
    }

    const agendamentosSection = document.getElementById('agendamentos');
    if (agendamentosSection) {
      agendamentosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showToast(`Serviço ${service} selecionado.`);
  });
});

addToCartButtons.forEach(button => {
  button.addEventListener('click', () => {
    const card = button.closest('.product-card');
    const product = buildProductFromCard(card);

    if (product) {
      addToCart(product);
      return;
    }

    showToast('Produto adicionado ao carrinho.');
  });
});

if (openDashboardBtn) {
  openDashboardBtn.addEventListener('click', (event) => {
    if (openDashboardBtn.tagName.toLowerCase() === 'a') {
      return;
    }

    event.preventDefault();
    if (clientPanel) {
      clientPanel.classList.add('open');
    }
    showToast('Painel do cliente aberto.');
  });
}

if (closePanelBtn && clientPanel) {
  closePanelBtn.addEventListener('click', () => clientPanel.classList.remove('open'));
}

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    const value = event.target.value.trim().toLowerCase();
    document.querySelectorAll('section').forEach(section => {
      const text = section.textContent.toLowerCase();
      section.style.opacity = value && !text.includes(value) ? '0.35' : '1';
    });
  });
}

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    nav.style.position = 'absolute';
    nav.style.top = '100%';
    nav.style.left = '0';
    nav.style.right = '0';
    nav.style.padding = '16px 20px';
    nav.style.background = '#fff';
    nav.style.borderBottom = '1px solid rgba(53,20,155,0.08)';
    nav.style.flexDirection = 'column';
    nav.style.alignItems = 'flex-start';
    nav.style.boxShadow = '0 16px 24px rgba(0,0,0,0.06)';
  });
}

if (whatsappFloat && chatWidget) {
  whatsappFloat.addEventListener('click', () => chatWidget.classList.toggle('open'));
}

if (closeChatBtn && chatWidget) {
  closeChatBtn.addEventListener('click', () => chatWidget.classList.remove('open'));
}

if (ctaMainBtn) {
  ctaMainBtn.addEventListener('click', () => scrollToSection('agendamentos', 'Seção de agendamentos aberta.'));
}

if (quickDashboardBtn) {
  quickDashboardBtn.addEventListener('click', (event) => {
    if (quickDashboardBtn.tagName.toLowerCase() === 'a') {
      return;
    }

    event.preventDefault();
    if (clientPanel) {
      clientPanel.classList.add('open');
    }
    showToast('Dashboard pronto para revisão.');
  });
}

if (quickAppointmentsBtn) {
  quickAppointmentsBtn.addEventListener('click', () => scrollToSection('agendamentos', 'Agendamentos selecionados.'));
}

if (quickGroomingBtn) {
  quickGroomingBtn.addEventListener('click', (event) => {
    if (quickGroomingBtn.tagName.toLowerCase() === 'a') {
      return;
    }

    event.preventDefault();
    scrollToSection('banho-e-tosa', 'Banho e Tosa em destaque.');
  });
}

if (quickStockBtn) {
  quickStockBtn.addEventListener('click', () => scrollToSection('loja', 'Estoque e produtos disponíveis.'));
}

if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}

if (createAccountForm) {
  createAccountForm.addEventListener('submit', handleCreateAccount);
}

setupCatalogFilters();
registerDashboardGreeting();
updateSummary();
setupCartInteractions();
renderCart();
