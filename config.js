// Centralized configuration for the entire application
const isLocal = false; //window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_URL = isLocal ? 'http://localhost:5000' : 'https://api.johnfoxweb.com';
