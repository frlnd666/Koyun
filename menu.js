import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDOUb7G6NBe2IKTyLYKFYyf7e0uiNoDoBs",
  authDomain: "koyun-id.firebaseapp.com",
  projectId: "koyun-id",
  storageBucket: "koyun-id.firebasestorage.app",
  messagingSenderId: "672101013741",
  appId: "1:672101013741:web:64b367d77ec8df8ecf14e4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const phoneModal = document.getElementById('phoneModal');
const phoneForm = document.getElementById('phoneForm');
const phoneInput = document.getElementById('phoneInput');
const tableDisplay = document.getElementById('tableDisplay');
const menuContainer = document.getElementById('menuContainer');

const menuGrid = document.getElementById('menuGrid');
const categoriesDiv = document.getElementById('categories');
const tableInfo = document.getElementById('tableInfo');
const cartFloat = document.getElementById('cartFloat');
const viewCartBtn = document.getElementById('viewCartBtn');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const totalPrice = document.getElementById('totalPrice');
const cartCount = document.getElementById('cartCount');
const checkoutBtn = document.getElementById('checkoutBtn');
const paymentMethod = document.getElementById('paymentMethod');
const closeCartModal = document.getElementById('closeCartModal');

let tableNumber = null;
let customerPhone = null;
let cart = [];
let products = [];
let currentCategory = 'all';

function getTableFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('table');
}

tableNumber = getTableFromURL();

if (!tableNumber) {
    // Show landing page instead of error
    document.getElementById('landingPage').style.display = 'flex';
    document.getElementById('phoneModal').style.display = 'none';
    document.getElementById('menuContainer').style.display = 'none';
} else {
    document.getElementById('landingPage').style.display = 'none';
    tableDisplay.textContent = tableNumber;
    
    const savedPhone = sessionStorage.getItem(`phone_table_${tableNumber}`);
    if (savedPhone) {
        customerPhone = savedPhone;
        phoneModal.classList.remove('active');
        menuContainer.style.display = 'block';
        tableInfo.textContent = `Meja ${tableNumber}`;
        loadProducts();
    } else {
        phoneModal.classList.add('active');
    }
}


phoneForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const phone = phoneInput.value.trim();
    
    if (!phone.match(/^08\d{8,11}$/)) {
        alert('Nomor HP tidak valid. Gunakan format 08xxxxxxxxxx');
        return;
    }
    
    customerPhone = phone;
    sessionStorage.setItem(`phone_table_${tableNumber}`, phone);
    
    phoneModal.classList.remove('active');
    menuContainer.style.display = 'block';
    document.body.style.overflow = '';
    tableInfo.textContent = `Meja ${tableNumber}`;
    
    loadProducts();
});

async function loadProducts() {
    try {
        const q = query(collection(db, 'products'), where('active', '==', true));
        const snapshot = await getDocs(q);
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (products.length === 0) {
            menuGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="1.5" style="margin-bottom:20px;">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    </svg>
                    <h3 style="color:var(--text-medium); margin-bottom:8px;">Menu Sedang Disiapkan</h3>
                    <p style="color:var(--text-light);">Silakan hubungi kasir untuk informasi menu</p>
                </div>
            `;
            return;
        }
        
        renderCategories();
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        menuGrid.innerHTML = '<p style="padding:20px; text-align:center; grid-column:1/-1; color:var(--danger);">Gagal memuat menu. Silakan refresh halaman.</p>';
    }
}

function renderCategories() {
    const categories = ['all', ...new Set(products.map(p => p.category))];
    const categoryNames = {
        'all': 'Semua',
        'coffee': 'Coffee',
        'non-coffee': 'Non Coffee',
        'snack': 'Snack'
    };
    
    categoriesDiv.innerHTML = categories.map(cat => `
        <button class="category-btn ${cat === currentCategory ? 'active' : ''}" 
                data-category="${cat}">
            ${categoryNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
    `).join('');
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.dataset.category;
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProducts();
        });
    });
}

function renderProducts() {
    const filtered = currentCategory === 'all' 
        ? products 
        : products.filter(p => p.category === currentCategory);
    
    if (filtered.length === 0) {
        menuGrid.innerHTML = '<p style="padding:40px; text-align:center; grid-column: 1/-1; color:var(--text-light);">Tidak ada produk dalam kategori ini</p>';
        return;
    }
    
    menuGrid.innerHTML = filtered.map(product => `
        <div class="menu-item">
            <img src="${product.imageUrl || 'https://via.placeholder.com/300x220/6F4E37/FFFFFF?text=' + encodeURIComponent(product.name)}" 
                 alt="${product.name}" 
                 class="menu-item-image"
                 onerror="this.src='https://via.placeholder.com/300x220/6F4E37/FFFFFF?text=KoYun'">
            <div class="menu-item-content">
                <h3 class="menu-item-title">${product.name}</h3>
                <p class="menu-item-desc">${product.description || 'Produk berkualitas dari KoYun Coffee'}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">Rp ${product.price.toLocaleString('id-ID')}</span>
                    <button class="add-to-cart-btn" data-id="${product.id}">Tambah</button>
                </div>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(btn.dataset.id);
        });
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCart();
    
    const btn = document.querySelector(`[data-id="${productId}"]`);
    const originalText = btn.textContent;
    btn.textContent = '✓ Ditambahkan!';
    btn.style.background = 'var(--success)';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 1000);
}

function updateCart() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = itemCount;
    
    if (itemCount === 0) {
        cartFloat.style.display = 'none';
    } else {
        cartFloat.style.display = 'block';
    }
}

viewCartBtn.addEventListener('click', () => {
    renderCartItems();
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

closeCartModal.addEventListener('click', () => {
    cartModal.classList.remove('active');
    document.body.style.overflow = '';
});

cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.classList.remove('active');
        document.body.style.overflow = '';
    }
});

function renderCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div style="padding:60px 20px; text-align:center;">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="1.5" style="margin-bottom:16px;">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p style="color:var(--text-light); font-size:1.05rem;">Keranjang masih kosong</p>
            </div>
        `;
        totalPrice.textContent = 'Rp 0';
        checkoutBtn.disabled = true;
        checkoutBtn.style.opacity = '0.5';
        return;
    }
    
    checkoutBtn.disabled = false;
    checkoutBtn.style.opacity = '1';
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>Rp ${item.price.toLocaleString('id-ID')} x ${item.quantity} = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</p>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" data-action="minus" data-id="${item.id}">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" data-action="plus" data-id="${item.id}">+</button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPrice.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const action = btn.dataset.action;
            const item = cart.find(i => i.id === id);
            
            if (action === 'plus') {
                item.quantity++;
            } else {
                item.quantity--;
                if (item.quantity === 0) {
                    cart = cart.filter(i => i.id !== id);
                }
            }
            
            updateCart();
            renderCartItems();
        });
    });
}

checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('Keranjang kosong');
        return;
    }
    
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<span>Memproses...</span>';
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderData = {
        tableNumber: tableNumber,
        customerPhone: customerPhone,
        items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: total,
        paymentMethod: paymentMethod.value,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    try {
        await addDoc(collection(db, 'orders'), orderData);
        
        cartModal.classList.remove('active');
        document.body.style.overflow = '';
        
        const successModal = document.createElement('div');
        successModal.className = 'modal active';
        successModal.innerHTML = `
            <div class="modal-content" style="max-width:400px; text-align:center; padding:40px 24px;">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" style="margin-bottom:20px;">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h2 style="color:var(--success); margin-bottom:12px;">Pesanan Berhasil!</h2>
                <p style="color:var(--text-medium); margin-bottom:24px; line-height:1.6;">
                    Pesanan Anda telah dikirim ke kasir.<br>
                    Silakan tunggu pesanan diproses.
                </p>
                <button onclick="this.closest('.modal').remove(); location.reload();" class="btn-primary btn-large">
                    OK
                </button>
            </div>
        `;
        document.body.appendChild(successModal);
        
        cart = [];
        updateCart();
    } catch (error) {
        console.error('Error:', error);
        alert('Gagal mengirim pesanan. Silakan coba lagi atau hubungi kasir.');
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<span>Pesan Sekarang</span>';
    }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed'));
}
