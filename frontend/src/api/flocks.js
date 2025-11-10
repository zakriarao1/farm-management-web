const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5000/api'
  : '/.netlify/functions';

export const flocksAPI = {
  async getAll() {
    const response = await fetch(`\${API_BASE_URL}/flocks`);
    return response.json();
  },
  
  async create(flockData) {
    const response = await fetch(`\${API_BASE_URL}/flocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flockData)
    });
    return response.json();
  },
  
  async getById(id) {
    const response = await fetch(`\${API_BASE_URL}/flocks/\${id}`);
    return response.json();
  }
};
