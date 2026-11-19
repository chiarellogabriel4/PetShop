const currentYear = document.getElementById('currentYear');
if (currentYear) currentYear.textContent = new Date().getFullYear();

let currentSessionUser = null;
const SESSION_KEY = 'petcareSession';
const CART_KEY = 'petcareCart';
const safeBookingText = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const whatsappFloat = document.querySelector('.whatsapp-float');
const chatWidget = document.getElementById('chatWidget');
const closeChatBtn = document.getElementById('closeChatBtn');
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
    image: 'assets/racao.svg',
    description: 'Alimento completo para o dia a dia do seu pet.'
  },
  {
    name: 'Cama Comfort',
    category: 'Camas',
    badge: 'Cama',
    price: 149,
    image: 'assets/cama.svg',
    description: 'Confortável para o descanso do seu pet.'
  },
  {
    name: 'Casinha Deluxe',
    category: 'Casinhas',
    badge: 'Casinha',
    price: 249,
    image: 'assets/casinha.svg',
    description: 'Um espaço protegido para seu pet descansar.'
  },
  {
    name: 'Pote de Ração Pro',
    category: 'Potes de Ração',
    badge: 'Acessório',
    price: 59,
    image: 'assets/pote-racao.svg',
    description: 'Fácil de usar e limpar.'
  },
  {
    name: 'Coleira Premium',
    category: 'Coleiras',
    badge: 'Acessório',
    price: 69,
    image: 'assets/coleira.svg',
    description: 'Resistente e confortável para passeios.'
  },
  {
    name: 'Suplemento Vital',
    category: 'Suplementos',
    badge: 'Saúde',
    price: 87,
    image: 'assets/suplemento.svg',
    description: 'Suplemento alimentar. Consulte um veterinário antes de usar.'
  },
  {
    name: 'Brinquedo Interativo',
    category: 'Brinquedos',
    badge: 'Brinquedo',
    price: 49,
    image: 'assets/brinquedo.svg',
    description: 'Para brincar e gastar energia.'
  },
  {
    name: 'Kit de Higiene',
    category: 'Higiene',
    badge: 'Kit',
    price: 99,
    image: 'assets/kit-higiene.svg',
    description: 'Itens básicos para o cuidado diário.'
  }
];

function getCurrentUser() { return currentSessionUser; }

function saveCurrentUser(user) {
  currentSessionUser = user;
  renderUserProfileChip();
}

function setupProfileAvatarUpload(chip) {
  const user=getCurrentUser();
  if(!user) return;
  chip.title='Clique para alterar sua foto';
  chip.setAttribute('role','button');
  chip.tabIndex=0;
  let input=document.getElementById('profileAvatarInput');
  if(!input){input=document.createElement('input');input.id='profileAvatarInput';input.type='file';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;document.body.appendChild(input);}
  const choose=()=>input.click();
  chip.onclick=choose;chip.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose();}};
  input.onchange=async()=>{const file=input.files?.[0];if(!file)return;if(!file.type.startsWith('image/')||file.size>10*1024*1024){showToast('Escolha uma imagem de até 10 MB.');input.value='';return;}try{const photo=await compressProfilePhoto(file);const result=await petApi('/api/profile/avatar',{method:'PUT',body:JSON.stringify({photo})});if(result.user.avatar)result.user.avatar+=`?v=${Date.now()}`;saveCurrentUser(result.user);showToast('Foto de perfil atualizada.');}catch(error){showToast(error.message);}finally{input.value='';}};
}

function compressProfilePhoto(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Não foi possível ler a foto.'));reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error('Não foi possível abrir a foto.'));image.onload=()=>{const scale=Math.min(1,800/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',.84);if(data.length>1800000)return reject(new Error('A foto ficou muito grande. Escolha outra imagem.'));resolve(data);};image.src=reader.result;};reader.readAsDataURL(file);});}

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
  setupProfileAvatarUpload(chip);

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

async function handleSocialAuth(event) {
  const button = event.currentTarget;
  const provider = button?.dataset.provider;
  if (!provider) return;
  button.disabled = true;
  try {
    const result = await petApi(`/api/auth/${provider}/begin`);
    if (!result?.url) throw new Error('Este login social ainda não está disponível.');
    window.location.assign(result.url);
  } catch (error) {
    showToast(error.message || 'Não foi possível iniciar o login social.');
  } finally {
    button.disabled = false;
  }
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

async function handleLogin(event) {
  event.preventDefault();
  const button = loginForm.querySelector('[type=submit]');
  button.disabled = true;
  try {
    const result = await petApi('/api/auth/login', {method:'POST', body:JSON.stringify({email:document.getElementById('loginEmail').value.trim(), password:document.getElementById('loginPassword').value})});
    saveCurrentUser(result.user);
    location.href = ['admin','staff'].includes(result.user.role) ? 'admin.html' : 'dashboard-cliente.html';
  } catch(error) { showToast(error.message); } finally { button.disabled=false; }
}

async function handleCreateAccount(event) {
  event.preventDefault();
  const password=document.getElementById('senha').value;
  if(password!==document.getElementById('confirmarSenha').value) {showToast('As senhas não conferem.');return;}
  const button=createAccountForm.querySelector('[type=submit]');button.disabled=true;
  try {
    const result=await petApi('/api/auth/register',{method:'POST',body:JSON.stringify({name:document.getElementById('nome').value.trim(),surname:document.getElementById('sobrenome').value.trim(),email:document.getElementById('registerEmail').value.trim(),password,terms:document.getElementById('termsCheckbox').checked})});
    saveCurrentUser(result.user);location.href='dashboard-cliente.html';
  } catch(error){showToast(error.message);} finally{button.disabled=false;}
}

const revealTargets = document.querySelectorAll('.section-head, .service-card, .product-card, .testimonial-card, .article-card, .stat, .overview-item, .booking-card, .booking-summary, .contact-card, .dashboard-card');
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

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 40px 0px' });

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


if (bookingForm) {
  const petNameInput=document.getElementById('petName'), petTypeInput=document.getElementById('petType');
  const petIdInput=document.createElement('input');petIdInput.type='hidden';petIdInput.name='petId';bookingForm.appendChild(petIdInput);
  (async()=>{try{const {pets}=await petApi('/api/pets');if(!pets.length)return;const list=document.createElement('datalist');list.id='registeredPets';pets.forEach(p=>{const option=document.createElement('option');option.value=p.name;option.dataset.petId=p.id;option.label=p.petType||'Pet cadastrado';list.appendChild(option);});document.body.appendChild(list);petNameInput.setAttribute('list',list.id);petNameInput.placeholder='Escolha um pet cadastrado ou digite o nome';const preview=document.createElement('div');preview.id='bookingPetPreview';preview.className='booking-pet-preview';preview.hidden=true;preview.style.cssText='display:flex;align-items:center;gap:10px;margin-top:8px;padding:8px 10px;border-radius:12px;background:#f7f4ff;color:#5b3cc4;font-size:.78rem';petNameInput.closest('.field').appendChild(preview);const showPet=(pet)=>{petIdInput.value=pet?.id||'';if(pet?.petType)petTypeInput.value=pet.petType;preview.innerHTML=pet?`${pet.photoUrl?`<img style="width:38px;height:38px;border-radius:10px;object-fit:cover" src="${safeBookingText(pet.photoUrl)}" alt="Foto de ${safeBookingText(pet.name)}">`:''}<span>Pet do seu perfil: <strong>${safeBookingText(pet.name)}</strong></span>`:'';preview.hidden=!pet;};petNameInput.addEventListener('input',()=>showPet(pets.find(p=>p.name.toLowerCase()===petNameInput.value.trim().toLowerCase())));if(pets.length===1){petNameInput.value=pets[0].name;showPet(pets[0]);}}catch{ /* visitantes fazem login no envio */ }})();
  bookingForm.addEventListener('submit', async function (event) {
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

    const button=bookingForm.querySelector('[type=submit]');
    button.disabled=true;
    try {
      await petApi('/api/bookings',{method:'POST',body:JSON.stringify(Object.fromEntries(formData))});
    } catch(error) {
      showToast(error.message);
      if(error.status===401) setTimeout(()=>{location.href='login.html';},1600);
      return;
    } finally {button.disabled=false;}
    bookingForm.reset();
    const bookingPetPreview=document.getElementById('bookingPetPreview');if(bookingPetPreview){bookingPetPreview.hidden=true;bookingPetPreview.innerHTML='';}
    updateSummary();
    showToast('Agendamento registrado! Aguardando confirmação da equipe.');
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
  nav.id ||= 'primaryNavigation';
  menuToggle.setAttribute('aria-controls', nav.id);
  const setMenuOpen = open => {
    nav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menuToggle.textContent = open ? '×' : '☰';
  };
  setMenuOpen(false);
  menuToggle.addEventListener('click', () => setMenuOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('pointerdown', event => {
    if (!nav.contains(event.target) && !menuToggle.contains(event.target)) setMenuOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });
  window.matchMedia('(max-width: 1100px)').addEventListener('change', () => setMenuOpen(false));
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

const oauthError = new URLSearchParams(location.search).get('oauth_error');
if (oauthError) {
  showToast(oauthError);
  history.replaceState({}, document.title, location.pathname);
}

// The server session is authoritative; legacy browser credentials are never used.
localStorage.removeItem('petcareSession');
petApi('/api/auth/me').then(({user})=>{saveCurrentUser(user);registerDashboardGreeting();}).catch(()=>{});
