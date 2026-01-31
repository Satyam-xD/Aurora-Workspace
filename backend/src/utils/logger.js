// Debug logger utility for backend
// Set DEBUG=true in .env to enable console logs in production

const isDevelopment = process.env.NODE_ENV !== 'production';
const isDebugEnabled = process.env.DEBUG === 'true';

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
