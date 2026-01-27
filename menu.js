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

// Cloudinary config (optional - untuk production)
const cloudinaryConfig = {
    cloudName: "promohub",
    uploadPreset: "promohub"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
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

// Payment Modal Elements
const paymentModal = document.getElementById('paymentModal');
const closePaymentModal = document.getElementById('closePaymentModal');
const paymentProof = document.getElementById('paymentProof');
const proofPreview = document.getElementById('proofPreview');
const proofPreviewImg = document.getElementById('proofPreviewImg');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const qrisInfo = document.getElementById('qrisInfo');
const transferInfo = document.getElementById('transferInfo');
const totalPayment = document.getElementById('totalPayment');

// State
let tableNumber = null;
let customerPhone = null;
let cart = [];
let products = [];
let currentCategory = 'all';
let selectedPaymentMethod = 'cash';
let paymentProofFile = null;
let paymentProofUrl = '';

// Get table number from URL
function getTableFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('table');
}

// Initialize
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

// Load products from Firestore
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
                    <h3 style="color:var(--text-medium);">Menu Belum Tersedia</h3>
                    <p style="color:var(--text-light); margin-top:8px;">Silakan hubungi kasir untuk informasi menu</p>
                </div>
            `;
            return;
        }
        
        renderCategories();
        renderProducts();
        
    } catch (error) {
        console.error('Error loading products:', error);
        menuGrid.innerHTML = '<p style="padding:40px; text-align:center; color:var(--danger);">Gagal memuat menu. Silakan refresh halaman.</p>';
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
                <p class="menu-desc">${product.description || 'Minuman/makanan premium KoYun Coffee'}</p>
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
    
    // Visual feedback
    const btn = document.querySelector(`[data-id="${productId}"]`);
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span>✓ Ditambahkan!</span>';
    btn.style.background = 'var(--success)';
    
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
    }, 1000);
}

// Update cart UI
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

// Close cart modal
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
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="1.5" style="margin-bottom:20px;">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p style="color:var(--text-medium); font-size:1.1rem;">Keranjang masih kosong</p>
            </div>
        `;
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPrice.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.imageUrl || 'https://via.placeholder.com/80/6F4E37/FFFFFF?text=' + encodeURIComponent(item.name)}" 
                 alt="${item.name}"
                 onerror="this.src='https://via.placeholder.com/80/6F4E37/FFFFFF?text=KoYun'">
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
});

// Checkout button - cek payment method
checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('Keranjang kosong');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Jika CASH, langsung proses order
    if (selectedPaymentMethod === 'cash') {
        await processOrder(total, null);
    } else {
        // Jika QRIS/Transfer, minta upload bukti
        cartModal.classList.remove('active');
        showPaymentModal(total);
    }
});

// Show payment modal
function showPaymentModal(total) {
    totalPayment.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    
    // Show relevant payment info
    if (selectedPaymentMethod === 'qris') {
        qrisInfo.style.display = 'block';
        transferInfo.style.display = 'none';
    } else if (selectedPaymentMethod === 'transfer') {
        qrisInfo.style.display = 'none';
        transferInfo.style.display = 'block';
    }
    
    paymentModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Upload proof handler
paymentProof.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validasi file
    if (file.size > 5000000) { // 5MB
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
    
    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
        proofPreviewImg.src = event.target.result;
        proofPreview.style.display = 'block';
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.style.opacity = '1';
    };
    reader.readAsDataURL(file);
});

// Confirm payment button
confirmPaymentBtn.addEventListener('click', async () => {
    if (!paymentProofFile) {
        alert('Silakan upload bukti pembayaran');
        return;
    }
    
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.innerHTML = '<span>Mengupload bukti...</span>';
    
    try {
        // Option 1: Upload to Cloudinary (Production)
        // paymentProofUrl = await uploadToCloudinary(paymentProofFile);
        
        // Option 2: Convert to base64 (Testing - not recommended for production)
        const base64 = await convertToBase64(paymentProofFile);
        paymentProofUrl = base64;
        
        // Process order with payment proof
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await processOrder(total, paymentProofUrl);
        
    } catch (error) {
        console.error('Upload error:', error);
        alert('Gagal upload bukti pembayaran. Coba lagi.');
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.innerHTML = '<span>Konfirmasi Pembayaran</span>';
    }
});

// Convert file to base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Upload to Cloudinary (Optional - for production)
async function uploadToCloudinary(file) {
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('folder', 'koyun-payment-proofs');
    
    const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.secure_url;
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
    
    try {
        await addDoc(collection(db, 'orders'), orderData);
        
        // Close modals
        paymentModal.classList.remove('active');
        cartModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Success message
        showSuccessMessage(selectedPaymentMethod);
        
        // Reset
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
        console.error('Error:', error);
        alert('Gagal mengirim pesanan. Silakan coba lagi.');
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.innerHTML = '<span>Konfirmasi Pembayaran</span>';
    }
}

// Show success message
function showSuccessMessage(method) {
    const messages = {
        'qris': 'Pembayaran QRIS telah diterima! Pesanan Anda sedang diproses.',
        'transfer': 'Bukti transfer telah diterima! Pesanan Anda sedang diverifikasi.',
        'cash': 'Pesanan berhasil! Silakan siapkan uang tunai untuk pembayaran.'
    };
    
    const successModal = document.createElement('div');
    successModal.className = 'modal active';
    successModal.innerHTML = `
        <div class="modal-content" style="max-width:400px; text-align:center; padding:40px 24px;">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" style="margin-bottom:20px;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h2 style="color:var(--success); margin-bottom:12px; font-family:'Playfair Display', serif;">Pesanan Berhasil!</h2>
            <p style="color:var(--text-medium); margin-bottom:24px; line-height:1.6;">
                ${messages[method]}
            </p>
            <button onclick="this.closest('.modal').remove(); location.reload();" class="btn-primary btn-large">
                <span>OK</span>
            </button>
        </div>
    `;
    document.body.appendChild(successModal);
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
