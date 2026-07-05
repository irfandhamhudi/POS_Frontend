import axios from 'axios';

const api = axios.create({
  baseURL: ('https://apipos-production-2204.up.railway.app/'),
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;