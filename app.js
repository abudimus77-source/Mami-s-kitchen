/* ==========================================================================
   ማሚስ ኪችን (Mami's Kitchen) - Supabase Auth & Pure Digital Menu Engine
   ========================================================================== */

const SUPABASE_URL = "https://cqubbysmuvawqoccickl.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZsrXwTLNjQu2wC9fKioVPA_36gJGsmK";

let supabaseClient = null;
if (typeof supabase !== "undefined") {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("🟢 Connected to Supabase Cloud Backend");
  } catch (err) {
    console.warn("Supabase client init warning:", err);
  }
}

// 2. DEFAULT INITIAL MENU DATA
const defaultMenu = [
  {
    id: "item_1",
    name: "Special Kitfo (ስፔሻል ክትፎ)",
    category: "Main",
    price: 380,
    available: true,
    badge: "Popular",
    description: "Finely minced lean beef seasoned with mitmita and niter kibbeh, served with ayib and gomen.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item_2",
    name: "Doro Wat (ዶሮ ወጥ)",
    category: "Main",
    price: 320,
    available: true,
    badge: "Traditional",
    description: "Slow-cooked spicy chicken stew with hard-boiled eggs and traditional berbere sauce.",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item_3",
    name: "Beef Tibs (የበሬ ጥብስ)",
    category: "Main",
    price: 290,
    available: true,
    badge: "Popular",
    description: "Sautéed beef strips with onions, rosemary, garlic, and green chilies.",
    image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item_4",
    name: "Shiro Tagelinos (ሽሮ ተጋቢኖ)",
    category: "Main",
    price: 180,
    available: true,
    badge: "Popular",
    description: "Rich chickpea flour stew simmered in a traditional clay pot with garlic and kibbeh.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item_5",
    name: "Yetsom Beyaynetu (የጾም በያይነቱ)",
    category: "Main",
    price: 210,
    available: true,
    badge: "Fresh",
    description: "Assorted vegan combination platter including lentils, cabbage, beets, and yellow split peas.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item_6",
    name: "Fresh Mango Juice (የማንጎ ጁስ)",
    category: "Drinks",
    price: 90,
    available: true,
    badge: "Fresh",
    description: "100% natural pureed fresh mango juice.",
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item_7",
    name: "Ethiopian Macchiato (ማኪያቶ)",
    category: "Drinks",
    price: 45,
    available: true,
    badge: "Popular",
    description: "Layered espresso with steamed fresh milk.",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item_8",
    name: "Traditional Coffee (የጀበና ቡና)",
    category: "Drinks",
    price: 35,
    available: true,
    badge: "Traditional",
    description: "Freshly roasted clay pot Jebena coffee served with frankincense aroma.",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"
  }
];

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

function normalizeCategory(catStr) {
  if (!catStr) return "Main";
  const c = String(catStr).toLowerCase().trim();
  if (c.includes("main")) return "Main";
  if (c.includes("drink") || c.includes("beverage") || c.includes("juice") || c.includes("coffee")) return "Drinks";
  if (c.includes("dessert") || c.includes("snack") || c.includes("cake") || c.includes("sweet")) return "Dessert";
  return "Main";
}

let cachedMenu = null;

class DataService {
  static getMenuItemsSync() {
    if (cachedMenu && cachedMenu.length > 0) {
      return cachedMenu;
    }

    const localData = localStorage.getItem("mamis_basic_menu");
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedMenu = parsed.map(i => ({ ...i, category: normalizeCategory(i.category) }));
          return cachedMenu;
        }
      } catch (e) {}
    }

    cachedMenu = defaultMenu;
    localStorage.setItem("mamis_basic_menu", JSON.stringify(defaultMenu));
    return defaultMenu;
  }

  static async syncFromSupabaseBackground() {
    if (!supabaseClient) return;

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Supabase Timeout")), 2500)
      );

      const fetchPromise = supabaseClient.from("menu_items").select("*").order("created_at", { ascending: false });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (!error && Array.isArray(data) && data.length > 0) {
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
      } else if (!error && Array.isArray(data) && data.length === 0) {
        await DataService.seedDefaultMenuToSupabase();
      }
    } catch (e) {
      console.warn("Background cloud sync skipped (timeout/offline):", e);
    }
  }

  static async seedDefaultMenuToSupabase() {
    if (!supabaseClient) return;
    try {
      const itemsToInsert = defaultMenu.map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        price: m.price,
        badge: m.badge,
        description: m.description,
        image: m.image,
        available: m.available
      }));
      await supabaseClient.from("menu_items").insert(itemsToInsert);
    } catch (e) {}
  }

  static async saveMenuItems(menu) {
    cachedMenu = menu;
    localStorage.setItem("mamis_basic_menu", JSON.stringify(menu));

    if (supabaseClient) {
      try {
        for (const item of menu) {
          await supabaseClient.from("menu_items").upsert({
            id: String(item.id),
            name: item.name,
            category: normalizeCategory(item.category),
            price: Number(item.price),
            available: item.available,
            badge: item.badge,
            description: item.description,
            image: item.image
          });
        }
      } catch (e) {}
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
    await DataService.saveMenuItems(menu);

    if (supabaseClient) {
      try {
        await supabaseClient.from("menu_items").delete().eq("id", id);
      } catch (e) {}
    }
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
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-utensils empty-state-icon"></i>
        <h3>No dishes found</h3>
        <p>Try searching for a different item or category.</p>
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
  const b = badge.toLowerCase();
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

// 6. SUPABASE EMAIL & PASSWORD AUTHENTICATION SYSTEM
let isSignUpMode = false;

function toggleAuthMode(e) {
  if (e) e.preventDefault();
  isSignUpMode = !isSignUpMode;

  const title = document.getElementById("authModalTitle");
  const sub = document.getElementById("authModalSubtitle");
  const btn = document.getElementById("authSubmitBtn");
  const toggleText = document.getElementById("authToggleText");
  const toggleLink = document.getElementById("authToggleLink");

  if (isSignUpMode) {
    title.textContent = "Create Restaurant Account";
    sub.textContent = "Register your email & password to manage your digital menu";
    btn.textContent = "Register New Account";
    toggleText.textContent = "Already have an account?";
    toggleLink.textContent = "Sign In Instead";
  } else {
    title.textContent = "Owner Sign In";
    sub.textContent = "Enter your email & password to manage your menu";
    btn.textContent = "Sign In To Dashboard";
    toggleText.textContent = "Need an account?";
    toggleLink.textContent = "Create Restaurant Account";
  }

  document.getElementById("authError").style.display = "none";
}

async function checkSupabaseSession() {
  if (!supabaseClient) {
    document.getElementById("authModal").classList.remove("active");
    document.getElementById("adminContent").style.display = "block";
    renderAdminMenuUI();
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && session.user) {
    onAuthSuccess(session.user);
  } else {
    document.getElementById("authModal").classList.add("active");
    document.getElementById("adminContent").style.display = "none";
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();
  const errEl = document.getElementById("authError");

  errEl.style.display = "none";

  if (!supabaseClient) {
    errEl.textContent = "Database connection error.";
    errEl.style.display = "block";
    return;
  }

  if (isSignUpMode) {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
      errEl.textContent = error.message;
      errEl.style.display = "block";
    } else {
      showToast("Account created! Logging in...");
      if (data.user) onAuthSuccess(data.user);
    }
  } else {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      errEl.textContent = "Invalid email or password! Please try again.";
      errEl.style.display = "block";
    } else {
      showToast("Welcome back! Signed in successfully.");
      if (data.user) onAuthSuccess(data.user);
    }
  }
}

function onAuthSuccess(user) {
  document.getElementById("authModal").classList.remove("active");
  document.getElementById("adminContent").style.display = "block";

  const emailText = document.getElementById("userEmailText");
  if (emailText && user && user.email) {
    emailText.textContent = user.email;
  }

  renderAdminMenuUI();
  DataService.syncFromSupabaseBackground();
}

async function logoutFromSupabase() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  document.getElementById("adminContent").style.display = "none";
  document.getElementById("authModal").classList.add("active");
  showToast("Logged out successfully");
}

// 7. ADMIN DASHBOARD ENGINE
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
        <p>Use the form above to add new dishes to the digital menu.</p>
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
  renderAdminMenuUI();
}

async function handleAdminStockToggle(id, isChecked) {
  await DataService.updateItemPriceAndStock(id, undefined, isChecked);
  showToast(isChecked ? "Item marked as In Stock" : "Item marked as Sold Out");
  renderAdminMenuUI();
}

async function handleAdminItemDelete(id) {
  if (confirm("Are you sure you want to delete this dish from the menu?")) {
    await DataService.deleteItem(id);
    showToast("Dish removed from menu");
    renderAdminMenuUI();
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
  renderAdminMenuUI();
}

async function resetMenuData() {
  if (confirm("Reset menu back to default sample items? Custom changes will be overwritten.")) {
    localStorage.removeItem("mamis_basic_menu");
    cachedMenu = defaultMenu;
    await DataService.saveMenuItems(defaultMenu);
    showToast("Menu reset to defaults");
    renderAdminMenuUI();
  }
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
