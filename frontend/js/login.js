document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMsg');
    const btnLogin = document.getElementById('btnLogin');
    
    errorMsg.style.display = 'none';
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('rol', data.rol);
            localStorage.setItem('username', username);
            
            // Redirect based on role
            if (data.rol === 'admin') {
                window.location.href = 'estado_pagos.html'; // Admin dashboard
            } else {
                window.location.href = 'index.html'; // Secretaria panel
            }
        } else {
            const errData = await response.json();
            errorMsg.innerText = errData.detail || 'Error al iniciar sesión';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Login error:", error);
        errorMsg.innerText = 'No se pudo conectar al servidor. Verifique su conexión.';
        errorMsg.style.display = 'block';
    } finally {
        btnLogin.disabled = false;
        btnLogin.innerHTML = 'Entrar al Sistema <i class="fas fa-sign-in-alt"></i>';
    }
});
