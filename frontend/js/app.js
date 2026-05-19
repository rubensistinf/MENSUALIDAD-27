const API_URL = '/api';

const inputCarnet = document.getElementById('inputCarnet');
const btnBuscarPadre = document.getElementById('btnBuscarPadre');
const inputNombrePadre = document.getElementById('inputNombrePadre');
const padreIdInput = document.getElementById('padreId');

const searchEstudiante = document.getElementById('searchEstudiante');
const resultsEstudiantes = document.getElementById('resultsEstudiantes');
const listaHijosSeleccionados = document.getElementById('listaHijosSeleccionados');

const btnGenerarRecibo = document.getElementById('btnGenerarRecibo');
const btnNuevoRegistro = document.getElementById('btnNuevoRegistro');

let hijosSeleccionados = [];
let debounceTimer;

// Búsqueda de Padre
btnBuscarPadre.addEventListener('click', async () => {
    const carnet = inputCarnet.value.trim();
    if (!carnet) return;

    try {
        const response = await fetchWithAuth(`${API_URL}/padres/${carnet}`);
        if (response.ok) {
            const data = await response.json();
            inputNombrePadre.value = data.nombre_completo;
            padreIdInput.value = data.id;
        } else {
            alert('Padre no encontrado. Puede crear uno nuevo ingresando su nombre.');
            padreIdInput.value = '';
            inputNombrePadre.value = '';
            inputNombrePadre.focus();
        }
    } catch (error) {
        console.error("Error buscando padre:", error);
    }
});

// Búsqueda de Hijos
searchEstudiante.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        const query = searchEstudiante.value.trim();
        if (query.length < 2) {
            resultsEstudiantes.innerHTML = '<p style="color: #aaa; text-align: center;">Escriba al menos 2 letras...</p>';
            return;
        }

        try {
            const response = await fetchWithAuth(`${API_URL}/estudiantes?search=${query}`);
            const data = await response.json();
            
            resultsEstudiantes.innerHTML = '';
            if (data.length === 0) {
                resultsEstudiantes.innerHTML = '<p style="color: #aaa; text-align: center;">No se encontraron estudiantes.</p>';
                return;
            }

            data.forEach(est => {
                const isSelected = hijosSeleccionados.some(h => h.id === est.id);
                const div = document.createElement('div');
                div.style.cssText = `
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 0.5rem; background: rgba(255,255,255,0.05); margin-bottom: 0.5rem; border-radius: 5px;
                `;
                div.innerHTML = `
                    <div>
                        <strong style="color:white;">${est.apellidos} ${est.nombres}</strong><br>
                        <small style="color: #aaa;">${est.curso} - Paralelo ${est.paralelo}</small>
                    </div>
                    <button class="btn ${isSelected ? 'btn-outline' : 'btn-primary'} btn-add" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;" ${isSelected ? 'disabled' : ''}>
                        ${isSelected ? '<i class="fas fa-check"></i>' : '<i class="fas fa-plus"></i>'}
                    </button>
                `;

                div.querySelector('.btn-add').addEventListener('click', () => {
                    if (!isSelected) {
                        hijosSeleccionados.push(est);
                        actualizarCarrito();
                        searchEstudiante.dispatchEvent(new Event('input')); // Refresh
                    }
                });
                
                resultsEstudiantes.appendChild(div);
            });
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    }, 300);
});

function actualizarCarrito() {
    listaHijosSeleccionados.innerHTML = '';
    if (hijosSeleccionados.length === 0) {
        listaHijosSeleccionados.innerHTML = '<li style="color: #888; font-style: italic;">Ninguno seleccionado</li>';
        return;
    }

    hijosSeleccionados.forEach((hijo, index) => {
        const li = document.createElement('li');
        li.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: white;`;
        li.innerHTML = `
            <span>${hijo.apellidos} ${hijo.nombres} <small style="color:#aaa;">(${hijo.curso})</small></span>
            <button class="btn" style="background: transparent; color: #ff4444; padding: 0;" onclick="removerHijo(${index})"><i class="fas fa-times"></i></button>
        `;
        listaHijosSeleccionados.appendChild(li);
    });
}

window.removerHijo = function(index) {
    hijosSeleccionados.splice(index, 1);
    actualizarCarrito();
    searchEstudiante.dispatchEvent(new Event('input')); // Refresh search view
};

// Generar Recibo y Cobrar
btnGenerarRecibo.addEventListener('click', async () => {
    const carnet = inputCarnet.value.trim();
    const nombrePadre = inputNombrePadre.value.trim();
    
    if (!carnet || !nombrePadre) {
        alert("Por favor ingrese el Carnet y Nombre del Padre.");
        return;
    }
    
    if (hijosSeleccionados.length === 0) {
        alert("Por favor seleccione al menos un hijo.");
        return;
    }

    btnGenerarRecibo.disabled = true;
    btnGenerarRecibo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
        let pId = padreIdInput.value;
        
        // Crear padre si no existe
        if (!pId) {
            const pRes = await fetchWithAuth(`${API_URL}/padres`, {
                method: 'POST',
                body: JSON.stringify({ carnet: carnet, nombre_completo: nombrePadre })
            });
            const pData = await pRes.json();
            pId = pData.id;
            padreIdInput.value = pId;
        }

        const payload = {
            padre_id: pId,
            monto: 50.0,
            estudiantes_ids: hijosSeleccionados.map(h => h.id)
        };
        
        let recibo;
        try {
            const rRes = await fetchWithAuth(`${API_URL}/recibos`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            recibo = await rRes.json();
        } catch (e) {
            // Offline fallback
            console.warn("Network error, saving to offline queue");
            await saveToSyncQueue(payload);
            recibo = {
                nro_recibo: "REC-OFFLINE",
                fecha: new Date().toISOString()
            };
            alert("Sin conexión. El recibo se guardó localmente y se sincronizará cuando vuelva el internet.");
        }

        // Preparar vista de impresión
        document.getElementById('printNroRecibo').innerText = recibo.nro_recibo;
        document.getElementById('printNombrePadre').innerText = nombrePadre;
        
        const fechaObj = new Date(recibo.fecha);
        document.getElementById('printFecha').innerText = fechaObj.toLocaleDateString('es-BO');

        const printTbody = document.getElementById('printTbodyHijos');
        printTbody.innerHTML = '';
        
        for (let i = 0; i < 6; i++) {
            const hijo = hijosSeleccionados[i];
            const tr = document.createElement('tr');
            if (hijo) {
                tr.innerHTML = `
                    <td style="border: 1px solid #00B050; padding: 5px; text-align: center;">${i+1}º</td>
                    <td style="border: 1px solid #00B050; padding: 5px;">${hijo.nombres} ${hijo.apellidos}</td>
                    <td style="border: 1px solid #00B050; padding: 5px; text-align: center;">${hijo.ci || '-'}</td>
                    <td style="border: 1px solid #00B050; padding: 5px; text-align: center;">${hijo.curso} "${hijo.paralelo}"</td>
                `;
            } else {
                tr.innerHTML = `
                    <td style="border: 1px solid #00B050; padding: 5px; text-align: center; color: transparent;">-</td>
                    <td style="border: 1px solid #00B050; padding: 5px;"></td>
                    <td style="border: 1px solid #00B050; padding: 5px;"></td>
                    <td style="border: 1px solid #00B050; padding: 5px;"></td>
                `;
            }
            printTbody.appendChild(tr);
        }

        // Imprimir
        window.print();
        
    } catch (error) {
        console.error("Error al procesar pago:", error);
        alert("Ocurrió un error al procesar el pago.");
    } finally {
        btnGenerarRecibo.disabled = false;
        btnGenerarRecibo.innerHTML = '<i class="fas fa-print"></i> Generar y Cobrar';
    }
});

btnNuevoRegistro.addEventListener('click', () => {
    inputCarnet.value = '';
    inputNombrePadre.value = '';
    padreIdInput.value = '';
    searchEstudiante.value = '';
    resultsEstudiantes.innerHTML = '<p style="color: #aaa; text-align: center; margin: 0;">Los resultados aparecerán aquí.</p>';
    hijosSeleccionados = [];
    actualizarCarrito();
});
