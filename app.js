/**
 * Tasty Bites - Upgraded Digital Menu & Realtime Order System
 */

// --- CONFIGURATION ---
const SUPABASE_URL = "https://cqubbysmuvawqoccickl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZsrXwTLNjQu2wC9fKioVPA_36gJGsmK";
const ADMIN_PASSCODE = "@abudi77"; // Admin owner passcode

// Initialize Supabase Client
let supabaseClient = null;
if (typeof supabase !== "undefined" && SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith("http")) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("🟢 Connected to Supabase Cloud Backend");
  } catch (err) {
    console.warn("⚠️ Failed to initialize Supabase, falling back to LocalStorage:", err);
  }
}

// BroadcastChannel for instant multi-tab sync when running in LocalStorage mode
const syncChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("digital_menu_sync") : null;
if (syncChannel) {
  syncChannel.onmessage = (event) => {
    if (event.data === "menu_updated") {
      if (document.getElementById("customerMenu")) renderCustomerMenu();
      if (document.getElementById("adminMenuList")) renderAdminMenu();
    } else if (event.data === "orders_updated") {
      if (document.getElementById("adminOrdersList")) renderAdminOrders();
      if (document.getElementById("activeOrderTracker")) renderCustomerOrderTracker();
    }
  };
}

// --- ADMIN AUTHENTICATION ---
function verifyAdminPin() {
  const pinInput = document.getElementById("adminPinInput");
  const enteredPin = pinInput ? pinInput.value.trim() : "";

  if (enteredPin === ADMIN_PASSCODE) {
    sessionStorage.setItem("admin_authenticated", "true");
    const authModal = document.getElementById("authModal");
    if (authModal) authModal.classList.remove("active");
    showToast("Owner Dashboard unlocked!");
  } else {
    showToast("Incorrect passcode. Try again.", "error");
    if (pinInput) pinInput.value = "";
  }
}

function checkAdminAuth() {
  const authModal = document.getElementById("authModal");
  if (!authModal) return;

  if (sessionStorage.getItem("admin_authenticated") === "true") {
    authModal.classList.remove("active");
  } else {
    authModal.classList.add("active");
  }
}

// --- MOBILE CART DRAWER TOGGLE ---
function toggleMobileCart(show) {
  const orderCard = document.getElementById("orderCard");
  const orderOverlay = document.getElementById("orderOverlay");

  if (orderCard && orderOverlay) {
    if (show) {
      orderCard.classList.add("open");
      orderOverlay.classList.add("active");
    } else {
      orderCard.classList.remove("open");
      orderOverlay.classList.remove("active");
    }
  }
}

// --- URL TABLE NUMBER AUTO-DETECTION ---
function detectTableFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const tableParam = urlParams.get("table") || urlParams.get("t");

  if (tableParam) {
    sessionStorage.setItem("detected_table_number", tableParam);
  }

  const savedTable = sessionStorage.getItem("detected_table_number");
  if (savedTable) {
    const tableInput = document.getElementById("tableNumber");
    if (tableInput && !tableInput.value) {
      tableInput.value = savedTable;
    }
    const tableBadge = document.getElementById("headerTableBadge");
    if (tableBadge) {
      tableBadge.innerHTML = `<i class="fa-solid fa-chair"></i> Table ${escapeHtml(savedTable)}`;
      tableBadge.style.display = "inline-flex";
    }
  }
}

// --- UTILITIES & SECURITY ---
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  const icon = type === "error" ? "fa-circle-exclamation" : "fa-circle-check";
  const iconColor = type === "error" ? "var(--danger)" : "var(--primary)";

  toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${iconColor};"></i> ${escapeHtml(message)}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Default initial menu data fallback
const defaultMenu = [
  { id: "1", name: "Classic Cheeseburger", category: "Main", price: 320, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80", badge: "⭐ Popular", desc: "100% Angus beef patty topped with melted cheddar, crisp lettuce, vine tomatoes, and signature house sauce on a toasted brioche bun.", available: true },
  { id: "2", name: "Artisan Pepperoni Pizza", category: "Main", price: 420, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80", badge: "👨‍🍳 Chef's Special", desc: "Hand-tossed sourdough crust topped with San Marzano tomato sauce, fresh mozzarella, and crispy cupping pepperoni slices.", available: true },
  { id: "3", name: "Truffle Ribeye Steak", category: "Main", price: 680, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80", badge: "✨ Signature", desc: "12oz Prime ribeye grilled to perfection, drizzled with black truffle butter and served with garlic roasted baby potatoes.", available: true },
  { id: "4", name: "Fresh Peach Iced Tea", category: "Drinks", price: 130, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80", badge: "🌱 Fresh Organic", desc: "Freshly brewed Black tea infused with organic white peach nectar, mint leaves, and ice.", available: true },
  { id: "5", name: "Tropical Mango Smoothie", category: "Drinks", price: 150, image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80", badge: "🥭 Refreshing", desc: "Blend of Alphonso mangoes, Greek yogurt, coconut water, and a touch of wild honey.", available: true },
  { id: "6", name: "Chocolate Lava Cake", category: "Dessert", price: 220, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80", badge: "🍫 Decadent", desc: "Warm dark chocolate cake with a molten chocolate center, served with Madagascan vanilla bean ice cream.", available: true },
  { id: "7", name: "Matcha Cheesecake", category: "Dessert", price: 200, image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80", badge: "✨ New", desc: "Creamy Uji matcha infused Japanese cheesecake with a toasted graham cracker crust.", available: false },
  { id: "8", name: "Doro Wat", category: "Main", price: 360, image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80", badge: "🔥 Spicy", desc: "Slow-cooked chicken stew with berbere spice, onion, and rich Ethiopian flavor served with injera.", available: true },
  { id: "9", name: "Misir Wot", category: "Main", price: 300, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80", badge: "🌱 Vegetarian", desc: "Spiced red lentils simmered in a deep, aromatic sauce and served with warm injera.", available: true },
  { id: "10", name: "Ethiopian Coffee", category: "Drinks", price: 120, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", badge: "☕ Traditional", desc: "Freshly brewed Ethiopian coffee served with a touch of cardamom and sugar.", available: true }
];

const CART_STORAGE_KEY = "digital_menu_cart";
const MENU_STORAGE_KEY = "digital_menu_data";
const ORDERS_STORAGE_KEY = "digital_menu_orders";
const ACTIVE_ORDER_ID_KEY = "customer_active_order_id";

let selectedCategory = "All";
let searchQuery = "";
let adminSearchQuery = "";
let selectedServiceMode = "dine-in";
let currentMenuItems = [];
let currentOrders = [];

// --- UNIFIED DATA SERVICE ---
const DataService = {
  async fetchMenuItems() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("menu_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          currentMenuItems = data.map(item => ({
            id: String(item.id),
            name: item.name,
            category: item.category,
            price: parseFloat(item.price),
            image: item.image,
            badge: item.badge,
            desc: item.description,
            available: item.available
          }));
          return currentMenuItems;
        }

        if (!error && data && data.length === 0) {
          console.log("🌱 Supabase menu table is empty. Auto-seeding initial menu...");
          await this.seedDefaultMenuToSupabase();
          currentMenuItems = defaultMenu;
          return currentMenuItems;
        }

        if (error) console.warn("Supabase fetch menu error:", error);
      } catch (err) {
        console.warn("Supabase error during fetch:", err);
      }
    }

    const saved = localStorage.getItem(MENU_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(defaultMenu));
      currentMenuItems = defaultMenu;
    } else {
      try { currentMenuItems = JSON.parse(saved); } catch (e) { currentMenuItems = defaultMenu; }
    }
    return currentMenuItems;
  },

  async seedDefaultMenuToSupabase() {
    if (!supabaseClient) return;
    const itemsToInsert = defaultMenu.map(m => ({
      name: m.name,
      category: m.category,
      price: m.price,
      badge: m.badge,
      description: m.desc,
      image: m.image,
      available: m.available
    }));

    const { error } = await supabaseClient.from("menu_items").insert(itemsToInsert);
    if (error) console.warn("Auto-seed error:", error);
  },

  async saveMenuItems(items) {
    currentMenuItems = items;
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
    if (syncChannel) syncChannel.postMessage("menu_updated");
  },

  async fetchOrders() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          currentOrders = data.map(o => ({
            id: String(o.id),
            customerName: o.customer_name,
            serviceMode: o.service_mode,
            tableNumber: o.table_number,
            notes: o.notes,
            items: o.items,
            subtotal: parseFloat(o.subtotal),
            status: o.status,
            createdAt: o.created_at
          }));
          return currentOrders;
        }
      } catch(err) {
        console.warn("Fetch orders error:", err);
      }
    }

    const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
    try { currentOrders = saved ? JSON.parse(saved) : []; } catch (e) { currentOrders = []; }
    return currentOrders;
  },

  async createOrder(orderData) {
    let createdRecord = orderData;
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("orders")
        .insert([{
          customer_name: orderData.customerName,
          service_mode: orderData.serviceMode,
          table_number: orderData.tableNumber,
          notes: orderData.notes,
          items: orderData.items,
          subtotal: orderData.subtotal,
          status: "Pending"
        }])
        .select();

      if (!error && data && data.length > 0) {
        createdRecord = { ...orderData, id: String(data[0].id) };
      } else {
        console.error("Supabase order insert error:", error);
      }
    }

    const orders = await this.fetchOrders();
    orders.unshift(createdRecord);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    localStorage.setItem(ACTIVE_ORDER_ID_KEY, createdRecord.id);

    if (syncChannel) syncChannel.postMessage("orders_updated");
    return createdRecord;
  },

  async updateOrderStatus(orderId, newStatus) {
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);
      if (error) console.error("Supabase update status error:", error);
    }

    const orders = await this.fetchOrders();
    const order = orders.find(o => String(o.id) === String(orderId));
    if (order) {
      order.status = newStatus;
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      if (syncChannel) syncChannel.postMessage("orders_updated");
    }
  },

  async toggleAvailability(itemId) {
    const items = await this.fetchMenuItems();
    const item = items.find(i => String(i.id) === String(itemId));
    if (!item) return;

    const newAvailable = !item.available;
    item.available = newAvailable;

    if (supabaseClient) {
      await supabaseClient.from("menu_items").update({ available: newAvailable }).eq("id", itemId);
    }
    await this.saveMenuItems(items);
  },

  async updatePrice(itemId, newPrice) {
    const items = await this.fetchMenuItems();
    const item = items.find(i => String(i.id) === String(itemId));
    if (!item) return;

    const parsedPrice = parseFloat(newPrice) || 0;
    item.price = parsedPrice;

    if (supabaseClient) {
      await supabaseClient.from("menu_items").update({ price: parsedPrice }).eq("id", itemId);
    }
    await this.saveMenuItems(items);
  },

  async deleteItem(itemId) {
    if (supabaseClient) {
      await supabaseClient.from("menu_items").delete().eq("id", itemId);
    }
    const items = await this.fetchMenuItems();
    const updated = items.filter(i => String(i.id) !== String(itemId));
    await this.saveMenuItems(updated);
  },

  async addItem(itemData) {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("menu_items")
        .insert([{
          name: itemData.name,
          category: itemData.category,
          price: itemData.price,
          badge: itemData.badge,
          description: itemData.desc,
          image: itemData.image,
          available: true
        }])
        .select();

      if (!error && data && data.length > 0) {
        await this.fetchMenuItems();
        return;
      }
    }

    const items = await this.fetchMenuItems();
    items.unshift(itemData);
    await this.saveMenuItems(items);
  },

  subscribeToRealtime() {
    if (!supabaseClient) return;

    supabaseClient
      .channel("public:orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, async (payload) => {
        // Audio Chime ONLY plays on Admin Dashboard (admin.html)
        if (payload.eventType === "INSERT") {
          if (document.getElementById("adminOrdersList")) {
            showToast(`🔔 New Order from Table ${payload.new.table_number || 'N/A'} (${payload.new.customer_name || 'Guest'})!`);
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
              audio.play().catch(() => {});
            } catch(e){}
          }
        }
        await DataService.fetchOrders();
        if (document.getElementById("adminOrdersList")) renderAdminOrders();
        if (document.getElementById("activeOrderTracker")) renderCustomerOrderTracker();
      })
      .subscribe();

    supabaseClient
      .channel("public:menu_items")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, async () => {
        await DataService.fetchMenuItems();
        if (document.getElementById("customerMenu")) renderCustomerMenu();
        if (document.getElementById("adminMenuList")) renderAdminMenu();
      })
      .subscribe();
  }
};

// --- CART MANAGEMENT ---
function getCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function getCartItemsWithDetails() {
  const cart = getCart();
  return cart
    .map(entry => {
      const item = currentMenuItems.find(menuItem => String(menuItem.id) === String(entry.id));
      return item ? { ...item, quantity: entry.quantity || 1 } : null;
    })
    .filter(Boolean);
}

function addToCart(id) {
  const item = currentMenuItems.find(menuItem => String(menuItem.id) === String(id));
  if (!item) return;

  const cart = getCart();
  const existing = cart.find(entry => String(entry.id) === String(id));

  if (existing) { existing.quantity += 1; } 
  else { cart.push({ id, quantity: 1 }); }

  saveCart(cart);
  renderCart();
  renderCustomerMenu();
  showToast(`${item.name} added to your order`);
}

function updateCartQuantity(id, delta) {
  const cart = getCart();
  const entry = cart.find(item => String(item.id) === String(id));
  if (!entry) return;

  entry.quantity += delta;
  if (entry.quantity <= 0) {
    saveCart(cart.filter(item => String(item.id) !== String(id)));
  } else {
    saveCart(cart);
  }

  renderCart();
  renderCustomerMenu();
}

function removeFromCart(id) {
  saveCart(getCart().filter(item => String(item.id) !== String(id)));
  renderCart();
  renderCustomerMenu();
}

function getCartSubtotal(items) {
  return items.reduce((total, item) => total + (parseFloat(item.price) || 0) * item.quantity, 0);
}

function setServiceMode(mode) {
  selectedServiceMode = mode;
  document.querySelectorAll('.service-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.mode === mode);
  });

  const tableRow = document.getElementById('tableRow');
  if (tableRow) tableRow.style.display = mode === 'dine-in' ? 'flex' : 'none';
}

function renderCart() {
  const cartItems = getCartItemsWithDetails();
  const countPill = document.getElementById("cartCountPill");
  const totalEl = document.getElementById("cartTotal");
  const container = document.getElementById("cartItemsList");
  const placeOrderBtn = document.querySelector(".order-btn");

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalFormatted = `Br ${getCartSubtotal(cartItems).toFixed(0)}`;

  if (countPill) {
    countPill.innerText = totalItems === 1 ? "1 item" : `${totalItems} items`;
  }

  if (totalEl) totalEl.innerText = subtotalFormatted;

  // Update Floating Mobile Cart Bar
  const mobileBar = document.getElementById("mobileCartBar");
  const mobileBadge = document.getElementById("mobileCartBadge");
  const mobileTotal = document.getElementById("mobileCartTotal");

  if (mobileBar && mobileBadge && mobileTotal) {
    mobileBadge.innerText = totalItems;
    mobileTotal.innerText = subtotalFormatted;
    if (totalItems > 0) {
      mobileBar.classList.add("active");
    } else {
      mobileBar.classList.remove("active");
    }
  }

  if (!container) return;

  if (cartItems.length === 0) {
    container.innerHTML = '<div class="empty-cart">Tap “Add to order” on any dish to build your meal.</div>';
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    return;
  }

  if (placeOrderBtn) placeOrderBtn.disabled = false;

  container.innerHTML = cartItems.map(item => `
    <div class="cart-item">
      <div>
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-meta">Br ${parseFloat(item.price).toFixed(0)} each</div>
      </div>
      <div class="cart-item-controls">
        <button class="cart-qty-btn" onclick="updateCartQuantity('${escapeHtml(item.id)}', -1)">−</button>
        <span>${item.quantity}</span>
        <button class="cart-qty-btn" onclick="updateCartQuantity('${escapeHtml(item.id)}', 1)">+</button>
      </div>
      <button class="cart-remove-btn" onclick="removeFromCart('${escapeHtml(item.id)}')" title="Remove item">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join("");
}

// --- ORDER PLACEMENT ---
async function placeOrder() {
  const cartItems = getCartItemsWithDetails();
  if (cartItems.length === 0) {
    showToast("Add something to your order first.", "error");
    return;
  }

  const customerName = document.getElementById("customerName")?.value?.trim() || "Guest";
  const notes = document.getElementById("orderNotes")?.value?.trim() || "";
  const tableNumber = document.getElementById("tableNumber")?.value?.trim() || sessionStorage.getItem("detected_table_number") || "";
  const subtotal = getCartSubtotal(cartItems);
  const serviceLabel = selectedServiceMode === 'takeaway' ? 'Takeaway' : 'Dine In';
  const locationText = selectedServiceMode === 'dine-in' && tableNumber ? ` • Table ${escapeHtml(tableNumber)}` : '';

  const newOrder = {
    id: Date.now().toString(),
    customerName,
    serviceMode: selectedServiceMode,
    tableNumber,
    notes,
    items: cartItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
    subtotal,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  const created = await DataService.createOrder(newOrder);

  saveCart([]);
  renderCart();
  renderCustomerMenu();
  toggleMobileCart(false);
  renderCustomerOrderTracker();

  if (document.getElementById("customerName")) document.getElementById("customerName").value = "";
  if (document.getElementById("orderNotes")) document.getElementById("orderNotes").value = "";

  showToast(`Order placed for ${escapeHtml(customerName)} via ${serviceLabel}! Total Br ${subtotal.toFixed(0)}${locationText}`);
}

// --- REAL-TIME CUSTOMER ORDER PROGRESS TRACKER ---
async function renderCustomerOrderTracker() {
  const trackerContainer = document.getElementById("activeOrderTracker");
  if (!trackerContainer) return;

  const activeOrderId = localStorage.getItem(ACTIVE_ORDER_ID_KEY);
  if (!activeOrderId) {
    trackerContainer.style.display = "none";
    return;
  }

  const orders = await DataService.fetchOrders();
  const activeOrder = orders.find(o => String(o.id) === String(activeOrderId));

  if (!activeOrder || activeOrder.status === 'Completed' || activeOrder.status === 'Cancelled') {
    trackerContainer.style.display = "none";
    return;
  }

  trackerContainer.style.display = "block";

  const status = activeOrder.status || 'Pending';
  let progressPercent = 25;
  let statusText = "Order Received by Kitchen";
  let statusIcon = "fa-receipt";
  let statusBadgeClass = "pending";

  if (status === 'Preparing') {
    progressPercent = 65;
    statusText = "Chef is Preparing Your Meal";
    statusIcon = "fa-fire-burner";
    statusBadgeClass = "preparing";
  } else if (status === 'Ready') {
    progressPercent = 100;
    statusText = "Order Ready to Serve!";
    statusIcon = "fa-bell-concierge";
    statusBadgeClass = "ready";
  }

  trackerContainer.innerHTML = `
    <div class="glass-card tracker-card">
      <div class="tracker-header">
        <div>
          <span class="eyebrow"><i class="fa-solid ${statusIcon}"></i> Live Order Progress</span>
          <h4>📍 Table ${escapeHtml(activeOrder.tableNumber || 'N/A')} (${escapeHtml(activeOrder.customerName || 'Guest')})</h4>
        </div>
        <span class="order-status ${statusBadgeClass}">${escapeHtml(status)}</span>
      </div>
      
      <div class="tracker-progress-wrap">
        <div class="tracker-progress-bar" style="width: ${progressPercent}%;"></div>
      </div>

      <div class="tracker-footer">
        <span>${escapeHtml(statusText)}</span>
        <strong>Br ${parseFloat(activeOrder.subtotal).toFixed(0)}</strong>
      </div>
    </div>
  `;
}

// --- SEARCH & FILTER ---
function filterCategory(cat) {
  selectedCategory = cat;
  document.querySelectorAll("#categoryNav .cat-btn").forEach(btn => {
    const isTarget = (cat === "All" && btn.innerText.includes("All")) || btn.innerText.includes(cat);
    btn.classList.toggle("active", isTarget);
  });
  renderCustomerMenu();
}

function handleSearch(query) {
  searchQuery = query.toLowerCase().trim();
  renderCustomerMenu();
}

function handleAdminSearch(query) {
  adminSearchQuery = query.toLowerCase().trim();
  renderAdminMenu();
}

function updateCategoryCounts(allItems) {
  const availableItems = allItems.filter(i => i.available);
  const countAll = document.getElementById("countAll");
  const countMain = document.getElementById("countMain");
  const countDrinks = document.getElementById("countDrinks");
  const countDessert = document.getElementById("countDessert");

  if (countAll) countAll.innerText = availableItems.length;
  if (countMain) countMain.innerText = availableItems.filter(i => i.category === "Main").length;
  if (countDrinks) countDrinks.innerText = availableItems.filter(i => i.category === "Drinks").length;
  if (countDessert) countDessert.innerText = availableItems.filter(i => i.category === "Dessert").length;
}

// --- RENDER CUSTOMER MENU ---
async function renderCustomerMenu() {
  const container = document.getElementById("customerMenu");
  if (!container) return;

  const allItems = await DataService.fetchMenuItems();
  renderCart();
  setServiceMode(selectedServiceMode);
  updateCategoryCounts(allItems);
  renderCustomerOrderTracker();

  const filteredItems = allItems.filter(item => {
    const isAvailable = item.available;
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery) || 
      (item.desc && item.desc.toLowerCase().includes(searchQuery));
    return isAvailable && matchesCat && matchesSearch;
  });

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-plate-wheat"></i></div>
        <h3>No Menu Items Found</h3>
        <p>Try searching for something else or changing categories.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredItems.map(item => `
    <div class="glass-card card" onclick="openItemModal('${escapeHtml(item.id)}')">
      <div class="card-image-wrap">
        <img src="${escapeHtml(item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80')}" alt="${escapeHtml(item.name)}">
        ${item.badge ? `<div class="badge-tag">${escapeHtml(item.badge)}</div>` : ''}
      </div>
      <div class="card-body">
        <div class="card-header">
          <div class="card-title">${escapeHtml(item.name)}</div>
          <div class="card-desc">${escapeHtml(item.desc || 'Freshly prepared delicious item.')}</div>
        </div>
        <div class="card-footer">
          <div class="card-price">Br ${parseFloat(item.price).toFixed(0)}</div>
          <div class="card-actions">
            <button class="btn-detail" onclick="event.stopPropagation(); openItemModal('${escapeHtml(item.id)}')">
              <i class="fa-solid fa-eye"></i> Details
            </button>
            <button class="btn-order" onclick="event.stopPropagation(); addToCart('${escapeHtml(item.id)}')">
              <i class="fa-solid fa-plus"></i> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

// --- MODAL ---
function openItemModal(id) {
  const item = currentMenuItems.find(i => String(i.id) === String(id));
  if (!item) return;

  document.getElementById("modalImg").src = item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80';
  document.getElementById("modalTitle").innerText = item.name;
  document.getElementById("modalDesc").innerText = item.desc || 'Fresh gourmet dish prepared with finest ingredients.';
  document.getElementById("modalPrice").innerText = `Br ${parseFloat(item.price).toFixed(0)}`;

  const addButton = document.getElementById("modalAddToOrder");
  if (addButton) {
    addButton.onclick = () => {
      addToCart(item.id);
      closeItemModal();
    };
  }
  
  const badgeEl = document.getElementById("modalBadge");
  if (badgeEl) badgeEl.innerText = item.badge || item.category;

  const modal = document.getElementById("itemModal");
  if (modal) modal.classList.add("active");
}

function closeItemModal() {
  const modal = document.getElementById("itemModal");
  if (modal) modal.classList.remove("active");
}

function closeModalOnBackdrop(event) {
  if (event.target.id === "itemModal") closeItemModal();
}

// --- ADMIN CONTROL CENTER ---
function updateAdminStats(items) {
  const total = items.length;
  const active = items.filter(i => i.available).length;
  const sold = total - active;
  const avg = total > 0 ? (items.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0) / total) : 0;

  const totalEl = document.getElementById("statTotalItems");
  const activeEl = document.getElementById("statActiveItems");
  const soldEl = document.getElementById("statSoldOutItems");
  const avgEl = document.getElementById("statAvgPrice");

  if (totalEl) totalEl.innerText = total;
  if (activeEl) activeEl.innerText = active;
  if (soldEl) soldEl.innerText = sold;
  if (avgEl) avgEl.innerText = `Br ${avg.toFixed(0)}`;
}

async function handleOrderStatusChange(id, status) {
  await DataService.updateOrderStatus(id, status);
  await renderAdminOrders();
  showToast(`Order status updated to ${status}`);
}

async function renderAdminOrders() {
  const container = document.getElementById("adminOrdersList");
  if (!container) return;

  const orders = await DataService.fetchOrders();

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-card">
        <div class="empty-state-icon"><i class="fa-solid fa-receipt"></i></div>
        <h3>No Incoming Orders Yet</h3>
        <p>Customer orders will stream here in real-time as soon as they place one.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => {
    const subtotal = order.items.reduce((total, item) => total + (parseFloat(item.price) || 0) * item.quantity, 0);
    const statusClass = escapeHtml((order.status || 'Pending').toLowerCase());
    const tableDisplay = order.tableNumber ? `Table ${escapeHtml(order.tableNumber)}` : 'No Table #';
    const serviceLabel = order.serviceMode === 'takeaway' ? '🥡 Takeaway' : '🍽️ Dine In';

    return `
      <div class="glass-card order-card-admin">
        <div class="order-admin-header">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <div class="table-badge-prominent">
              <i class="fa-solid fa-chair"></i> ${tableDisplay}
            </div>
            <div>
              <h4 style="margin:0;">${escapeHtml(order.customerName || 'Guest')}</h4>
              <p style="margin:0; font-size:0.82rem; color:var(--text-muted);">${serviceLabel}</p>
            </div>
          </div>
          <span class="order-status ${statusClass}">${escapeHtml(order.status || 'Pending')}</span>
        </div>

        <div class="order-admin-items">
          ${order.items.map(item => `<div class="order-admin-item"><strong>${item.quantity}×</strong> ${escapeHtml(item.name)}</div>`).join('')}
        </div>

        <div class="order-admin-footer">
          <div>
            <strong>Br ${subtotal.toFixed(0)}</strong>
            ${order.notes ? `<div class="order-notes">💬 ${escapeHtml(order.notes)}</div>` : ''}
          </div>
          <div class="order-admin-actions">
            <button class="btn-order small" onclick="handleOrderStatusChange('${escapeHtml(order.id)}', 'Preparing')">👨‍🍳 Preparing</button>
            <button class="btn-detail small" onclick="handleOrderStatusChange('${escapeHtml(order.id)}', 'Ready')">🔔 Ready</button>
            <button class="btn-delete small" onclick="handleOrderStatusChange('${escapeHtml(order.id)}', 'Completed')">✅ Complete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function renderAdminMenu() {
  const container = document.getElementById("adminMenuList");
  if (!container) return;

  const items = await DataService.fetchMenuItems();
  updateAdminStats(items);
  renderAdminOrders();

  const filteredItems = items.filter(item => {
    return !adminSearchQuery || 
      item.name.toLowerCase().includes(adminSearchQuery) || 
      item.category.toLowerCase().includes(adminSearchQuery);
  });

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-card">
        <div class="empty-state-icon"><i class="fa-solid fa-folder-open"></i></div>
        <h3>No Items Found</h3>
        <p>No menu items match your search filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredItems.map(item => `
    <div class="glass-card admin-item-row">
      <div class="admin-item-info">
        <img src="${escapeHtml(item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100')}" alt="${escapeHtml(item.name)}">
        <div class="admin-item-details">
          <h4>${escapeHtml(item.name)}</h4>
          <span>${escapeHtml(item.category)} • ${escapeHtml(item.badge || 'Standard')}</span>
        </div>
      </div>

      <div class="admin-controls">
        <div class="price-input-wrap">
          <span>Br</span>
          <input 
            type="number" 
            step="1" 
            value="${parseFloat(item.price).toFixed(0)}" 
            class="price-input" 
            onchange="handlePriceUpdate('${escapeHtml(item.id)}', this.value)"
          >
        </div>

        <label class="switch" title="Toggle Stock (In Stock / Sold Out)">
          <input 
            type="checkbox" 
            ${item.available ? 'checked' : ''} 
            onchange="handleToggleAvailability('${escapeHtml(item.id)}')"
          >
          <span class="slider"></span>
        </label>

        <button class="btn-delete" onclick="handleDeleteItem('${escapeHtml(item.id)}')" title="Delete Menu Item">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join("");
}

async function handleToggleAvailability(id) {
  await DataService.toggleAvailability(id);
  await renderAdminMenu();
  showToast("Item availability toggled!");
}

async function handlePriceUpdate(id, newPrice) {
  await DataService.updatePrice(id, newPrice);
  await renderAdminMenu();
  showToast("Item price updated!");
}

async function handleDeleteItem(id) {
  if (confirm("Are you sure you want to delete this menu item?")) {
    await DataService.deleteItem(id);
    await renderAdminMenu();
    showToast("Menu item deleted!");
  }
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject("Failed to read image");
    reader.readAsDataURL(file);
  });
}

async function handleAddItem(event) {
  event.preventDefault();
  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value;
  const price = parseFloat(document.getElementById("itemPrice").value);
  const badge = document.getElementById("itemBadge").value.trim();
  const desc = document.getElementById("itemDesc").value.trim();
  const imageUrlInput = document.getElementById("itemImageUrl").value.trim();
  const imageFileInput = document.getElementById("itemImage");
  const imageFile = imageFileInput ? imageFileInput.files[0] : null;

  let image = imageUrlInput;

  if (imageFile) {
    if (imageFile.size > 1024 * 1024) {
      showToast("Uploaded image file is over 1MB. Please use an Image URL or smaller file.", "error");
      return;
    }
    try {
      image = await readImageAsDataUrl(imageFile);
    } catch (error) {
      showToast("Could not read selected image file.", "error");
      return;
    }
  }

  if (!image) {
    image = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80";
  }

  const newItem = {
    id: Date.now().toString(),
    name,
    category,
    price,
    badge,
    desc: desc || "Freshly prepared delicious item.",
    image,
    available: true
  };

  await DataService.addItem(newItem);
  event.target.reset();
  await renderAdminMenu();
  showToast(`Added "${name}" to menu!`);
}

async function resetToDefaultMenu() {
  if (confirm("Reset menu to original sample items?")) {
    await DataService.saveMenuItems(defaultMenu);
    if (document.getElementById("adminMenuList")) renderAdminMenu();
    if (document.getElementById("customerMenu")) renderCustomerMenu();
    showToast("Menu reset to sample data!");
  }
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
  detectTableFromUrl();
  DataService.subscribeToRealtime();
});
