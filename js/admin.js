import { DataLoader } from "./services/DataLoader.js";

// State
let users = [];
let content = [];
let productsData = {};

// Active state
let currentTab = "users";
let currentEditType = null;
let currentEditId = null;

// DOM Elements
const loginView = document.getElementById("login-view");
const loginForm = document.getElementById("login-form");
const loginUsernameInput = document.getElementById("login-username");
const loginPasswordInput = document.getElementById("login-password");
const loginError = document.getElementById("login-error");

const adminView = document.getElementById("admin-view");
const logoutBtn = document.getElementById("logout-btn");
const tabUsers = document.getElementById("tab-users");
const tabContent = document.getElementById("tab-content");
const addBtn = document.getElementById("add-btn");

const usersTableContainer = document.getElementById("users-table-container");
const usersTbody = document.getElementById("users-tbody");
const contentTableContainer = document.getElementById("content-table-container");
const contentTbody = document.getElementById("content-tbody");

const adminModal = document.getElementById("admin-modal");
const modalTitle = document.getElementById("modal-title");
const modalForm = document.getElementById("modal-form");
const modalFields = document.getElementById("modal-fields");
const modalClose = document.getElementById("modal-close");
const modalCancelBtn = document.getElementById("modal-cancel-btn");

// DATA 
async function initData() {
    try {
        const rawContent = await DataLoader.loadData("./assets/data.json");
        const rawUsers = await DataLoader.loadData("./assets/users.json");

        users = rawUsers;
        content = rawContent.productCards || [];
        productsData = rawContent.productsData || {};

        checkSession();
    } catch (error) {
        console.error("Error al inicializar la base de datos de administración:", error);
    }
}

// Checkeo de sesion
function checkSession() {
    const activeUser = sessionStorage.getItem("admin_user");
    if (activeUser) {
        showDashboard();
    } else {
        showLogin();
    }
}

// AUTENTICACION 
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();
    const user = users.find(u => u.name === username && u.password === password);

    if (!user) {
        loginError.textContent = "Credenciales incorrectas.";
        return;
    }
    if (!user.isAdmin) {
        loginError.textContent = "Acceso denegado: El usuario no tiene permisos de administrador.";
        return;
    }

    loginError.textContent = "";
    sessionStorage.setItem("admin_user", user.name);
    showDashboard();
});

logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("admin_user");
    showLogin();
});

function showLogin() {
    loginView.classList.remove("hidden");
    adminView.classList.add("hidden");
    loginUsernameInput.value = "";
    loginPasswordInput.value = "";
}

function showDashboard() {
    loginView.classList.add("hidden");
    adminView.classList.remove("hidden");
    renderActiveTab();
}

// TAB 
tabUsers.addEventListener("click", () => {
    currentTab = "users";
    setActiveTabButton(tabUsers, tabContent);
    usersTableContainer.classList.remove("hidden");
    contentTableContainer.classList.add("hidden");
    renderActiveTab();
});

tabContent.addEventListener("click", () => {
    currentTab = "content";
    setActiveTabButton(tabContent, tabUsers);
    contentTableContainer.classList.remove("hidden");
    usersTableContainer.classList.add("hidden");
    renderActiveTab();
});

function setActiveTabButton(activeBtn, inactiveBtn) {
    activeBtn.className = "px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-md bg-white text-black transition-all cursor-pointer";
    inactiveBtn.className = "px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-md text-white/60 hover:text-white transition-all cursor-pointer";
}

function renderActiveTab() {
    if (currentTab === "users") {
        renderUsers();
    } else {
        renderContent();
    }
}

// Logs de admin
function logAdminRequest(actionType, url, method, payload) {
    const request = new Request(url, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "X-Admin-Action": actionType
        },
        body: JSON.stringify(payload)
    });
    console.log(`%c[Admin Request Logged] Action: ${actionType} - ${method}`, "color: #10b981; font-weight: bold;");
    console.log("Request Object:", request);
    console.log("Request Headers:", [...request.headers.entries()]);
    console.log("Request Body Payload:", payload);
}

// RENDER Y ACCIONES DE USUARIOS
function renderUsers() {
    usersTbody.innerHTML = "";
    users.forEach((user, index) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-white/5 transition-colors border-b border-white/5";
        row.innerHTML = `
            <td class="py-4 px-6 font-semibold">${escapeHtml(user.name)}</td>
            <td class="py-4 px-6 text-white/60">${escapeHtml(user.email)}</td>
            <td class="py-4 px-6 text-center">
                <span class="px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${user.isSubscribed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/40 border border-white/10'}">
                    ${user.isSubscribed ? 'Sí' : 'No'}
                </span>
            </td>
            <td class="py-4 px-6 text-center">
                <span class="px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${user.isAdmin ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-white/40 border border-white/10'}">
                    ${user.isAdmin ? 'Admin' : 'User'}
                </span>
            </td>
            <td class="py-4 px-6 text-white/40 text-xs">${new Date(user.registerDate).toLocaleDateString()}</td>
            <td class="py-4 px-6 text-right space-x-2">
                <button class="edit-user-btn hover:text-white text-white/60 font-semibold text-xs uppercase transition-colors cursor-pointer" data-index="${index}">Editar</button>
                <button class="delete-user-btn hover:text-red-400 text-red-500/70 font-semibold text-xs uppercase transition-colors cursor-pointer" data-index="${index}">Borrar</button>
            </td>
        `;
        usersTbody.appendChild(row);
    });
}

// User Modal (Add/Edit)
function openUserModal(index = null) {
    currentEditType = "user";
    currentEditId = index;
    const isEdit = index !== null;
    const user = isEdit ? users[index] : { name: "", password: "", email: "", isSubscribed: false, isAdmin: false, likedPostIDs: [] };

    modalTitle.textContent = isEdit ? "Editar Usuario" : "Agregar Usuario";
    modalFields.innerHTML = `
        <div>
            <label class="block text-xs uppercase tracking-wider text-white/60 mb-1">Nombre</label>
            <input type="text" id="field-name" required value="${escapeHtml(user.name)}" class="w-full bg-[#202020] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30 text-sm">
        </div>
        <div>
            <label class="block text-xs uppercase tracking-wider text-white/60 mb-1">Contraseña</label>
            <input type="text" id="field-password" required value="${escapeHtml(user.password)}" class="w-full bg-[#202020] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30 text-sm">
        </div>
        <div>
            <label class="block text-xs uppercase tracking-wider text-white/60 mb-1">Email</label>
            <input type="email" id="field-email" required value="${escapeHtml(user.email)}" class="w-full bg-[#202020] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30 text-sm">
        </div>
        <div class="flex items-center gap-3 mt-2">
            <input type="checkbox" id="field-subscribed" ${user.isSubscribed ? 'checked' : ''} class="w-4 h-4 rounded bg-[#202020] border-white/10 text-white accent-white">
            <label class="text-xs uppercase tracking-wider text-white/60 cursor-pointer" for="field-subscribed">Suscrito al boletín</label>
        </div>
        <div class="flex items-center gap-3">
            <input type="checkbox" id="field-admin" ${user.isAdmin ? 'checked' : ''} class="w-4 h-4 rounded bg-[#202020] border-white/10 text-white accent-white">
            <label class="text-xs uppercase tracking-wider text-white/60 cursor-pointer" for="field-admin">Rol Administrador</label>
        </div>
        <div>
            <label class="block text-xs uppercase tracking-wider text-white/60 mb-1">ID Publicaciones Favoritas (Separados por coma)</label>
            <input type="text" id="field-liked" value="${escapeHtml((user.likedPostIDs || []).join(', '))}" class="w-full bg-[#202020] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30 text-sm" placeholder="pure-brilliance, varnaya-blends">
        </div>
    `;
    openModal();
}

function deleteUser(index) {
    const user = users[index];
    if (confirm(`¿Está seguro que desea borrar al usuario "${user.name}"?`)) {
        const deletedUser = users.splice(index, 1)[0];
        logAdminRequest("DELETE_USER", "https://api.drillot.studio/admin/users", "DELETE", deletedUser);
        DataLoader.saveData("aether_users", users);
        renderUsers();
    }
}

// CONTENT RENDER & ACTIONS
function renderContent() {
    contentTbody.innerHTML = "";
    content.forEach((card, index) => {
        const cardDetails = productsData[card.id] || { varieties: [] };
        const varietyNames = cardDetails.varieties.map(v => v.name).join(", ") || "Ninguna";

        const row = document.createElement("tr");
        row.className = "hover:bg-white/5 transition-colors border-b border-white/5";
        row.innerHTML = `
            <td class="py-4 px-6 text-xs text-white/50">${escapeHtml(card.id)}</td>
            <td class="py-4 px-6 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                    <img src="${card.image}" alt="Preview" class="w-full h-full object-cover">
                </div>
                <div>
                    <span class="font-semibold block text-sm">${escapeHtml(card.brand)}</span>
                </div>
            </td>
            <td class="py-4 px-6 text-xs text-white/50 max-w-[150px] truncate">${escapeHtml(card.image)}</td>
            <td class="py-4 px-6 text-white/60 text-xs max-w-[250px] truncate" title="${escapeHtml(varietyNames)}">
                ${escapeHtml(varietyNames)}
            </td>
            <td class="py-4 px-6 text-right space-x-2">
                <button class="edit-content-btn hover:text-white text-white/60 font-semibold text-xs uppercase transition-colors cursor-pointer" data-index="${index}">Editar</button>
                <button class="delete-content-btn hover:text-red-400 text-red-500/70 font-semibold text-xs uppercase transition-colors cursor-pointer" data-index="${index}">Borrar</button>
            </td>
        `;
        contentTbody.appendChild(row);
    });
}

// Content Modal (Add/Edit)
function openContentModal(index = null) {
    currentEditType = "content";
    currentEditId = index;
    const isEdit = index !== null;
    
    let nextId = "";
    if (!isEdit) {
        nextId = content.length > 0 ? (Math.max(...content.map(c => parseInt(c.id) || 0)) + 1).toString() : "1";
    }

    const card = isEdit ? content[index] : { id: nextId, brand: "", image: "", swatches: [] };
    const swatchStr = (card.swatches || []).map(s => `${s.color}:${s.title}`).join(", ");
    const cardDetails = isEdit ? (productsData[card.id] || { varieties: [] }) : { varieties: [] };
    const varietiesText = cardDetails.varieties.map(v => `${v.name}|${v.desc}|${v.price}|${v.image}`).join("\n");

    modalTitle.textContent = isEdit ? "Editar Producto" : "Agregar Producto";
    modalFields.innerHTML = `
        <div>
            <label class="block text-xs uppercase tracking-wider text-white/60 mb-1">ID Producto</label>
            <input type="text" id="field-content-id" required ${isEdit ? 'disabled' : ''} value="${escapeHtml(card.id)}" class="w-full ${isEdit ? 'bg-[#202020]/50 border border-white/5 text-white/40 cursor-not-allowed' : 'bg-[#202020] border border-white/10 text-white focus:outline-none focus:border-white/30'} rounded-lg px-4 py-2 text-sm">
        </div>
        <div>
            <label class="block text-xs uppercase tracking-wider text-white/60 mb-1">Marca / Etiqueta</label>
            <input type="text" id="field-brand" required value="${escapeHtml(card.brand)}" class="w-full bg-[#202020] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30 text-sm" placeholder="aether.">
        </div>
        <div>
            <label class="block text-xs uppercase tracking-wider text-white/60 mb-1">Ruta de Imagen Principal</label>
            <input type="text" id="field-image" required value="${escapeHtml(card.image)}" class="w-full bg-[#202020] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30 text-sm" placeholder="./assets/images/productos/producto1.png">
        </div>
        <div>
            <label class="block text-xs uppercase tracking-wider text-white/60 mb-1">Swatches Muestras (#color:Título, separados por coma)</label>
            <input type="text" id="field-swatches" value="${escapeHtml(swatchStr)}" class="w-full bg-[#202020] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30 text-sm" placeholder="#a8dadc:Original, #e8a598:Rose">
        </div>
        <div>
            <label class="block text-xs uppercase tracking-wider text-white/60 mb-1">Variedades de Producto (nombre|descripción|precio|ruta_imagen, una por línea)</label>
            <textarea id="field-varieties" rows="4" class="w-full bg-[#202020] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30 text-sm font-mono" placeholder="hydra-serum|5% niacinamide|$48.00|./assets/images/...">${escapeHtml(varietiesText)}</textarea>
        </div>
    `;
    openModal();
}

function deleteContent(index) {
    const card = content[index];
    if (confirm(`¿Está seguro que desea borrar el producto con ID "${card.id}" ("${card.brand}")?`)) {
        const deletedCard = content.splice(index, 1)[0];
        const deletedVarieties = productsData[card.id];
        delete productsData[card.id];

        logAdminRequest("DELETE_CONTENT", "https://api.drillot.studio/admin/content", "DELETE", { card: deletedCard, varieties: deletedVarieties });

        const rawContentStr = localStorage.getItem("aether_data");
        const rawContent = rawContentStr ? JSON.parse(rawContentStr) : {};
        rawContent.productCards = content;
        rawContent.productsData = productsData;
        DataLoader.saveData("aether_data", rawContent);

        renderContent();
    }
}

// MODAL CONTROLS
function openModal() {
    adminModal.classList.remove("hidden");
}

function closeModal() {
    adminModal.classList.add("hidden");
}

modalClose.addEventListener("click", closeModal);
modalCancelBtn.addEventListener("click", closeModal);

modalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (currentEditType === "user") {
        saveUser();
    } else if (currentEditType === "content") {
        saveContent();
    }
});

function saveUser() {
    const name = document.getElementById("field-name").value.trim();
    const password = document.getElementById("field-password").value.trim();
    const email = document.getElementById("field-email").value.trim();
    const isSubscribed = document.getElementById("field-subscribed").checked;
    const isAdmin = document.getElementById("field-admin").checked;
    
    const likedRaw = document.getElementById("field-liked").value;
    const likedPostIDs = likedRaw ? likedRaw.split(",").map(id => id.trim()).filter(id => id !== "") : [];

    const userPayload = {
        name,
        password,
        email,
        isSubscribed,
        isAdmin,
        registerDate: currentEditId !== null ? users[currentEditId].registerDate : new Date().toISOString(),
        likedPostIDs
    };

    if (currentEditId !== null) {
        users[currentEditId] = userPayload;
        logAdminRequest("EDIT_USER", "https://api.drillot.studio/admin/users", "PUT", userPayload);
    } else {
        users.push(userPayload);
        logAdminRequest("CREATE_USER", "https://api.drillot.studio/admin/users", "POST", userPayload);
    }

    DataLoader.saveData("aether_users", users);
    closeModal();
    renderUsers();
}

function saveContent() {
    const id = document.getElementById("field-content-id").value.trim();
    const brand = document.getElementById("field-brand").value.trim();
    const image = document.getElementById("field-image").value.trim();
    
    const swatchesRaw = document.getElementById("field-swatches").value;
    const swatches = swatchesRaw ? swatchesRaw.split(",").map(part => {
        const splitIndex = part.indexOf(":");
        if (splitIndex !== -1) {
            return {
                color: part.substring(0, splitIndex).trim(),
                title: part.substring(splitIndex + 1).trim()
            };
        }
        return { color: "#ffffff", title: part.trim() };
    }).filter(s => s.title !== "") : [];

    const varietiesRaw = document.getElementById("field-varieties").value;
    const varieties = varietiesRaw ? varietiesRaw.split("\n").map(line => {
        const parts = line.split("|");
        if (parts.length >= 4) {
            return {
                name: parts[0].trim(),
                desc: parts[1].trim(),
                price: parts[2].trim(),
                image: parts[3].trim(),
                ingredients: parts[1].trim().split("+").map(i => i.trim())
            };
        } else if (parts[0].trim() !== "") {
            return {
                name: parts[0].trim(),
                desc: parts[1] ? parts[1].trim() : "",
                price: parts[2] ? parts[2].trim() : "$0.00",
                image: parts[3] ? parts[3].trim() : "./assets/images/productos/producto1.png",
                ingredients: []
            };
        }
        return null;
    }).filter(v => v !== null) : [];

    const cardPayload = { id, brand, image, swatches };

    if (currentEditId !== null) {
        content[currentEditId] = cardPayload;
        productsData[id] = { varieties };
        logAdminRequest("EDIT_CONTENT", "https://api.drillot.studio/admin/content", "PUT", { card: cardPayload, varieties });
    } else {
        content.push(cardPayload);
        productsData[id] = { varieties };
        logAdminRequest("CREATE_CONTENT", "https://api.drillot.studio/admin/content", "POST", { card: cardPayload, varieties });
    }

    const rawContentStr = localStorage.getItem("aether_data");
    const rawContent = rawContentStr ? JSON.parse(rawContentStr) : {};
    rawContent.productCards = content;
    rawContent.productsData = productsData;
    DataLoader.saveData("aether_data", rawContent);

    closeModal();
    renderContent();
}

// LISTENERS 
addBtn.addEventListener("click", () => {
    if (currentTab === "users") openUserModal();
    else openContentModal();
});

usersTbody.addEventListener("click", (e) => {
    const index = e.target.getAttribute("data-index");
    if (index === null) return;
    if (e.target.classList.contains("edit-user-btn")) {
        openUserModal(parseInt(index));
    } else if (e.target.classList.contains("delete-user-btn")) {
        deleteUser(parseInt(index));
    }
});

contentTbody.addEventListener("click", (e) => {
    const index = e.target.getAttribute("data-index");
    if (index === null) return;
    if (e.target.classList.contains("edit-content-btn")) {
        openContentModal(parseInt(index));
    } else if (e.target.classList.contains("delete-content-btn")) {
        deleteContent(parseInt(index));
    }
});

function escapeHtml(text) {
    if (!text) return "";
    return text
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", initData);
