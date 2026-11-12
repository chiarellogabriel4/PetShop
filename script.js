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
const bookingSummary = document.querySelector('.booking-summary');
const toast = document.getElementById('toast');
const serviceCards = document.querySelectorAll('.service-card');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const interactiveProductCards = document.querySelectorAll('#loja .product-card');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const whatsappFloat = document.querySelector('.whatsapp-float');
const chatWidget = document.getElementById('chatWidget');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatGroomingBtn = document.getElementById('chatGroomingBtn');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const loginForm = document.getElementById('loginForm');
const createAccountForm = document.getElementById('createAccountForm');
const socialButtons = document.querySelectorAll('.social-btn');
const dashboardWelcome = document.getElementById('dashboardWelcome');
const cartToggle = document.getElementById('cartToggle');
const cartOverlay = document.getElementById('cartOverlay');
const cartDrawer = document.getElementById('cartDrawer');
const closeCartBtn = document.getElementById('closeCart');
const cartItemsList = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
let currentSearchMatches = [];

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
    name: 'Ração',
    category: 'Rações',
    badge: 'Ração',
    price: 129,
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80',
    description: 'Alimento completo para o dia a dia do seu pet.'
  },
  {
    name: 'Cama Comfort',
    category: 'Camas',
    badge: 'Cama',
    price: 149,
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80',
    description: 'Confortável para o descanso do seu pet.'
  },
  {
    name: 'Casinha Deluxe',
    category: 'Casinhas',
    badge: 'Casinha',
    price: 249,
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80',
    description: 'Um espaço protegido para seu pet descansar.'
  },
  {
    name: 'Pote de Ração Pro',
    category: 'Potes de Ração',
    badge: 'Acessório',
    price: 59,
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=900&q=80',
    description: 'Fácil de usar e limpar.'
  },
  {
    name: 'Coleira Premium',
    category: 'Coleiras',
    badge: 'Acessório',
    price: 69,
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=900&q=80',
    description: 'Resistente e confortável para passeios.'
  },
  {
    name: 'Suplemento Vital',
    category: 'Suplementos',
    badge: 'Saúde',
    price: 87,
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
    description: 'Suplemento alimentar. Consulte um veterinário antes de usar.'
  },
  {
    name: 'Brinquedo Interativo',
    category: 'Brinquedos',
    badge: 'Brinquedo',
    price: 49,
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80',
    description: 'Para brincar e gastar energia.'
  },
  {
    name: 'Kit de Higiene',
    category: 'Higiene',
    badge: 'Kit',
    price: 99,
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=900&q=80',
    description: 'Itens básicos para o cuidado diário.'
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
  const normalizedUser = {
    ...user,
    name: user.name || user.email || 'Usuário',
    avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email || 'Usuário')}&background=35149b&color=fff&size=128`
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(normalizedUser));
  renderUserProfileChip();
}

function injectUserProfileStyles() {
  if (document.getElementById('petcare-user-profile-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'petcare-user-profile-styles';
  style.textContent = `
    .user-profile-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      padding: 0;
      border-radius: 50%;
      background: rgba(53, 20, 155, 0.08);
      border: 1px solid rgba(53, 20, 155, 0.12);
      color: var(--purple);
      font-weight: 700;
      transition: transform .2s ease, box-shadow .2s ease;
      box-shadow: 0 8px 18px rgba(53, 20, 155, 0.05);
      overflow: hidden;
      flex-shrink: 0;
    }
    .user-profile-chip--guest {
      background: #f3f3f3;
      border-color: rgba(51, 51, 51, 0.08);
      color: var(--gray-dark);
      box-shadow: none;
    }
    .user-profile-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(53, 20, 155, 0.18);
      background: #fff;
      display: block;
      min-width: 52px;
      min-height: 52px;
    }
    .user-profile-avatar--guest {
      padding: 8px;
      background: rgba(53, 20, 155, 0.06);
      border-color: rgba(51, 51, 51, 0.08);
    }
  `;

  document.head.appendChild(style);
}

function renderUserProfileChip() {
  injectUserProfileStyles();

  const headerTools = document.querySelector('.header-tools');
  if (!headerTools) {
    return;
  }

  let chip = document.getElementById('userProfileChip');

  if (!chip) {
    chip = document.createElement('div');
    chip.id = 'userProfileChip';
    headerTools.appendChild(chip);
  }

  const currentUser = getCurrentUser();

  if (!currentUser || !currentUser.name) {
    chip.className = 'user-profile-chip user-profile-chip--guest';
    chip.innerHTML = `
      <svg class="user-profile-avatar user-profile-avatar--guest" viewBox="0 0 64 64" aria-label="Usuário" role="img" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="32" fill="currentColor" opacity="0.08"/>
        <circle cx="32" cy="24" r="10" fill="currentColor" opacity="0.75"/>
        <path d="M18 49c4-7 12-10 14-10s10 3 14 10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
      </svg>
    `;
    return;
  }

  chip.className = 'user-profile-chip';

  const safeName = currentUser.name.replace(/[<>]/g, '');

  if (currentUser.avatar) {
    chip.innerHTML = `
      <img class="user-profile-avatar" src="${currentUser.avatar}" alt="${safeName}" />
    `;
    return;
  }

  chip.innerHTML = `
    <svg class="user-profile-avatar user-profile-avatar--guest" viewBox="0 0 64 64" aria-label="Usuário" role="img" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="currentColor" opacity="0.08"/>
      <circle cx="32" cy="24" r="10" fill="currentColor" opacity="0.75"/>
      <path d="M18 49c4-7 12-10 14-10s10 3 14 10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
    </svg>
  `;
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
      <img src="${item.image}" alt="${item.name}" loading="lazy" decoding="async" />
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

function handleSocialAuth(event) {
  const button = event.currentTarget;
  const provider = button.dataset.provider || button.textContent.trim();

  if (!provider) {
    return;
  }

  const users = getUsers();
  const existingSocialUser = users.find(user => user.provider === provider);

  if (existingSocialUser) {
    saveCurrentUser({
      id: existingSocialUser.id,
      name: existingSocialUser.name,
      email: existingSocialUser.email,
      provider: existingSocialUser.provider,
      avatar: existingSocialUser.avatar || ''
    });

    showToast(`Bem-vindo de volta com ${provider}!`);
  } else {
    const newUser = {
      id: Date.now(),
      name: `Usuário ${provider}`,
      surname: '',
      email: `${provider.toLowerCase()}-${Date.now()}@petcare.com.br`,
      password: `social-${provider.toLowerCase()}-${Date.now()}`,
      provider,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(`Usuário ${provider}`)}&background=35149b&color=fff&size=128`
    };

    users.push(newUser);
    saveUsers(users);
    saveCurrentUser({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      provider: newUser.provider,
      avatar: newUser.avatar || ''
    });

    showToast(`Conta criada com ${provider} com sucesso!`);
  }

  setTimeout(() => {
    window.location.href = 'dashboard-cliente.html';
  }, 300);
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
        <img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async" />
      </div>
      <div class="product-body">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-meta">
          <span class="price">R$ ${product.price}</span>
          <button class="btn btn-primary add-to-cart" type="button">Adicionar ao carrinho</button>
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
    email: user.email,
    avatar: user.avatar || ''
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
    password,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=35149b&color=fff&size=128`
  };

  users.push(user);
  saveUsers(users);
  saveCurrentUser({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || ''
  });

  showToast('Conta criada com sucesso!');
  setTimeout(() => {
    window.location.href = 'dashboard-cliente.html';
  }, 300);
}

const revealTargets = document.querySelectorAll('section, .service-card, .product-card, .testimonial-card, .article-card, .stat, .overview-item, .booking-card, .booking-summary, .contact-card, .dashboard-card');
const revealItemSelector = '.service-card, .product-card, .testimonial-card, .article-card, .stat, .overview-item, .booking-card, .booking-summary, .contact-card, .dashboard-card';

if (revealTargets.length) {
  revealTargets.forEach(element => {
    element.classList.add('reveal');

    if (element.matches(revealItemSelector) && element.parentElement) {
      const siblingIndex = Array.from(element.parentElement.children)
        .filter(sibling => sibling.matches(revealItemSelector))
        .indexOf(element);

      element.style.setProperty('--reveal-delay', `${Math.min(siblingIndex, 3) * 70}ms`);
    }
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
  const requestedService = new URLSearchParams(window.location.search).get('servico');
  if (requestedService && Array.from(serviceSelect.options).some(option => option.value === requestedService)) {
    serviceSelect.value = requestedService;
  }

  serviceSelect.addEventListener('change', updateSummary);
}

if (dateInput) {
  dateInput.addEventListener('input', updateSummary);
}

if (timeSelect) {
  timeSelect.addEventListener('change', updateSummary);
}

if (bookingSummary) {
  bookingSummary.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;

    const bounds = bookingSummary.getBoundingClientRect();
    bookingSummary.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
    bookingSummary.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
    bookingSummary.classList.add('is-pointer-active');
  });

  bookingSummary.addEventListener('pointerleave', () => {
    bookingSummary.classList.remove('is-pointer-active');
  });
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

    bookingForm.reset();
    updateSummary();
    showToast('Agendamento confirmado com sucesso!');
  });
}

serviceCards.forEach(card => {
  card.addEventListener('click', () => {
    const service = card.dataset.service;
    if (!service) return;

    if (!serviceSelect) {
      window.location.href = `agendamento.html?servico=${encodeURIComponent(service)}`;
      return;
    }

    serviceSelect.value = service;
    updateSummary();

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

if (window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
  interactiveProductCards.forEach(card => {
    card.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;

      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;

      card.style.setProperty('--pointer-x', `${x * 100}%`);
      card.style.setProperty('--pointer-y', `${y * 100}%`);
      card.style.setProperty('--tilt-x', `${((0.5 - y) * 5).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${((x - 0.5) * 5).toFixed(2)}deg`);
      card.classList.add('is-pointer-active');
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.classList.remove('is-pointer-active');
    });
  });
}

function normalizeSearchText(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getSearchTargets() {
  const serviceTargets = Array.from(serviceCards, card => {
    const service = card.dataset.service || card.querySelector('h3')?.textContent.trim();
    if (!service) return null;

    return {
      title: service,
      detail: card.querySelector('.pill')?.textContent.trim() || card.querySelector('p')?.textContent.trim() || 'Serviço',
      searchText: card.textContent,
      url: `agendamento.html?servico=${encodeURIComponent(service)}`
    };
  }).filter(Boolean);

  const productTargets = Array.from(document.querySelectorAll('.product-card'), card => {
    const title = card.querySelector('h3')?.textContent.trim();
    if (!title) return null;

    return {
      title,
      detail: card.querySelector('p')?.textContent.trim() || 'Produto para seu pet',
      searchText: card.textContent,
      element: card
    };
  }).filter(Boolean);

  const sectionTargets = Array.from(document.querySelectorAll('main section:not(.hero)'), section => {
    const title = section.querySelector('h1, h2')?.textContent.trim();
    if (!title) return null;

    const eyebrow = section.querySelector('.eyebrow')?.textContent.trim() || '';
    const description = section.querySelector('.section-head > p')?.textContent.trim() || '';
    const containsCards = section.querySelector('.service-card, .product-card');

    return {
      title,
      detail: eyebrow || 'Seção do site',
      searchText: containsCards
        ? `${section.id} ${eyebrow} ${title} ${description}`
        : `${section.id} ${section.textContent}`,
      element: section
    };
  }).filter(Boolean);

  return [...serviceTargets, ...productTargets, ...sectionTargets];
}

function closeSearchResults() {
  if (!searchInput || !searchResults) return;
  searchResults.hidden = true;
  searchInput.setAttribute('aria-expanded', 'false');
}

function renderSearchResults() {
  if (!searchInput || !searchResults) return;

  const query = normalizeSearchText(searchInput.value);
  searchResults.replaceChildren();
  currentSearchMatches = [];

  if (query.length < 2) {
    closeSearchResults();
    return;
  }

  const terms = query.split(/\s+/);
  currentSearchMatches = getSearchTargets()
    .filter(target => {
      const searchableText = normalizeSearchText(`${target.title} ${target.detail} ${target.searchText}`);
      return terms.every(term => searchableText.includes(term));
    })
    .slice(0, 6);

  if (!currentSearchMatches.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'search-results-empty';
    emptyMessage.textContent = 'Nenhum resultado encontrado.';
    searchResults.append(emptyMessage);
  } else {
    currentSearchMatches.forEach((result, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'search-result';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      option.dataset.searchIndex = String(index);

      const title = document.createElement('span');
      title.className = 'search-result-title';
      title.textContent = result.title;

      const detail = document.createElement('span');
      detail.className = 'search-result-detail';
      detail.textContent = result.detail;

      option.append(title, detail);
      searchResults.append(option);
    });
  }

  searchResults.hidden = false;
  searchInput.setAttribute('aria-expanded', 'true');
}

function openSearchResult(index) {
  const result = currentSearchMatches[index];
  if (!result) return;

  closeSearchResults();
  if (result.url) {
    window.location.href = result.url;
    return;
  }

  const section = result.element.closest('section');
  const hashTarget = result.element.id ? result.element : section;
  if (hashTarget?.id) {
    window.history.replaceState(null, '', `#${hashTarget.id}`);
  }
  result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

if (searchInput && searchResults) {
  searchInput.addEventListener('input', renderSearchResults);
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      const firstResult = searchResults.querySelector('.search-result');
      if (firstResult) {
        event.preventDefault();
        firstResult.focus();
      }
    } else if (event.key === 'Enter') {
      if (!searchResults.hidden && currentSearchMatches.length) {
        event.preventDefault();
        openSearchResult(0);
      }
    } else if (event.key === 'Escape') {
      closeSearchResults();
    }
  });

  searchResults.addEventListener('click', event => {
    const option = event.target.closest('.search-result');
    if (option) openSearchResult(Number(option.dataset.searchIndex));
  });

  searchResults.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      searchInput.focus();
      closeSearchResults();
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    const options = Array.from(searchResults.querySelectorAll('.search-result'));
    const currentIndex = options.indexOf(document.activeElement);
    if (!options.length || currentIndex < 0) return;

    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    options[(currentIndex + direction + options.length) % options.length].focus();
  });

  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.home-header .header-tools')) closeSearchResults();
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

function appendChatMessage(message, sender, href) {
  if (!chatMessages) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-message ${sender}`;
  bubble.textContent = message;

  if (href) {
    const link = document.createElement('a');
    link.className = 'chat-reply-link';
    link.href = href;
    if (href.startsWith('agendamento.html')) {
      link.textContent = 'Ir para agendamento';
    } else if (href.startsWith('tel:')) {
      link.textContent = 'Ligar para a helpPatas';
    } else if (href.startsWith('https://wa.me/')) {
      link.textContent = 'Falar no WhatsApp';
    } else {
      link.textContent = 'Ver detalhes';
    }
    bubble.append(document.createElement('br'), link);
  }

  chatMessages.append(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getAssistantReply(message) {
  const query = normalizeSearchText(message);
  const urgentWords = ['urgencia', 'emergencia', 'sangue', 'veneno', 'convuls', 'passando mal', 'dor forte', 'engoliu'];
  if (urgentWords.some(word => query.includes(word))) {
    return {
      text: 'Sinto muito. Não consigo avaliar sintomas; procure atendimento veterinário imediatamente. A página informa atendimento de emergência 24h. Ligue para (11) 4000-2024.',
      href: 'tel:+551140002024'
    };
  }

  const serviceAliases = [
    { name: 'Banho e Tosa', terms: ['banho', 'tosa'] },
    { name: 'Consulta Veterinária', terms: ['consulta', 'veterin'] },
    { name: 'Vacinação', terms: ['vacina', 'vacinacao'] },
    { name: 'Hospedagem', terms: ['hosped', 'hotel'] },
    { name: 'Creche Pet', terms: ['creche'] },
    { name: 'Emergência 24h', terms: ['emergencia', 'urgencia'] }
  ];
  const matchedService = serviceAliases.find(service => service.terms.some(term => query.includes(term)));
  const isBookingQuery = /agend|marcar|horario|disponibilidade/.test(query);

  if (/funcionamento|abre|aberto|fecha/.test(query)) {
    return {
      text: 'Não tenho os horários de funcionamento cadastrados. Ligue para (11) 4000-2024 para confirmar.'
    };
  }

  if (isBookingQuery) {
    const bookingUrl = matchedService
      ? `agendamento.html?servico=${encodeURIComponent(matchedService.name)}`
      : 'agendamento.html';
    return {
      text: matchedService
        ? `Você pode agendar ${matchedService.name} pela página de agendamento.`
        : 'Você pode escolher o serviço e um horário disponível na página de agendamento.',
      href: bookingUrl
    };
  }

  const productAliases = [
    { term: 'racao', name: 'Ração' },
    { term: 'brinquedo', name: 'Brinquedo Interativo' },
    { term: 'suplemento', name: 'Suplemento Vital' },
    { term: 'coleira', name: 'Coleira Premium' }
  ];
  const matchedProduct = productAliases.find(product => query.includes(product.term));
  if (matchedProduct) {
    const productCard = Array.from(document.querySelectorAll('#loja .product-card'))
      .find(card => normalizeSearchText(card.dataset.name || '').includes(normalizeSearchText(matchedProduct.name)));
    if (productCard) {
      const price = productCard.querySelector('.price')?.textContent.trim();
      const detail = productCard.dataset.description;
      return {
        text: `${matchedProduct.name}${price ? ` custa ${price}` : ''}.${detail ? ` ${detail}` : ''}`,
        href: '#loja'
      };
    }
  }

  if (matchedService) {
    const serviceCard = Array.from(serviceCards)
      .find(card => normalizeSearchText(card.dataset.service || '').includes(normalizeSearchText(matchedService.name)));
    const detail = serviceCard?.querySelector('p')?.textContent.trim();
    const price = serviceCard?.querySelector('.pill')?.textContent.trim();
    return {
      text: `${matchedService.name}: ${detail || 'Consulte os detalhes do serviço.'}${price ? ` ${price}.` : ''}`,
      href: `agendamento.html?servico=${encodeURIComponent(matchedService.name)}`
    };
  }

  if (/local|endereco|onde fica/.test(query)) {
    return { text: 'Estamos na Rua das Flores, 128 - Vila Pet, São Paulo/SP. Ligue para (11) 4000-2024 se precisar de ajuda.' };
  }

  if (/telefone|contato|ligar|whatsapp/.test(query)) {
    const prefersWhatsApp = /whatsapp/.test(query) && !/telefone|ligar/.test(query);
    return {
      text: 'Você pode ligar para (11) 4000-2024 ou falar pelo WhatsApp (11) 99123-4567.',
      href: prefersWhatsApp ? 'https://wa.me/5511991234567' : 'tel:+551140002024'
    };
  }

  if (/^(oi|ola|bom dia|boa tarde|boa noite)\b/.test(query)) {
    return { text: 'Olá! Posso ajudar com serviços, preços, produtos ou agendamento. O que você gostaria de saber?' };
  }

  if (/loja|produto|comprar/.test(query)) {
    return { text: 'Na loja temos ração, brinquedos, suplementos e coleiras. Qual produto você quer conhecer?', href: '#loja' };
  }

  return {
    text: 'Ainda não sei responder isso. Pergunte sobre banho e tosa, consultas, vacinação, hospedagem, produtos, preços ou agendamentos.'
  };
}

if (whatsappFloat && chatWidget) {
  whatsappFloat.addEventListener('click', () => {
    const isOpen = chatWidget.classList.toggle('open');
    whatsappFloat.setAttribute('aria-expanded', String(isOpen));
    chatWidget.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) chatInput?.focus();
  });
}

if (closeChatBtn && chatWidget) {
  closeChatBtn.addEventListener('click', () => {
    chatWidget.classList.remove('open');
    chatWidget.setAttribute('aria-hidden', 'true');
    whatsappFloat?.setAttribute('aria-expanded', 'false');
    whatsappFloat?.focus();
  });
}

if (chatForm && chatInput) {
  chatForm.addEventListener('submit', event => {
    event.preventDefault();
    const question = chatInput.value.trim();
    if (!question) return;

    appendChatMessage(question, 'user');
    chatInput.value = '';
    const reply = getAssistantReply(question);
    appendChatMessage(reply.text, 'assistant', reply.href);
    chatInput.focus();
  });

  chatInput.addEventListener('keydown', event => {
    if (event.key === 'Escape' && chatWidget?.classList.contains('open')) {
      chatWidget.classList.remove('open');
      chatWidget.setAttribute('aria-hidden', 'true');
      whatsappFloat?.setAttribute('aria-expanded', 'false');
      whatsappFloat?.focus();
    }
  });
}

if (chatGroomingBtn && chatWidget) {
  chatGroomingBtn.addEventListener('click', () => {
    const groomingSection = document.getElementById('banho-e-tosa');
    if (!groomingSection) {
      window.location.href = 'index.html#banho-e-tosa';
      return;
    }

    chatWidget.classList.remove('open');
    window.history.replaceState(null, '', '#banho-e-tosa');
    groomingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}

if (createAccountForm) {
  createAccountForm.addEventListener('submit', handleCreateAccount);
}

if (socialButtons.length) {
  socialButtons.forEach(button => {
    button.addEventListener('click', handleSocialAuth);
  });
}

setupCatalogFilters();
registerDashboardGreeting();
updateSummary();
setupCartInteractions();
renderCart();
renderUserProfileChip();
