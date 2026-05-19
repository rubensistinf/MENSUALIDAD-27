// auth.js - Middleware to check authentication on protected pages

const token = localStorage.getItem('token');
const rol = localStorage.getItem('rol');

if (!token) {
    window.location.href = 'login.html';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Function to handle 401 Unauthorized responses globally
async function fetchWithAuth(url, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }
    
    // Si la data es FormData, no seteamos Content-Type para que el browser lo haga (con el boundary)
    if (!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    options.headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, options);
    
    if (response.status === 401) {
        alert("Su sesión ha expirado o no está autorizado.");
        logout();
        throw new Error("Unauthorized");
    }
    return response;
}

document.addEventListener("DOMContentLoaded", () => {
    // Modify UI based on role
    const currentPath = window.location.pathname;
    
    if (rol === 'admin') {
        // Hide elements that admin shouldn't see
        const adminHideElements = document.querySelectorAll('.admin-hide');
        adminHideElements.forEach(el => el.style.display = 'none');
        
        // Protect secretarial pages from admin
        if (currentPath.includes('index.html') || currentPath.includes('importar_excel.html') || currentPath.includes('caja_informe.html')) {
            alert("Acceso denegado: Panel exclusivo de Secretaría.");
            window.location.href = 'estado_pagos.html';
        }
    } else if (rol === 'secretaria') {
        // Add logout button to navbar if not exists
        const navLinks = document.querySelector('.nav-links');
        if (navLinks && !document.getElementById('btnLogout')) {
            const logoutBtn = document.createElement('a');
            logoutBtn.href = '#';
            logoutBtn.id = 'btnLogout';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Salir';
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
            navLinks.appendChild(logoutBtn);
        }
    }
});
