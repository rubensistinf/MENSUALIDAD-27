// Configuración del botón de instalación
const installButton = document.createElement('button');
installButton.id = 'pwa-install-button';
installButton.innerHTML = '<i class="fa-solid fa-download" style="margin-right: 8px;"></i> Instalar App';
Object.assign(installButton.style, {
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  padding: '10px 20px',
  backgroundColor: '#2A8CFF',
  background: 'linear-gradient(135deg, #449CFF, #1E7BFF)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '30px',
  fontFamily: "'Poppins', sans-serif",
  fontWeight: '600',
  fontSize: '1rem',
  cursor: 'pointer',
  display: 'none', // Oculto por defecto
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: '9999',
  boxShadow: '0 8px 25px rgba(42, 140, 255, 0.4), inset 0 2px 5px rgba(255,255,255,0.3)',
  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  letterSpacing: '0.5px'
});
document.body.appendChild(installButton);

// Efecto hover (añadido vía JS)
installButton.addEventListener('mouseenter', () => {
    installButton.style.transform = 'translateY(-5px)';
    installButton.style.boxShadow = '0 12px 30px rgba(42, 140, 255, 0.6), inset 0 2px 5px rgba(255,255,255,0.4)';
});
installButton.addEventListener('mouseleave', () => {
    installButton.style.transform = 'translateY(0)';
    installButton.style.boxShadow = '0 8px 25px rgba(42, 140, 255, 0.4), inset 0 2px 5px rgba(255,255,255,0.3)';
});

// Manejo del evento de instalación
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Evento beforeinstallprompt recibido');
  
  // 1. Prevenir el banner automático
  e.preventDefault();
  
  // 2. Guardar el evento para usarlo luego
  deferredPrompt = e;
  
  // 3. Mostrar NUESTRO botón de instalación
  installButton.style.display = 'flex';
  
  // 4. Opcional: Ocultar después de 40 segundos
  setTimeout(() => {
    if (installButton.style.display === 'flex') {
      installButton.style.display = 'none';
    }
  }, 40000);
});

// Manejo del clic en nuestro botón
installButton.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  
  console.log('[PWA] Mostrando diálogo de instalación');
  
  try {
    // Mostrar el prompt de instalación
    deferredPrompt.prompt();
    
    // Esperar a que el usuario decida
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`[PWA] Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
    
    if (outcome === 'accepted') {
      installButton.textContent = '✓ ¡Instalada!';
      setTimeout(() => {
        installButton.style.display = 'none';
      }, 2000);
    }
  } catch (error) {
    console.error('[PWA] Error al mostrar el prompt:', error);
  } finally {
    deferredPrompt = null;
    installButton.style.display = 'none';
  }
});

// Registro del Service Worker (sin cambios)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[PWA] Service Worker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.error('[PWA] Error al registrar Service Worker:', error);
      });
  });
}

// Detección de iOS (para mostrar instrucciones especiales)
if (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
  const iosBanner = document.createElement('div');
  iosBanner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px;
      background: #f8f9fa;
      text-align: center;
      border-top: 1px solid #ddd;
      z-index: 999;
    ">
      <p style="margin: 0;">📱 Para instalar: Toca <strong>Compartir</strong> → <strong>Añadir a Inicio</strong></p>
    </div>
  `;
  document.body.appendChild(iosBanner);
}