import { apiPublic, apiPrivate } from "./apiClient";

export async function getAddressByCep(cep){
    return await apiPrivate.get('/api/cep/info', {
        params: { cep }
    });
}

export async function createStation(stationData) {
    return await apiPrivate.post('/api/gas-stations', stationData);
}

export async function getStations(page = 0, search, active) {
    return await apiPublic.get('/api/public/gas-stations/filter', {
        params: { search, active, page },
    })
}

export async function updateStation(id, body) {
    return await apiPrivate.put(`/api/gas-stations/${id}`, body);
}

export async function deleteStation(id) {
    return await apiPrivate.delete(`/api/gas-stations/${id}`);
}

export async function getStationDashboard() {
    let active = true;
    let page = 0;
    let size = 1;
    return await apiPublic.get('/api/public/gas-stations/filter', {
        params: { active, page, size },
    })
}
