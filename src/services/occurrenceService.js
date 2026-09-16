import { apiPublic, apiPrivate } from "./apiClient"

export async function createOccurrences(occurrencesData) {
    return await apiPublic.post('/api/public/incident', occurrencesData);
}

export async function getOccurrences(page = 0, title) {
    return await apiPrivate.get('/api/incidents', {
        params: { title, page },
    });
}

export async function getDashboardOccurrences() {
    return await apiPrivate.get('/api/incidents/dashboard')
}
