const API_URL = '/api';

const tbody = document.getElementById('tbodyEstudiantes');
const inputSearch = document.getElementById('inputSearch');
const selectCurso = document.getElementById('selectCurso');
const selectParalelo = document.getElementById('selectParalelo');
const btnExportar = document.getElementById('btnExportar');
const loadingMsg = document.getElementById('loadingMsg');

let debounceTimer;

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
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No se encontraron estudiantes</td></tr>`;
        } else {
            data.forEach((est, index) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${est.nombres}</td>
                        <td>${est.apellidos}</td>
                        <td>${est.ci || '-'}</td>
                        <td>${est.curso}</td>
                        <td>${est.paralelo}</td>
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

// Initial fetch
fetchEstudiantes();
