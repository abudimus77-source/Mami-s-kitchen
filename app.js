/* ==========================================================================
   ማሚስ ኪችን (Mami's Kitchen) - Basic Package Data Engine
   Pure Digital Menu & Price Control System
   ========================================================================== */

const SUPABASE_URL = "https://cqubbysmuvawqoccickl.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZsrXwTLNjQu2wC9fKioVPA_36gJGsmK";

let supabaseClient = null;
if (typeof supabase !== "undefined") {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {}
}

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

  if (document.getElementById("customerMenu")) renderCustomerMenu();
  if (document.getElementById("adminMenuList")) renderAdminMenu();
}

class DataService {
  static async getMenuItems() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from("menu_items").select("*");
        if (!error && data && data.length > 0) {
          return data.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category || "Main",
            price: Number(item.price),
            available: item.available !== false && item.available !== "false",
            badge: item.badge || "Popular",
            description: item.description || "",
            image: item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
          }));
        }
      } catch (e) {}
    }

    const localData = localStorage.getItem("mamis_basic_menu");
    if (localData) {
      try { return JSON.parse(localData); } catch (e) {}
    }

    localStorage.setItem("mamis_basic_menu", JSON.stringify(defaultMenu));
    return defaultMenu;
  }

  static async saveMenuItems(menu) {
    localStorage.setItem("mamis_basic_menu", JSON.stringify(menu));

    if (supabaseClient) {
      try {
        for (const item of menu) {
          await supabaseClient.from("menu_items").upsert({
            id: item.id,
            name: item.name,
            category: item.category,
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
    const menu = await DataService.getMenuItems();
    const target = menu.find(i => String(i.id) === String(id));
    if (target) {
      if (newPrice !== undefined && !isNaN(newPrice)) target.price = Number(newPrice);
      if (isAvailable !== undefined) target.available = Boolean(isAvailable);
      await DataService.saveMenuItems(menu);
    }
  }

  static async addItem(newItem) {
    const menu = await DataService.getMenuItems();
    menu.push(newItem);
    await DataService.saveMenuItems(menu);
  }

  static async deleteItem(id) {
    let menu = await DataService.getMenuItems();
    menu = menu.filter(i => String(i.id) !== String(id));
    await DataService.saveMenuItems(menu);

    if (supabaseClient) {
      try {
        await supabaseClient.from("menu_items").delete().eq("id", id);
      } catch (e) {}
    }
  }
}

let activeCategory = "All";
let activeSearchQuery = "";

async function renderCustomerMenu() {
  const container = document.getElementById("customerMenu");
  if (!container) return;

  const menu = await DataService.getMenuItems();

  const counts = { All: menu.length, Main: 0, Drinks: 0, Dessert: 0 };
  menu.forEach(item => {
    const c = item.category || "Main";
    if (counts[c] !== undefined) counts[c]++;
  });

  for (const k in counts) {
    const badgeEl = document.getElementById(`count${k}`);
    if (badgeEl) badgeEl.textContent = counts[k];
  }

  const filtered = menu.filter(item => {
    const matchesCategory = (activeCategory === "All") || 
      (item.category && item.category.toLowerCase() === activeCategory.toLowerCase());
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
    btn.classList.toggle("active", btn.textContent.includes(cat) || (cat === "All" && btn.textContent.includes("All")));
  });
  renderCustomerMenu();
}

function handleSearch(query) {
  activeSearchQuery = query;
  renderCustomerMenu();
}

async function openItemModal(id) {
  const menu = await DataService.getMenuItems();
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

function verifyAdminPasscode() {
  const val = document.getElementById("adminPasscode").value;
  if (val === "@abudi77") {
    document.getElementById("passcodeModal").classList.remove("active");
    document.getElementById("adminContent").style.display = "block";
    sessionStorage.setItem("admin_auth", "true");
    initAdminDashboard();
  } else {
    document.getElementById("passcodeError").style.display = "block";
  }
}

async function initAdminDashboard() {
  if (sessionStorage.getItem("admin_auth") === "true") {
    document.getElementById("passcodeModal").classList.remove("active");
    document.getElementById("adminContent").style.display = "block";
  }
  await renderAdminMenu();
}

async function renderAdminMenu(filterQuery = "") {
  const container = document.getElementById("adminMenuList");
  if (!container) return;

  const menu = await DataService.getMenuItems();
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
  renderAdminMenu();
}

async function handleAdminStockToggle(id, isChecked) {
  await DataService.updateItemPriceAndStock(id, undefined, isChecked);
  showToast(isChecked ? "Item marked as In Stock" : "Item marked as Sold Out");
  renderAdminMenu();
}

async function handleAdminItemDelete(id) {
  if (confirm("Are you sure you want to delete this dish from the menu?")) {
    await DataService.deleteItem(id);
    showToast("Dish removed from menu");
    renderAdminMenu();
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
  const category = document.getElementById("newItemCategory").value;
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
  renderAdminMenu();
}

async function resetMenuData() {
  if (confirm("Reset menu back to default sample items? Custom changes will be overwritten.")) {
    localStorage.removeItem("mamis_basic_menu");
    await DataService.saveMenuItems(defaultMenu);
    showToast("Menu reset to defaults");
    renderAdminMenu();
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
