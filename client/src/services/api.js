// client/src/services/api.js
// Single axios instance with sensible defaults.

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || '/api';

export const api = axios.create({
  baseURL,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

// Phones
export const fetchPhones = (params = {}) => api.get('/phones', { params }).then((r) => r.data);
export const fetchFeatured = () => api.get('/phones/featured').then((r) => r.data);
export const fetchBrands = () => api.get('/phones/brands').then((r) => r.data);
export const fetchPhone = (slug) => api.get(`/phones/${slug}`).then((r) => r.data);

// Branches
export const fetchBranches = (city) =>
  api.get('/branches', { params: city ? { city } : {} }).then((r) => r.data);

// Contact
export const submitContact = (payload) => api.post('/contact', payload).then((r) => r.data);

// Chatbot
export const sendChat = (messages, preferences = {}) =>
  api.post('/chatbot/message', { messages, preferences }).then((r) => {
    return r.data;
  });
