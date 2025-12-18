// API Base Configuration
const VENDOR_API_BASE_URL = 'https://opt2dealapi.opt2deal.com'; 

const API_CONFIG = {
    VENDOR_API_BASE_URL: VENDOR_API_BASE_URL,  // Base URLs 
    MATCHING_API_URL: `${VENDOR_API_BASE_URL}/api/matching/customer-requests/all`, // Matching & Request APIs  
    
    // N8N Webhook URLs  
    N8N_WEBHOOK_URL: 'https://n8n.avertisystems.com/webhook-test/send-vendor-rfq',
    N8N_CUSTOMER_OFFER_URL: 'https://n8n.avertisystems.com/webhook-test/send-customer-offer',
    ITEMS_PER_PAGE: 50,

    // 1. Vendor Search API 
    // Full URL: https://opt2dealapi.opt2deal.com/api/matching/search?itemDescription=...
    VENDOR_SEARCH_ENDPOINT: '/api/matching/search',
    
    // 2. API Endpoints for CRM/Database
    API_ENDPOINTS: {
        ALL_PRODUCTS: `${VENDOR_API_BASE_URL}/api/products/`, 
        UPLOAD_CSV: `${VENDOR_API_BASE_URL}/api/products/upload-csv`,
    },

    // 📢 NOTE: VENDOR_SEARCH_API_URL is deprecated. Use VENDOR_SEARCH_ENDPOINT instead.
    // VENDOR_SEARCH_API_URL: 'https://opt2dealapi.opt2deal.com/api/matching/search?itemDescription=',
};

// Helper function to handle null/undefined/empty string gracefully
export const safeValue = (value) => (value === null || value === undefined || value === '') ? '—' : value;

// Helper function to safely get field values using multiple possible keys
export const getFieldValue = (vendor, ...keys) => {
    for (const key of keys) {
        if (vendor[key] !== undefined && vendor[key] !== null && vendor[key] !== '') {
            return vendor[key];
        }
    }
    return 'N/A';
};
export default API_CONFIG;