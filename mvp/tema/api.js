// Helper simples para chamadas à API com Authorization Bearer
function getAuthToken() {
    return localStorage.getItem('authToken');
}

async function fetchWithAuth(path, options = {}) {
    const headers = options.headers || {};
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    const token = getAuthToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(path, { ...options, headers });
    let body = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        body = await res.json();
    } else {
        body = await res.text();
    }

    if (!res.ok) {
        const err = new Error(body && body.error ? body.error : 'API error');
        err.status = res.status;
        err.body = body;
        throw err;
    }

    return body;
}

// Export to global (non-module) environment
window.api = {
    getAuthToken,
    fetchWithAuth
};
