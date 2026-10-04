import { apiPrivate } from "./apiClient";

export async function getAddressByCep(cep){
    return await apiPrivate.get('/api/cep/info', {
        params: { cep }
    });
}

export async function createStation(stationData) {
    return await apiPrivate.post('/api/gas-stations', stationData);
}

export async function getStations(page = 0, search, active) {
    return await apiPrivate.get('/api/public/gas-stations/filter', {
        params: { search, active, page },
    })
}

export async function updateStation(id, body) {
    return await apiPrivate.put(`/api/gas-stations/${id}`, body);
}

export async function deleteStation(id) {
    return await apiPrivate.delete(`/api/gas-stations/${id}`);
}

// Prévia da importação: o backend lê a planilha e devolve o que mudaria, sem
// gravar nada. Sem Content-Type manual: com FormData o Axios gera o boundary.
export async function previewImport(arquivo) {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return await apiPrivate.post('/api/gas-stations/import/preview', formData);
}

// Inicia a importação em segundo plano. O backend relê a planilha e recalcula o
// plano; responde 202 { id } e o andamento sai de getImportStatus.
export async function startImport(arquivo) {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return await apiPrivate.post('/api/gas-stations/import', formData);
}

export async function getImportStatus(id) {
    return await apiPrivate.get(`/api/gas-stations/import/${id}`);
}

// Importação EM_ANDAMENTO, se houver. Devolve o corpo, e null no 204 — é o que
// o dialog usa para decidir entre retomar o acompanhamento e abrir a seleção.
export async function getCurrentImport() {
    const response = await apiPrivate.get('/api/gas-stations/import/atual');
    return response.status === 204 ? null : response.data;
}

export async function getStationDashboard() {
    let active = true;
    let page = 0;
    let size = 1;
    return await apiPrivate.get('/api/public/gas-stations/filter', {
        params: { active, page, size },
    })
}
