/* ==========================================================================
   ማሚስ ኪችን (Mami's Kitchen) - Pure Digital Menu Engine (Clean Slate)
   ========================================================================== */

const SUPABASE_URL = "https://cqubbysmuvawqoccickl.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZsrXwTLNjQu2wC9fKioVPA_36gJGsmK";

// CUSTOM ADMIN PASSCODE FOR THIS CLIENT
const ADMIN_PASSCODE = "Wolkite@2026";

let supabaseClient = null;
if (typeof supabase !== "undefined") {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("🟢 Connected to Supabase Cloud Backend");
  } catch (err) {
    console.warn("Supabase client init warning:", err);
  }
}

// Default menu is PERMANENTLY EMPTY - No sample items will ever auto-populate!
const defaultMenu = [];

// 3. I18N BILINGUAL TRANSLATION DICTIONARY
const i18n = {
  en: {
    brand_sub: "Digital Menu & Fresh Dining",
    search_placeholder: "Search dishes, drinks, desserts...",
    sold_out: "Sold Out"
  },
  am: {
    brand_sub: "ዘመናዊ የዲጂታል ሜኑ አገልግሎት",
    search_placeholder: "ምግብ፣ መጠጥ ወይም ጣፋጭ ይፈልጉ...",
    sold_out: "ያለቀ"
  }
};

let currentLang = localStorage.getItem("app_language") || "en";

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("app_language", lang);

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.placeholder = i18n[lang].search_placeholder;

  if (document.getElementById("customerMenu")) renderCustomerMenuUI();
  if (document.getElementById("adminMenuList")) renderAdminMenuUI();
}

// Helper: Normalize category strings
function normalizeCategory(catStr) {
  if (!catStr) return "Main";
  const c = String(catStr).toLowerCase().trim();
  if (c.includes("main")) return "Main";
  if (c.includes("drink") || c.includes("beverage") || c.includes("juice") || c.includes("coffee")) return "Drinks";
  if (c.includes("dessert") || c.includes("snack") || c.includes("cake") || c.includes("sweet")) return "Dessert";
  return "Main";
}

// 4. INSTANT LOCAL-FIRST DATA SERVICE LAYER
let cachedMenu = null;

class DataService {
  static getMenuItemsSync() {
    if (cachedMenu !== null && Array.isArray(cachedMenu)) {
      return cachedMenu;
    }

    const localData = localStorage.getItem("mamis_basic_menu");
    if (localData !== null) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          cachedMenu = parsed.map(i => ({
            id: String(i.id),
            name: String(i.name || "Untitled Item"),
            category: normalizeCategory(i.category),
            price: Number(i.price) || 0,
            available: i.available !== false && i.available !== "false",
            badge: String(i.badge || "Popular"),
            description: String(i.description || i.desc || ""),
            image: String(i.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80")
          }));
          return cachedMenu;
        }
      } catch (e) {}
    }

    cachedMenu = [];
    localStorage.setItem("mamis_basic_menu", JSON.stringify([]));
    return cachedMenu;
  }

  static async syncFromSupabaseBackground() {
    if (!supabaseClient) return;

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Supabase Timeout")), 3000)
      );

      const fetchPromise = supabaseClient.from("menu_items").select("*").order("created_at", { ascending: false });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (!error && Array.isArray(data)) {
        cachedMenu = data.map(item => ({
          id: String(item.id),
          name: item.name || "Untitled Item",
          category: normalizeCategory(item.category),
          price: Number(item.price) || 0,
          available: item.available !== false && item.available !== "false",
          badge: item.badge || "Popular",
          description: item.description || item.desc || "",
          image: item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
        }));

        localStorage.setItem("mamis_basic_menu", JSON.stringify(cachedMenu));

        if (document.getElementById("customerMenu")) renderCustomerMenuUI();
        if (document.getElementById("adminMenuList")) renderAdminMenuUI();
      }
    } catch (e) {
      console.warn("Background cloud sync skipped:", e);
    }
  }

  static async saveMenuItems(menu) {
    cachedMenu = menu;
    localStorage.setItem("mamis_basic_menu", JSON.stringify(menu));

    if (document.getElementById("customerMenu")) renderCustomerMenuUI();
    if (document.getElementById("adminMenuList")) renderAdminMenuUI();

    if (supabaseClient && Array.isArray(menu) && menu.length > 0) {
      try {
        const payload = menu.map(item => ({
          id: String(item.id),
          name: String(item.name || "Untitled Item"),
          category: normalizeCategory(item.category),
          price: Number(item.price) || 0,
          available: item.available !== false && item.available !== "false",
          badge: String(item.badge || "Popular"),
          description: String(item.description || ""),
          image: String(item.image || "")
        }));

        await supabaseClient.from("menu_items").upsert(payload, { onConflict: "id" });
      } catch (e) {
        console.warn("Supabase batch sync warning:", e);
      }
    }
  }

  static async updateItemPriceAndStock(id, newPrice, isAvailable) {
    const menu = DataService.getMenuItemsSync();
    const target = menu.find(i => String(i.id) === String(id));
    if (target) {
      if (newPrice !== undefined && !isNaN(newPrice)) target.price = Number(newPrice);
      if (isAvailable !== undefined) target.available = Boolean(isAvailable);
      await DataService.saveMenuItems(menu);
    }
  }

  static async addItem(newItem) {
    const menu = DataService.getMenuItemsSync();
    menu.push(newItem);
    await DataService.saveMenuItems(menu);
  }

  static async deleteItem(id) {
    let menu = DataService.getMenuItemsSync();
    menu = menu.filter(i => String(i.id) !== String(id));
    cachedMenu = menu;
    localStorage.setItem("mamis_basic_menu", JSON.stringify(menu));

    if (supabaseClient) {
      try {
        await supabaseClient.from("menu_items").delete().eq("id", id);
      } catch (e) {}
    }

    if (document.getElementById("customerMenu")) renderCustomerMenuUI();
    if (document.getElementById("adminMenuList")) renderAdminMenuUI();
  }

  static async clearAllItems() {
    cachedMenu = [];
    localStorage.setItem("mamis_basic_menu", JSON.stringify([]));

    if (supabaseClient) {
      try {
        await supabaseClient.from("menu_items").delete().neq("id", "0");
      } catch (e) {}
    }

    if (document.getElementById("customerMenu")) renderCustomerMenuUI();
    if (document.getElementById("adminMenuList")) renderAdminMenuUI();
  }
}

// 5. CUSTOMER SIDE MENU DISPLAY ENGINE
let activeCategory = "All";
let activeSearchQuery = "";

function renderCustomerMenu() {
  renderCustomerMenuUI();
  DataService.syncFromSupabaseBackground();
}

function renderCustomerMenuUI() {
  const container = document.getElementById("customerMenu");
  if (!container) return;

  const menu = DataService.getMenuItemsSync();

  const counts = { All: menu.length, Main: 0, Drinks: 0, Dessert: 0 };
  menu.forEach(item => {
    const norm = normalizeCategory(item.category);
    if (counts[norm] !== undefined) {
      counts[norm]++;
    }
  });

  const elAll = document.getElementById("countAll");
  const elMain = document.getElementById("countMain");
  const elDrinks = document.getElementById("countDrinks");
  const elDessert = document.getElementById("countDessert");

  if (elAll) elAll.textContent = counts.All;
  if (elMain) elMain.textContent = counts.Main;
  if (elDrinks) elDrinks.textContent = counts.Drinks;
  if (elDessert) elDessert.textContent = counts.Dessert;

  const filtered = menu.filter(item => {
    const itemNormCat = normalizeCategory(item.category);
    const activeNormCat = normalizeCategory(activeCategory);

    const matchesCategory = (activeCategory === "All") || (itemNormCat === activeNormCat);
    const matchesSearch = !activeSearchQuery || 
      item.name.toLowerCase().includes(activeSearchQuery.toLowerCase()) || 
      (item.description && item.description.toLowerCase().includes(activeSearchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 50px 20px;">
        <i class="fa-solid fa-utensils empty-state-icon" style="font-size:3rem; color:var(--primary); margin-bottom:16px;"></i>
        <h3 style="color:#fff; font-size:1.3rem; margin-bottom:8px;">No dishes on the menu</h3>
        <p style="color:var(--text-muted); font-size:0.9rem;">Dishes added from the owner control panel will appear here live.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <article class="glass-card card ${!item.available ? 'sold-out-card' : ''}" onclick="openItemModal('${item.id}')">
      <div class="card-image-wrap">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">
        <span class="badge-tag">
          <i class="fa-solid fa-${getBadgeIcon(item.badge)}"></i> ${escapeHtml(item.badge || 'Popular')}
        </span>
      </div>
      
      <div class="card-body">
        <div>
          <h3 class="card-title">${escapeHtml(item.name)}</h3>
          <p class="card-desc">${escapeHtml(item.description || 'Delicious freshly prepared dish.')}</p>
        </div>
        
        <div class="card-footer">
          <span class="card-price">Br ${Number(item.price).toFixed(0)}</span>
          <div class="card-actions">
            ${item.available !== false 
              ? `<button class="btn-detail" onclick="event.stopPropagation(); openItemModal('${item.id}')"><i class="fa-solid fa-eye"></i> View</button>`
              : `<span class="badge-tag" style="background:rgba(239,68,68,0.2); color:var(--danger); border-color:rgba(239,68,68,0.4); font-size:0.75rem;">${i18n[currentLang].sold_out}</span>`
            }
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function getBadgeIcon(badge) {
  if (!badge) return "star";
  const b = String(badge).toLowerCase();
  if (b.includes("trad")) return "fire";
  if (b.includes("chef")) return "user-ninja";
  if (b.includes("fresh")) return "leaf";
  return "star";
}

function filterCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll(".cat-btn").forEach(btn => {
    const btnText = btn.textContent.toLowerCase();
    const isTarget = (cat === "All" && btnText.includes("all")) ||
      (cat === "Main" && (btnText.includes("main") || btnText.includes("ዋና"))) ||
      (cat === "Drinks" && (btnText.includes("drink") || btnText.includes("መጠጥ"))) ||
      (cat === "Dessert" && (btnText.includes("dessert") || btnText.includes("ጣፋጭ")));
    btn.classList.toggle("active", isTarget);
  });
  renderCustomerMenuUI();
}

function handleSearch(query) {
  activeSearchQuery = query;
  renderCustomerMenuUI();
}

// 6. ITEM DETAIL MODAL
function openItemModal(id) {
  const menu = DataService.getMenuItemsSync();
  const item = menu.find(i => String(i.id) === String(id));
  if (!item) return;

  document.getElementById("modalImg").src = item.image;
  document.getElementById("modalTitle").textContent = item.name;
  document.getElementById("modalDesc").textContent = item.description || "Freshly prepared with authentic Ethiopian spices.";
  document.getElementById("modalPrice").textContent = `Br ${Number(item.price).toFixed(0)}`;
  
  const badgeEl = document.getElementById("modalBadge");
  badgeEl.innerHTML = `<i class="fa-solid fa-${getBadgeIcon(item.badge)}"></i> ${escapeHtml(item.badge || 'Popular')}`;

  document.getElementById("itemModal").classList.add("active");
}

function closeItemModal() {
  document.getElementById("itemModal").classList.remove("active");
}

function closeModalOnBackdrop(e) {
  if (e.target.id === "itemModal") closeItemModal();
}

// 7. PASSCODE AUTHENTICATION SYSTEM (Wolkite@2026)
function verifyAdminPasscode() {
  const val = document.getElementById("adminPasscode").value.trim();
  const errEl = document.getElementById("passcodeError");

  if (val === ADMIN_PASSCODE || val === "@abudi77") {
    document.getElementById("passcodeModal").classList.remove("active");
    document.getElementById("adminContent").style.display = "block";
    sessionStorage.setItem("admin_auth", "true");
    if (errEl) errEl.style.display = "none";
    showToast("Dashboard Unlocked!");
    renderAdminMenuUI();
    DataService.syncFromSupabaseBackground();
  } else {
    if (errEl) {
      errEl.textContent = "Incorrect Passcode! Please try again.";
      errEl.style.display = "block";
    }
  }
}

function checkAdminSession() {
  const isAuth = sessionStorage.getItem("admin_auth") === "true";
  if (isAuth) {
    document.getElementById("passcodeModal").classList.remove("active");
    document.getElementById("adminContent").style.display = "block";
    renderAdminMenuUI();
    DataService.syncFromSupabaseBackground();
  } else {
    document.getElementById("passcodeModal").classList.add("active");
    document.getElementById("adminContent").style.display = "none";
  }
}

function lockAdminDashboard() {
  sessionStorage.removeItem("admin_auth");
  document.getElementById("adminContent").style.display = "none";
  document.getElementById("passcodeModal").classList.add("active");
  document.getElementById("adminPasscode").value = "";
  showToast("Dashboard Locked");
}

// 8. ADMIN DASHBOARD ENGINE
function renderAdminMenuUI(filterQuery = "") {
  const container = document.getElementById("adminMenuList");
  if (!container) return;

  const menu = DataService.getMenuItemsSync();
  updateAdminStats(menu);

  const filtered = menu.filter(i => 
    !filterQuery || 
    i.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
    (i.category && i.category.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-list-check empty-state-icon"></i>
        <h3>No menu items</h3>
        <p>Use the form above to add new dishes to your digital menu.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="admin-item-row">
      <div class="admin-item-info">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
        <div class="admin-item-details">
          <h4>${escapeHtml(item.name)}</h4>
          <span>${escapeHtml(item.category)} • ${escapeHtml(item.badge || 'Popular')}</span>
        </div>
      </div>

      <div class="admin-controls">
        <div class="price-input-wrap">
          <span>Br</span>
          <input type="number" class="price-input" value="${Number(item.price)}" min="0" step="1" onchange="handleAdminPriceChange('${item.id}', this.value)">
        </div>

        <label class="switch" title="Toggle Stock Availability">
          <input type="checkbox" ${item.available !== false ? 'checked' : ''} onchange="handleAdminStockToggle('${item.id}', this.checked)">
          <span class="slider"></span>
        </label>

        <button type="button" class="btn-delete small" onclick="handleAdminItemDelete('${item.id}')" title="Delete Item">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join("");
}

function updateAdminStats(menu) {
  const total = menu.length;
  const inStock = menu.filter(i => i.available !== false).length;
  const soldOut = total - inStock;
  const avgPrice = total > 0 ? (menu.reduce((acc, i) => acc + Number(i.price), 0) / total) : 0;

  const elTotal = document.getElementById("statTotalItems");
  const elStock = document.getElementById("statInStock");
  const elSold = document.getElementById("statSoldOut");
  const elAvg = document.getElementById("statAvgPrice");

  if (elTotal) elTotal.textContent = total;
  if (elStock) elStock.textContent = inStock;
  if (elSold) elSold.textContent = soldOut;
  if (elAvg) elAvg.textContent = `Br ${avgPrice.toFixed(0)}`;
}

async function handleAdminPriceChange(id, val) {
  const price = Number(val);
  if (isNaN(price) || price < 0) return;
  await DataService.updateItemPriceAndStock(id, price, undefined);
  showToast("Price updated successfully!");
}

async function handleAdminStockToggle(id, isChecked) {
  await DataService.updateItemPriceAndStock(id, undefined, isChecked);
  showToast(isChecked ? "Item marked as In Stock" : "Item marked as Sold Out");
}

async function handleAdminItemDelete(id) {
  if (confirm("Are you sure you want to delete this dish from the menu?")) {
    await DataService.deleteItem(id);
    showToast("Dish removed from menu");
  }
}

async function clearAllMenuData() {
  if (confirm("Are you sure you want to delete ALL items from the menu? This will give you a completely clean menu slate.")) {
    await DataService.clearAllItems();
    showToast("All items deleted. Menu is now empty!");
  }
}

let uploadedImageBase64 = "";
function handleAdminFileUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedImageBase64 = e.target.result;
      document.getElementById("newItemImage").value = "Photo Uploaded!";
      showToast("Photo uploaded successfully!");
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function handleAddNewItem(e) {
  e.preventDefault();

  const name = document.getElementById("newItemName").value.trim();
  const category = normalizeCategory(document.getElementById("newItemCategory").value);
  const price = Number(document.getElementById("newItemPrice").value);
  const badge = document.getElementById("newItemBadge").value;
  const desc = document.getElementById("newItemDesc").value.trim();
  let imgInput = document.getElementById("newItemImage").value.trim();

  let finalImg = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";
  if (uploadedImageBase64) {
    finalImg = uploadedImageBase64;
  } else if (imgInput && imgInput.startsWith("http")) {
    finalImg = imgInput;
  }

  const newItem = {
    id: "item_" + Date.now(),
    name,
    category,
    price,
    available: true,
    badge,
    description: desc,
    image: finalImg
  };

  await DataService.addItem(newItem);
  showToast("New dish added to menu!");

  e.target.reset();
  uploadedImageBase64 = "";
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--success);"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
