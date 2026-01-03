/**
 * Utility for standardized audit logging across the application.
 * Logs include ISO timestamps and component tags for better traceability.
 */

const getTimestamp = () => new Date().toISOString();

export const logger = {
    info: (tag: string, message: string, data?: any) => {
        const timestamp = getTimestamp();
        console.log(`[${timestamp}] [INFO] [${tag}] ${message}`, data || '');
    },
    
    error: (tag: string, message: string, error?: any) => {
        const timestamp = getTimestamp();
        console.error(`[${timestamp}] [ERROR] [${tag}] ${message}`, error || '');
    },
    
    warn: (tag: string, message: string, data?: any) => {
        const timestamp = getTimestamp();
        console.warn(`[${timestamp}] [WARN] [${tag}] ${message}`, data || '');
    },

    debug: (tag: string, message: string, data?: any) => {
        if (process.env.NODE_ENV === 'development') {
            const timestamp = getTimestamp();
            console.debug(`[${timestamp}] [DEBUG] [${tag}] ${message}`, data || '');
        }
    }
};
