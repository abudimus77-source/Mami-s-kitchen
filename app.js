/**
 * Tasty Bites - Upgraded Digital Menu & Realtime Order System
 */

// --- CONFIGURATION ---
const SUPABASE_URL = "https://cqubbysmuvawqoccickl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZsrXwTLNjQu2wC9fKioVPA_36gJGsmK";
const ADMIN_PASSCODE = "@abudi77"; // Your custom admin owner passcode

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
      const { data, error } = await supabaseClient
        .from("menu_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        currentMenuItems = data.map(item => ({
          id: item.id,
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
      console.warn("Supabase fetch menu error, falling back to LocalStorage:", error);
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

  async saveMenuItems(items) {
    currentMenuItems = items;
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
    if (syncChannel) syncChannel.postMessage("menu_updated");
  },

  async fetchOrders() {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        currentOrders = data.map(o => ({
          id: o.id,
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
    }

    const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
    try { currentOrders = saved ? JSON.parse(saved) : []; } catch (e) { currentOrders = []; }
    return currentOrders;
  },

  async createOrder(orderData) {
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

      if (!error && data && data.length > 0) return data[0];
      console.error("Supabase order insert error:", error);
    }

    const orders = await this.fetchOrders();
    orders.unshift(orderData);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    if (syncChannel) syncChannel.postMessage("orders_updated");
    return orderData;
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
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      if (syncChannel) syncChannel.postMessage("orders_updated");
    }
  },

  async toggleAvailability(itemId) {
    const items = await this.fetchMenuItems();
    const item = items.find(i => i.id === itemId);
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
    const item = items.find(i => i.id === itemId);
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
    const updated = items.filter(i => i.id !== itemId);
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
        if (payload.eventType === "INSERT") {
          showToast(`🔔 New Order received from ${payload.new.customer_name || 'Guest'}!`);
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(() => {});
          } catch(e){}
        }
        await DataService.fetchOrders();
        if (document.getElementById("adminOrders
