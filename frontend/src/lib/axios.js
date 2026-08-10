const axios = require('axios');

const BASE = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || '/api';

const instance = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

module.exports = instance;
