
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    // Handle void responses or empty bodies
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
        throw new Error(data.error || `API Error: ${res.status} ${res.statusText}`);
    }
    return data;
}

export async function uploadApi(endpoint: string, file: File, body: any = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(body).forEach(([key, value]) => {
        formData.append(key, String(value));
    });

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
}
