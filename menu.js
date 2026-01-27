import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase Config
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

console.log('🔥 Firebase initialized');

// DOM Elements - Main
const phoneModal = document.getElementById('phoneModal');
const phoneForm = document.getElementById('phoneForm');
const phoneInput = document.getElementById('phoneInput');
const tableDisplay = document.getElementById('tableDisplay');
const menuContainer = document.getElementById('menuContainer');
const menuGrid = document.getElementById('menuGrid');
const categoriesDiv = document.getElementById('categories');
const tableInfo = document.getElementById('tableInfo');

// DOM Elements - Cart
const cartFloat = document.getElementById('cartFloat');
const viewCartBtn = document.getElementById('viewCartBtn');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const totalPrice = document.getElementById('totalPrice');
const cartCount = document.getElementById('cartCount');
const checkoutBtn = document.getElementById('checkoutBtn');
const paymentMethod = document.getElementById('paymentMethod');
const closeCartModal = document.getElementById('closeCartModal');

// DOM Elements - Payment Modal
const paymentModal = document.getElementById('paymentModal');
const closePaymentModal = document.getElementById('closePaymentModal');
const paymentProof = document.getElementById('paymentProof');
const proofPreview = document.getElementById('proofPreview');
const proofPreviewImg = document.getElementById('proofPreviewImg');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const qrisInfo = document.getElementById('qrisInfo');
const transferInfo = document.getElementById('transferInfo');
const totalPayment = document.getElementById('totalPayment');

console.log('✅ DOM elements loaded');
console.log('Payment Modal exists?', paymentModal !== null);
console.log('Payment Proof input exists?', paymentProof !== null);

// State
let tableNumber = null;
let customerPhone = null;
let cart = [];
let products = [];
let currentCategory = 'all';
let selectedPaymentMethod = 'cash';
let paymentProofFile = null;
let paymentProofUrl = '';

// Get table from URL
function getTableFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('table');
}

// Initialize
tableNumber = getTableFromURL();

if (!tableNumber) {
    const landingPage = document.getElementById('landingPage');
    if (landingPage) {
        landingPage.style.display = 'flex';
    }
    if (phoneModal) phoneModal.style.display = 'none';
    if (menuContainer) menuContainer.style.display = 'none';
} else {
    const landingPage = document.getElementById('landingPage');
    if (landingPage) {
        landingPage.style.display = 'none';
    }
    
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
        document.body.style.overflow = 'hidden';
    }
}

// Phone form submit
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

// Load products
async function loadProducts() {
    try {
        const q = query(collection(db, 'products'), where('active', '==', true));
        const snapshot = await getDocs(q);
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log('📦 Products loaded:', products.length);
        
        if (products.length === 0) {
            menuGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
                    <h3 style="color:var(--text-medium);">Menu Belum Tersedia</h3>
                    <p style="color:var(--text-light);">Silakan hubungi kasir</p>
                </div>
            `;
            return;
        }
        
        renderCategories();
        renderProducts();
        
    } catch (error) {
        console.error('Error loading products:', error);
        menuGrid.innerHTML = '<p style="padding:40px; text-align:center; color:var(--danger);">Gagal memuat menu</p>';
    }
}

// Render categories
function renderCategories() {
    const categories = ['all', ...new Set(products.map(p => p.category))];
    const categoryNames = {
        'all': 'Semua',
        'coffee': 'Coffee',
        'non-coffee': 'Non Coffee',
        'snack': 'Snack'
    };
    
    categoriesDiv.innerHTML = categories.map(cat => `
        <button class="category-btn ${cat === 'all' ? 'active' : ''}" data-category="${cat}">
            ${categoryNames[cat] || cat}
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

// Render products
function renderProducts() {
    const filtered = currentCategory === 'all' 
        ? products 
        : products.filter(p => p.category === currentCategory);
    
    if (filtered.length === 0) {
        menuGrid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px 20px;">
                <p style="color:var(--text-light);">Tidak ada produk dalam kategori ini</p>
            </div>
        `;
        return;
    }
    
    menuGrid.innerHTML = filtered.map(product => `
        <div class="menu-card">
            <div class="menu-image">
                <img src="${product.imageUrl || 'https://via.placeholder.com/300x200/6F4E37/FFFFFF?text=' + encodeURIComponent(product.name)}" 
                     alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/300x200/6F4E37/FFFFFF?text=KoYun'">
            </div>
            <div class="menu-info">
                <h3 class="menu-name">${product.name}</h3>
                <p class="menu-desc">${product.description || 'Premium quality'}</p>
                <div class="menu-footer">
                    <span class="menu-price">Rp ${product.price.toLocaleString('id-ID')}</span>
                    <button class="add-to-cart-btn" data-id="${product.id}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Tambah
                    </button>
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

// Add to cart
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
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span>✓ Ditambahkan!</span>';
    btn.style.background = 'var(--success)';
    
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
    }, 1000);
}

// Update cart
function updateCart() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = itemCount;
    
    if (itemCount === 0) {
        cartFloat.style.display = 'none';
    } else {
        cartFloat.style.display = 'block';
    }
}

// View cart
viewCartBtn.addEventListener('click', () => {
    renderCartItems();
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

// Close cart
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

// Render cart items
function renderCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <p style="color:var(--text-medium);">Keranjang masih kosong</p>
            </div>
        `;
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPrice.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.imageUrl || 'https://via.placeholder.com/80/6F4E37/FFFFFF?text=' + encodeURIComponent(item.name)}" 
                 alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-price">Rp ${item.price.toLocaleString('id-ID')}</p>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="changeQuantity('${item.id}', -1)">−</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" onclick="changeQuantity('${item.id}', 1)">+</button>
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.id}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `).join('');
}

// Change quantity
window.changeQuantity = function(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCart();
            renderCartItems();
        }
    }
};

// Remove from cart
window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    renderCartItems();
};

// Payment method change
paymentMethod.addEventListener('change', (e) => {
    selectedPaymentMethod = e.target.value;
    console.log('💳 Payment method changed:', selectedPaymentMethod);
});

// Checkout button
checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('Keranjang kosong');
        return;
    }
    
    console.log('🛒 Checkout clicked. Method:', selectedPaymentMethod);
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (selectedPaymentMethod === 'cash') {
        console.log('💵 Processing cash order...');
        await processOrder(total, null);
    } else {
        console.log('💳 Opening payment modal...');
        cartModal.classList.remove('active');
        showPaymentModal(total);
    }
});

// Show payment modal
function showPaymentModal(total) {
    totalPayment.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    
    if (selectedPaymentMethod === 'qris') {
        qrisInfo.style.display = 'block';
        transferInfo.style.display = 'none';
    } else if (selectedPaymentMethod === 'transfer') {
        qrisInfo.style.display = 'none';
        transferInfo.style.display = 'block';
    }
    
    paymentModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Payment modal opened');
}

// Upload proof handler
paymentProof.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('📸 File selected:', file.name, file.size);
    
    if (file.size > 5000000) {
        alert('Ukuran file terlalu besar. Maksimal 5MB');
        e.target.value = '';
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar');
        e.target.value = '';
        return;
    }
    
    paymentProofFile = file;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        proofPreviewImg.src = event.target.result;
        proofPreview.style.display = 'block';
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.style.opacity = '1';
        confirmPaymentBtn.style.cursor = 'pointer';
        console.log('✅ Preview loaded');
    };
    reader.readAsDataURL(file);
});

// Confirm payment
confirmPaymentBtn.addEventListener('click', async () => {
    if (!paymentProofFile) {
        alert('Silakan upload bukti pembayaran');
        return;
    }
    
    console.log('⏳ Uploading proof...');
    
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.innerHTML = '<span>Mengupload...</span>';
    
    try {
        const base64 = await convertToBase64(paymentProofFile);
        paymentProofUrl = base64;
        
        console.log('✅ Proof uploaded (base64)');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await processOrder(total, paymentProofUrl);
        
    } catch (error) {
        console.error('Upload error:', error);
        alert('Gagal upload bukti pembayaran');
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.innerHTML = '<span>Konfirmasi Pembayaran</span>';
    }
});

// Convert to base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Process order
async function processOrder(total, proofUrl) {
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
        paymentMethod: selectedPaymentMethod,
        paymentProof: proofUrl || null,
        paymentStatus: selectedPaymentMethod === 'cash' ? 'pending' : 'paid',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    console.log('📤 Sending order...', orderData);
    
    try {
        await addDoc(collection(db, 'orders'), orderData);
        
        console.log('✅ Order sent successfully!');
        
        paymentModal.classList.remove('active');
        cartModal.classList.remove('active');
        document.body.style.overflow = '';
        
        showSuccessMessage(selectedPaymentMethod);
        
        cart = [];
        paymentProofFile = null;
        paymentProofUrl = '';
        proofPreview.style.display = 'none';
        paymentProof.value = '';
        confirmPaymentBtn.disabled = true;
        confirmPaymentBtn.style.opacity = '0.5';
        confirmPaymentBtn.innerHTML = '<span>Konfirmasi Pembayaran</span>';
        updateCart();
        
    } catch (error) {
        console.error('❌ Error sending order:', error);
        alert('Gagal mengirim pesanan. Coba lagi.');
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.innerHTML = '<span>Konfirmasi Pembayaran</span>';
    }
}

// Success message
function showSuccessMessage(method) {
    const messages = {
        'qris': 'Pembayaran QRIS diterima! Pesanan sedang diproses.',
        'transfer': 'Bukti transfer diterima! Pesanan sedang diverifikasi.',
        'cash': 'Pesanan berhasil! Siapkan uang tunai untuk pembayaran.'
    };
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px; text-align:center; padding:40px 24px;">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" style="margin-bottom:20px;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h2 style="color:var(--success); margin-bottom:12px;">Pesanan Berhasil!</h2>
            <p style="color:var(--text-medium); margin-bottom:24px; line-height:1.6;">
                ${messages[method]}
            </p>
            <button onclick="this.closest('.modal').remove(); location.reload();" class="btn-primary btn-large">
                OK
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Close payment modal
closePaymentModal.addEventListener('click', () => {
    paymentModal.classList.remove('active');
    cartModal.classList.add('active');
});

paymentModal.addEventListener('click', (e) => {
    if (e.target === paymentModal) {
        paymentModal.classList.remove('active');
        cartModal.classList.add('active');
    }
});

console.log('✅ All event listeners attached');
