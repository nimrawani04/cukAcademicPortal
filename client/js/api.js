/**
 * API Configuration - SIMPLIFIED & DEBUGGED
 * Academic Management Portal
 */

console.log('🚀 API SCRIPT LOADING...');

// Simple API Base URL
const API_BASE_URL = "http://localhost:5001";
console.log('🌐 API Base URL set to:', API_BASE_URL);

/**
 * Simple API request function
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🌐 Making API request to:', url);
    
    try {
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        console.log('📥 API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📄 API Response data:', data);
        
        return { response, data };
    } catch (error) {
        console.error('💥 API Error:', error);
        throw error;
    }
}

/**
 * Simple authentication API
 */
const authAPI = {
    // Register new user
    async register(userData) {
        console.log('📝 Registration API call');
        return apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    // Login user
    async login(credentials) {
        console.log('🔐 Login API call');
        return apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },
    
    // Health check
    async health() {
        console.log('🏥 Health check API call');
        return apiRequest('/api/health');
    }
};

// Make available globally
window.authAPI = authAPI;
window.API_BASE_URL = API_BASE_URL;

console.log('✅ API SCRIPT LOADED - authAPI available globally');

// Simple connection test
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 API Script - DOM loaded, testing connection...');
    
    try {
        const { data } = await authAPI.health();
        console.log('✅ Backend connection successful:', data.message);
    } catch (error) {
        console.error('❌ Backend connection failed:', error.message);
    }
});