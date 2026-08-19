import apiClient from './apiClient'

const authService = {
  async login(credentials) {
    const response = await apiClient.post('api/auth/login', credentials)
    return response.data
  },

  logout() {
    this.token = null
    this.user = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}

export default authService
