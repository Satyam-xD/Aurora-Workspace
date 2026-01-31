// Debug logger utility
// Set DEBUG=true in .env to enable console logs in production

const isDevelopment = import.meta.env.MODE === 'development';
const isDebugEnabled = import.meta.env.VITE_DEBUG === 'true';

export const logger = {
    log: (...args) => {
        if (isDevelopment || isDebugEnabled) {
            console.log(...args);
        }
    },
    error: (...args) => {
        // Always log errors
        console.error(...args);
    },
    warn: (...args) => {
        if (isDevelopment || isDebugEnabled) {
            console.warn(...args);
        }
    },
    info: (...args) => {
        if (isDevelopment || isDebugEnabled) {
            console.info(...args);
        }
    }
};
