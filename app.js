/**
 * Tasty Bites / ማሚስ ኪችን - Upgraded Digital Menu & Realtime Order System
 */

// --- CONFIGURATION ---
const SUPABASE_URL = "https://cqubbysmuvawqoccickl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZsrXwTLNjQu2wC9fKioVPA_36gJGsmK";
const ADMIN_PASSCODE = "@abudi77"; // Admin owner passcode

// --- TRANSLATION DICTIONARY (English & Amharic) ---
const i18n = {
  en: {
    brandName: "ማሚስ ኪችን",
    brandSubtitle: "Digital Menu & Fresh Dining",
    searchPlaceholder: "Search dishes, drinks, desserts...",
    catAll: "All",
    catMain: "Mains",
    catDrinks: "Drinks",
    catDessert: "Desserts",
    yourOrder: "Your Order",
    readyToOrder: "Ready to order",
    emptyCartMsg: "Tap “Add to order” on any dish to build your meal.",
    subtotal: "Subtotal",
    dineIn: "Dine In",
    takeaway: "Takeaway",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    tableLabel: "Table Number",
    tablePlaceholder: "e.g. 12",
    notesLabel: "Notes",
    notesPlaceholder: "Allergies or special requests",
    placeOrderBtn: "Place Order",
    viewOrderBar: "View Order",
    itemsText: "items",
    itemText: "item",
    addBtn: "+ Add",
    detailsBtn: "Details",
    closeBtn: "Close",
    preparing: "Preparing",
    ready: "Ready",
    completed: "Complete",
    deleteBtn: "Delete",
    clearCompletedBtn: "Clear Completed Orders",
    liveOrdersTab: "Incoming Live Orders",
    addDishTab: "Add New Dish",
    menuListTab: "Current Menu Items",
    analyticsTab: "Sales & Analytics",
    callWaiter: "Call Waiter",
    requestBill: "Request Bill"
  },
  am: {
    brandName: "ማሚስ ኪችን",
    brandSubtitle: "ዲጂታል ሜኑ እና ጣፋጭ ምግብ",
    searchPlaceholder: "ምግቦችን፣ መጠጦችን፣ ጣፋጮችን ይፈልጉ...",
    catAll: "ሁሉም",
    catMain: "ዋና ምግቦች",
    catDrinks: "መጠጦች",
    catDessert: "ጣፋጮች",
    yourOrder: "ትዕዛዝዎ",
    readyToOrder: "ለማዘዝ ዝግጁ",
    emptyCartMsg: "ምግብ ለመምረጥ “ጨምር” የሚለውን ይጫኑ።",
    subtotal: "ጠቅላላ ዋጋ",
    dineIn: "እዚሁ ለመመገብ",
    takeaway: "ይዞ ለመሄድ",
    nameLabel: "ስም",
    namePlaceholder: "ስምዎን ያስገቡ",
    tableLabel: "የጠረጴዛ ቁጥር",
    tablePlaceholder: "ምሳሌ፡ 12",
    notesLabel: "ማስታወሻ",
    notesPlaceholder: "ተጨማሪ ፍላጎት ወይም አለርጂ ካለዎት ያስገቡ",
    placeOrderBtn: "ትዕዛዝ ይላኩ",
    viewOrderBar: "ትዕዛዝ ይመልከቱ",
    itemsText: "ምግቦች",
    itemText: "ምግብ",
    addBtn: "+ ጨምር",
    detailsBtn: "ዝርዝር",
    closeBtn: "ዝጋ",
    preparing: "እየተዘጋጀ ነው",
    ready: "ተዘጋጅቷል",
    completed: "ተጠናቋል",
    deleteBtn: "ሰርዝ",
    clearCompletedBtn: "የተጠናቀቁትን አጽዳ",
    liveOrdersTab: "የቀጥታ ትዕዛዞች",
    addDishTab: "አዲስ ምግብ ጨምር",
    menuListTab: "የሜኑ ዝርዝር",
    analyticsTab: "የሽያጭ ትንታኔ",
    callWaiter: "አስተናጋጅ ጥራ",
    requestBill: "ሂሳብ ጠይቅ"
  }
};

let currentLang = localStorage.getItem("app_language") || "en";

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("app_language", lang);

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  applyTranslations();
  if (document.getElementById("customerMenu")) renderCustomerMenu();
  if (document.getElementById("adminMenuList")) renderAdminMenu();
  showToast(lang === "am" ? "ቋንቋ ወደ አማርኛ ተቀይሯል" : "Language set to English");
}

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n["en"][key] || key;
}

function applyTranslations() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.placeholder = t("searchPlaceholder");

  const namePlaceholder = document.getElementById("customerName");
  if (namePlaceholder) namePlaceholder.placeholder = t("namePlaceholder");

  const notesPlaceholder = document.getElementById("orderNotes");
  if (notesPlaceholder) notesPlaceholder.placeholder = t("notesPlaceholder");

  const placeOrderBtn = document.querySelector(".order-btn");
  if (placeOrderBtn) placeOrderBtn.innerText = t("placeOrderBtn");

  const clearCompletedBtn = document.getElementById("clearCompletedBtnText");
  if (clearCompletedBtn) clearCompletedBtn.innerText = t("clearCompletedBtn");

  const tabLiveOrders = document.getElementById("tabBtn_liveOrders");
  if (tabLiveOrders) tabLiveOrders.innerHTML = `<i class="fa-solid fa-bell"></i> ${t("liveOrdersTab")}`;

  const tabAddDish = document.getElementById("tabBtn_addDish");
  if (tabAddDish) tabAddDish.innerHTML = `<i class="fa-solid fa-plus"></i> ${t("addDishTab")}`;

  const tabMenuList = document.getElementById("tabBtn_menuList");
  if (tabMenuList) tabMenuList.innerHTML = `<i class="fa-solid fa-list-check"></i> ${t("menuListTab")}`;

  const tabAnalytics = document.getElementById("tabBtn_analytics");
  if (tabAnalytics) tabAnalytics.innerHTML = `<i class="fa-solid fa-chart-line"></i> ${t("analyticsTab")}`;
}

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
      if (document.getElementById("analyticsContainer")) renderAdminAnalytics();
    } else if (event.data === "waiter_updated") {
      if (document.getElementById("adminWaiterRequestsList")) renderAdminWaiterRequests();
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

// --- ADMIN TAB NAVIGATION ---
function switchAdminTab(tabName) {
  document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".admin-tab-content").forEach(content => content.style.display = "none");

  const activeBtn = document.getElementById(`tabBtn_${tabName}`);
  const activeContent = document.getElementById(`tabContent_${tabName}`);

  if (activeBtn) activeBtn.classList.add("active");
  if (activeContent) activeContent.style.display = "block";

  if (tabName === "analytics") {
    renderAdminAnalytics();
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
      tableBadge.innerHTML = `<i class="fa-solid fa-chair"></i> ${t("tableLabel")} ${escapeHtml(savedTable)}`;
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
  { id: "8", name: "ስፔሻል ክትፎ", category: "Main", price: 750, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80", badge: "🔥 Traditional", desc: "በቅቤና በሚጥሚጣ የተዘጋጀ ትኩስ አገር በቀል ስፔሻል ክትፎ።", available: true },
  { id: "9", name: "ዶሮ ወጥ", category: "Main", price: 360, image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80", badge: "🔥 Spicy", desc: "በበርበሬና በቅቤ በጥንቃቄ የተሰራ ባህላዊ የዶሮ ወጥ ከእንጀራ ጋር።", available: true },
  { id: "10", name: "የኢትዮጵያ ቡና", category: "Drinks", price: 120, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", badge: "☕ Traditional", desc: "በትኩሱ የተፈጨ ባህላዊ የኢትዮጵያ ቡና።", available: true }
];

const CART_STORAGE_KEY = "digital_menu_cart";
const MENU_STORAGE_KEY = "digital_menu_data";
const ORDERS_STORAGE_KEY = "digital_menu_orders";
const WAITER_STORAGE_KEY = "digital_waiter_requests";
const ACTIVE_ORDER_ID_KEY = "customer_active_order_id";

let selectedCategory = "All";
let searchQuery = "";
let adminSearchQuery = "";
let selectedServiceMode = "dine-in";
let currentMenuItems = [];
let currentOrders = [];
let currentWaiterRequests = [];

// --- UNIFIED DATA SERVICE ---
const DataService = {
  async fetchMenuItems() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("menu_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          currentMenuItems = data.map(item => ({
            id: String(item.id),
            name: item.name || 'Untitled Item',
            category:item => ({
            id: String(item.id),
            name: item.name || 'Untitled Item',
            category: item.category || 'Main',
            price: parseFloat(item.price) || 0,
            image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
            badge: item.badge || '',
            desc: item.description || item.desc || '',
            available: item.available !== false && item.available !== "false"
          }));
          return currentMenuItems;
        }

        if (!error && Array.isArray(data) && data.length === 0) {
          console.log("🌱 Supabase menu table is empty. Auto-seeding initial menu...");
          await this.seedDefaultMenuToSupabase();
          currentMenuItems = defaultMenu;
          return currentMenuItems;
        }

        if (error) {
          console.warn("Supabase fetch menu error, falling back to default menu:", error);
        }
      } catch (err) {
        console.warn("Supabase error during fetch:", err);
      }
    }

    const saved = localStorage.getItem(MENU_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentMenuItems = parsed;
          return currentMenuItems;
        }
      } catch (e) {}
    }

    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(defaultMenu));
    currentMenuItems = defaultMenu;
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

  async deleteOrder(orderId) {
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (error) console.error("Supabase delete order error:", error);
    }

    const orders = await this.fetchOrders();
    const updated = orders.filter(o => String(o.id) !== String(orderId));
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
    if (syncChannel) syncChannel.postMessage("orders_updated");
  },

  async clearCompletedOrders() {
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from("orders")
        .delete()
        .in("status", ["Completed", "Cancelled"]);
      if (error) console.error("Supabase clear completed error:", error);
    }

    const orders = await this.fetchOrders();
    const updated = orders.filter(o => o.status !== "Completed" && o.status !== "Cancelled");
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON
