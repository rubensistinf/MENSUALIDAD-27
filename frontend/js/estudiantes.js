const API_URL = '/api';

const tbody = document.getElementById('tbodyEstudiantes');
const inputSearch = document.getElementById('inputSearch');
const selectCurso = document.getElementById('selectCurso');
const selectParalelo = document.getElementById('selectParalelo');
const btnExportar = document.getElementById('btnExportar');
const btnVaciarLista = document.getElementById('btnVaciarLista');
const loadingMsg = document.getElementById('loadingMsg');

let debounceTimer;
const currentRol = localStorage.getItem('rol');

if (currentRol === 'admin') {
    btnVaciarLista.style.display = 'block';
    document.querySelector('.col-acciones').style.display = 'table-cell';
}

async function fetchEstudiantes() {
    loadingMsg.style.display = 'block';
    tbody.innerHTML = '';
    
    let url = new URL(`${API_URL}/estudiantes`, window.location.origin);
    if (inputSearch.value) url.searchParams.append('search', inputSearch.value);
    if (selectCurso.value) url.searchParams.append('curso', selectCurso.value);
    if (selectParalelo.value) url.searchParams.append('paralelo', selectParalelo.value);

    try {
        const response = await fetchWithAuth(url);
        const data = await response.json();
        
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${currentRol === 'admin' ? 7 : 6}" style="text-align: center;">No se encontraron estudiantes</td></tr>`;
        } else {
            data.forEach((est, index) => {
                let accionesHtml = '';
                if (currentRol === 'admin') {
                    accionesHtml = `
                        <td>
                            <button class="btn" style="background: #ff4444; color: white; padding: 4px 8px;" onclick="deleteEstudiante(${est.id}, '${est.nombres} ${est.apellidos}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                }

                tbody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${est.nombres}</td>
                        <td>${est.apellidos}</td>
                        <td>${est.ci || '-'}</td>
                        <td>${est.curso}</td>
                        <td>${est.paralelo}</td>
                        ${accionesHtml}
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Error fetching students:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error al conectar con el servidor</td></tr>`;
    } finally {
        loadingMsg.style.display = 'none';
    }
}

function handleFilterChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchEstudiantes, 300);
}

inputSearch.addEventListener('input', handleFilterChange);
selectCurso.addEventListener('change', handleFilterChange);
selectParalelo.addEventListener('change', handleFilterChange);

btnExportar.addEventListener('click', async () => {
    let url = new URL(`${API_URL}/estudiantes/exportar`, window.location.origin);
    if (selectCurso.value) url.searchParams.append('curso', selectCurso.value);
    if (selectParalelo.value) url.searchParams.append('paralelo', selectParalelo.value);
    
    try {
        const response = await fetchWithAuth(url);
        if (!response.ok) throw new Error("Error en descarga");
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = 'Lista_Inscritos_27_de_Mayo.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error(error);
        alert("Error al descargar el Excel");
    }
});

// --- ELIMINAR ESTUDIANTE (Solo Admin) ---
window.deleteEstudiante = async function(id, nombre) {
    if (!confirm(`¿Está seguro que desea eliminar a ${nombre}?`)) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/estudiantes/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert("Estudiante eliminado correctamente.");
            fetchEstudiantes(); // recargar lista
        } else {
            const data = await response.json();
            alert(data.detail || "Error al eliminar el estudiante.");
        }
    } catch (error) {
        console.error("Error deleting student:", error);
        alert("Error de conexión al eliminar.");
    }
};

// --- VACIAR LISTA (Solo Admin, con doble confirmación) ---
btnVaciarLista.addEventListener('click', async () => {
    const confirmation = prompt('PELIGRO: Esto eliminará a TODOS los estudiantes del sistema.\nEscriba la palabra CONFIRMAR (en mayúsculas) para continuar:');
    
    if (confirmation === 'CONFIRMAR') {
        try {
            btnVaciarLista.disabled = true;
            btnVaciarLista.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vaciando...';
            
            const response = await fetchWithAuth(`${API_URL}/estudiantes`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert("¡Todos los estudiantes han sido eliminados del sistema!");
                fetchEstudiantes(); // recargar lista
            } else {
                const data = await response.json();
                alert(data.detail || "Error al vaciar la lista.");
            }
        } catch (error) {
            console.error("Error vaciando lista:", error);
            alert("Error de conexión al vaciar la lista.");
        } finally {
            btnVaciarLista.disabled = false;
            btnVaciarLista.innerHTML = '<i class="fas fa-trash-alt"></i> Vaciar Año Escolar';
        }
    } else if (confirmation !== null) {
        alert("Operación cancelada. La palabra no coincide.");
    }
});

// Initial fetch
fetchEstudiantes();
