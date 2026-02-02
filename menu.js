/* ============================================
   KoYun Coffee V2.0 - Customer App Logic
   Modern, Professional & Feature-Rich
   ============================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// Firebase Configuration
// ============================================

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

console.log('✅ Firebase initialized');

// ============================================
// DOM Elements
// ============================================

// Screens
const splashScreen = document.getElementById('splashScreen');
const landingPage = document.getElementById('landingPage');
const phoneModal = document.getElementById('phoneModal');
const appContainer = document.getElementById('appContainer');
const cartModal = document.getElementById('cartModal');
const paymentModal = document.getElementById('paymentModal');

// Phone Modal
const phoneForm = document.getElementById('phoneForm');
const phoneInput = document.getElementById('phoneInput');
const tableDisplay = document.getElementById('tableDisplay');

// App Header
const tableInfo = document.getElementById('tableInfo');

// Category & Menu
const categoryContainer = document.getElementById('categoryContainer');
const sectionTitle = document.getElementById('sectionTitle');
const productCount = document.getElementById('productCount');
const menuGrid = document.getElementById('menuGrid');

// Cart
const cartFloat = document.getElementById('cartFloat');
const viewCartBtn = document.getElementById('viewCartBtn');
const cartBadge = document.getElementById('cartBadge');
const cartCount = document.getElementById('cartCount');
const cartFloatTotal = document.getElementById('cartFloatTotal');
const cartItems = document.getElementById('cartItems');
const closeCartModal = document.getElementById('closeCartModal');

// Order Summary
const subtotal = document.getElementById('subtotal');
const totalPrice = document.getElementById('totalPrice');
const paymentMethod = document.getElementById('paymentMethod');
const checkoutBtn = document.getElementById('checkoutBtn');

// Payment Modal
const closePaymentModal = document.getElementById('closePaymentModal');
const qrisSection = document.getElementById('qrisSection');
const transferSection = document.getElementById('transferSection');
const qrisAmount = document.getElementById('qrisAmount');
const transferAmount = document.getElementById('transferAmount');
const paymentProof = document.getElementById('paymentProof');
const proofPreview = document.getElementById('proofPreview');
const proofPreviewImg = document.getElementById('proofPreviewImg');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');

// ============================================
// State Management
// ============================================

let state = {
    tableNumber: null,
    customerPhone: null,
    products: [],
    cart: [],
    currentCategory: 'all',
    selectedPaymentMethod: 'cash',
    paymentProofFile: null,
    isLoading: false
};

// ============================================
// Initialization
// ============================================

async function init() {
    console.log('🚀 Initializing app...');
    
    // Show splash screen for 2.5 seconds
    setTimeout(() => {
        splashScreen.style.display = 'none';
        checkTableAccess();
    }, 2500);
}

function checkTableAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    state.tableNumber = urlParams.get('table');
    
    if (!state.tableNumber) {
        // No table parameter - show landing page
        landingPage.style.display = 'flex';
        return;
    }
    
    // Check if phone already saved
    const savedPhone = sessionStorage.getItem(`phone_table_${state.tableNumber}`);
    
    if (savedPhone) {
        state.customerPhone = savedPhone;
        showApp();
    } else {
        showPhoneModal();
    }
}

function showPhoneModal() {
    tableDisplay.textContent = state.tableNumber;
    phoneModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showApp() {
    phoneModal.classList.remove('active');
    appContainer.style.display = 'flex';
    document.body.style.overflow = '';
    
    tableInfo.textContent = `Table ${state.tableNumber}`;
    
    loadProducts();
}

// ============================================
// Event Listeners
// ============================================

// Phone Form Submit
phoneForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const phone = phoneInput.value.trim();
    
    if (!phone.match(/^08\d{8,11}$/)) {
        showToast('Invalid phone number format', 'error');
        return;
    }
    
    state.customerPhone = phone;
    sessionStorage.setItem(`phone_table_${state.tableNumber}`, phone);
    
    showApp();
});

// Cart Button
viewCartBtn.addEventListener('click', () => {
    openCartModal();
});

// Close Cart Modal
closeCartModal.addEventListener('click', () => {
    cartModal.classList.remove('active');
    document.body.style.overflow = '';
});

// Close Payment Modal
closePaymentModal.addEventListener('click', () => {
    paymentModal.classList.remove('active');
    cartModal.classList.add('active');
});

// Modal Backdrop Click
[cartModal, paymentModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Payment Method Change
paymentMethod.addEventListener('change', (e) => {
    state.selectedPaymentMethod = e.target.value;
    console.log('💳 Payment method:', state.selectedPaymentMethod);
});

// Checkout Button
checkoutBtn.addEventListener('click', handleCheckout);

// Payment Proof Upload
paymentProof.addEventListener('change', handleProofUpload);

// Confirm Payment
confirmPaymentBtn.addEventListener('click', handleConfirmPayment);

// ============================================
// Product Management
// ============================================

async function loadProducts() {
    try {
        menuGrid.innerHTML = `
            <div class="product-skeleton"></div>
            <div class="product-skeleton"></div>
            <div class="product-skeleton"></div>
        `;
        
        const q = query(collection(db, 'products'), where('active', '==', true));
        const snapshot = await getDocs(q);
        
        state.products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('📦 Products loaded:', state.products.length);
        
        if (state.products.length === 0) {
            menuGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; opacity: 0.3;">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    </svg>
                    <h3 style="color: var(--text-secondary); margin-bottom: 8px;">No Menu Available</h3>
                    <p style="color: var(--text-tertiary);">Please contact staff for assistance</p>
                </div>
            `;
            return;
        }
        
        renderCategories();
        renderProducts();
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        menuGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <p style="color: var(--danger);">Failed to load menu. Please refresh.</p>
            </div>
        `;
    }
}

function renderCategories() {
    const categories = ['all', ...new Set(state.products.map(p => p.category))];
    
    const categoryNames = {
        'all': '✨ All',
        'coffee': '☕ Coffee',
        'non-coffee': '🥤 Non-Coffee',
        'snack': '🍰 Snacks',
        'food': '🍔 Food'
    };
    
    categoryContainer.innerHTML = categories.map(cat => `
        <button class="category-chip ${cat === 'all' ? 'active' : ''}" data-category="${cat}">
            ${categoryNames[cat] || cat}
        </button>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.category-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentCategory = btn.dataset.category;
            
            document.querySelectorAll('.category-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            renderProducts();
        });
    });
}

function renderProducts() {
    const filtered = state.currentCategory === 'all' 
        ? state.products 
        : state.products.filter(p => p.category === state.currentCategory);
    
    // Update section title
    const categoryTitles = {
        'all': 'Our Menu',
        'coffee': 'Coffee Selection',
        'non-coffee': 'Non-Coffee Drinks',
        'snack': 'Snacks & Treats',
        'food': 'Food Menu'
    };
    
    sectionTitle.textContent = categoryTitles[state.currentCategory] || 'Menu';
    productCount.textContent = `${filtered.length} items`;
    
    if (filtered.length === 0) {
        menuGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
                <p style="color: var(--text-tertiary);">No products in this category</p>
            </div>
        `;
        return;
    }
    
    menuGrid.innerHTML = filtered.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.imageUrl || `https://via.placeholder.com/400x300/6F4E37/FFFFFF?text=${encodeURIComponent(product.name)}`}" 
                     alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/400x300/6F4E37/FFFFFF?text=KoYun'">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">${product.description || 'Delicious and premium quality'}</p>
                <div class="product-footer">
                    <span class="product-price">Rp ${product.price.toLocaleString('id-ID')}</span>
                    <button class="btn-add-cart" onclick="addToCart('${product.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// Cart Management
// ============================================

window.addToCart = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = state.cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        state.cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartUI();
    showToast(`${product.name} added to cart`, 'success');
    
    // Button animation
    const btn = document.querySelector(`[data-id="${productId}"] .btn-add-cart`);
    if (btn) {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Added!
        `;
        btn.style.background = 'var(--success)';
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
        }, 1500);
    }
}

window.changeQuantity = function(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;
    
    item.quantity += delta;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
        renderCartItems();
    }
}

window.removeFromCart = function(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    updateCartUI();
    renderCartItems();
    
    if (state.cart.length === 0) {
        cartModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function updateCartUI() {
    const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartBadge.textContent = itemCount;
    cartCount.textContent = itemCount;
    cartFloatTotal.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    
    if (itemCount === 0) {
        cartFloat.style.display = 'none';
    } else {
        cartFloat.style.display = 'block';
    }
}

function openCartModal() {
    renderCartItems();
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function renderCartItems() {
    if (state.cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <svg class="cart-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <h3 style="color: var(--text-secondary); margin-bottom: 8px;">Cart is Empty</h3>
                <p style="color: var(--text-tertiary);">Add some items to get started</p>
            </div>
        `;
        return;
    }
    
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <img src="${item.imageUrl || `https://via.placeholder.com/80/6F4E37/FFFFFF?text=${encodeURIComponent(item.name)}`}" 
                 alt="${item.name}"
                 class="cart-item-image">
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name}</h4>
                <p class="cart-item-price">Rp ${item.price.toLocaleString('id-ID')}</p>
            </div>
            <div class="cart-item-controls">
                <div class="qty-control">
                    <button class="qty-btn" onclick="changeQuantity('${item.id}', -1)">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQuantity('${item.id}', 1)">+</button>
                </div>
                <button class="btn-remove" onclick="removeFromCart('${item.id}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
    
    subtotal.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    totalPrice.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

// ============================================
// Checkout & Payment
// ============================================

async function handleCheckout() {
    if (state.cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }
    
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (state.selectedPaymentMethod === 'cash') {
        // Direct checkout for cash
        await processOrder(total, null);
    } else {
        // Show payment modal for QRIS/Transfer
        cartModal.classList.remove('active');
        showPaymentModal(total);
    }
}

function showPaymentModal(total) {
    qrisAmount.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    transferAmount.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    
    if (state.selectedPaymentMethod === 'qris') {
        qrisSection.style.display = 'block';
        transferSection.style.display = 'none';
    } else if (state.selectedPaymentMethod === 'transfer') {
        qrisSection.style.display = 'none';
        transferSection.style.display = 'block';
    }
    
    paymentModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function handleProofUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    if (file.size > 5000000) {
        showToast('File too large. Max 5MB', 'error');
        e.target.value = '';
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showToast('File must be an image', 'error');
        e.target.value = '';
        return;
    }
    
    state.paymentProofFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
        proofPreviewImg.src = event.target.result;
        proofPreview.style.display = 'block';
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.style.opacity = '1';
        confirmPaymentBtn.style.cursor = 'pointer';
    };
    reader.readAsDataURL(file);
}

window.removeProof = function() {
    state.paymentProofFile = null;
    paymentProof.value = '';
    proofPreview.style.display = 'none';
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.style.opacity = '0.5';
    confirmPaymentBtn.style.cursor = 'not-allowed';
}

async function handleConfirmPayment() {
    if (!state.paymentProofFile) {
        showToast('Please upload payment proof', 'error');
        return;
    }
    
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"></path>
        </svg>
        <span>Uploading...</span>
    `;
    
    try {
        // Convert to base64
        const base64 = await convertToBase64(state.paymentProofFile);
        
        const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await processOrder(total, base64);
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        showToast('Upload failed. Please try again', 'error');
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.innerHTML = '<span>Confirm Payment</span>';
    }
}

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function processOrder(total, proofUrl) {
    const orderData = {
        tableNumber: state.tableNumber,
        customerPhone: state.customerPhone,
        items: state.cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: total,
        paymentMethod: state.selectedPaymentMethod,
        paymentProof: proofUrl,
        paymentStatus: state.selectedPaymentMethod === 'cash' ? 'pending' : 'paid',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    console.log('📤 Sending order...', orderData);
    
    try {
        await addDoc(collection(db, 'orders'), orderData);
        
        console.log('✅ Order sent successfully!');
        
        // Close modals
        paymentModal.classList.remove('active');
        cartModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Show success
        showSuccessMessage();
        
        // Reset state
        state.cart = [];
        state.paymentProofFile = null;
        updateCartUI();
        
        // Reset payment modal
        proofPreview.style.display = 'none';
        paymentProof.value = '';
        confirmPaymentBtn.disabled = true;
        confirmPaymentBtn.style.opacity = '0.5';
        confirmPaymentBtn.innerHTML = '<span>Confirm Payment</span>';
        
    } catch (error) {
        console.error('❌ Order error:', error);
        showToast('Failed to place order. Please try again', 'error');
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.innerHTML = '<span>Confirm Payment</span>';
    }
}

function showSuccessMessage() {
    const messages = {
        'qris': 'QRIS payment received! Your order is being processed.',
        'transfer': 'Transfer proof received! Your order is being verified.',
        'cash': 'Order placed successfully! Please prepare cash for payment.'
    };
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content modal-centered" style="max-width: 400px; text-align: center; padding: 40px 24px;">
            <div style="width: 100px; height: 100px; background: linear-gradient(135deg, var(--success), #27AE60); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; animation: scaleIn 0.5s ease-out;">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <h2 style="color: var(--success); margin-bottom: 12px; font-size: 1.8rem;">Order Success!</h2>
            <p style="color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6;">
                ${messages[state.selectedPaymentMethod]}
            </p>
            <p style="color: var(--text-tertiary); font-size: 0.9rem; margin-bottom: 24px;">
                Order for <strong>Table ${state.tableNumber}</strong>
            </p>
            <button onclick="this.closest('.modal').remove();" class="btn btn-primary btn-block">
                <span>Continue Browsing</span>
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add scaleIn animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// Utility Functions
// ============================================

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function showToast(message, type = 'info') {
    const colors = {
        success: 'var(--success)',
        error: 'var(--danger)',
        info: 'var(--info)',
        warning: 'var(--warning)'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: var(--shadow-xl);
        z-index: 10000;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add toast animations
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(toastStyle);

// ============================================
// Start App
// ============================================

init();

console.log('✅ App initialized');


// ============================================
// Service Worker Registration (Opsional - PWA)
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            console.log('🔄 New version available! Please refresh.');
                            
                            // Optional: Show update notification
                            if (confirm('New version available! Refresh now?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch((error) => {
                console.warn('❌ Service Worker registration failed:', error);
            });
    });
    
    // Handle service worker updates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });
}
