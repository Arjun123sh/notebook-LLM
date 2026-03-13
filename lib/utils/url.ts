export function getAppUrl() {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return process.env.APP_URL || 'http://localhost:3000';
}
