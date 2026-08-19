import { apiPrivate } from "./apiClient"

export async function getCars(page = 0, search, active) {
    return await apiPrivate.get('/api/cars/filter', {
        params: { search, active, page }
    });
}

export async function createCar(vehicleData) {
    return await apiPrivate.post('/api/cars', vehicleData)
}

export async function updateCar(id, body) {
    return await apiPrivate.patch(`/api/cars/${id}`, body)
}

export async function deleteCar(id) {
    return await apiPrivate.delete(`/api/cars/${id}`)
}

export async function getVehicleDashboard() {
    let active = true;
    let page = 0;
    let size = 1;
    return await apiPrivate.get('/api/cars/filter', {
        params: { active, page, size }
    });
}