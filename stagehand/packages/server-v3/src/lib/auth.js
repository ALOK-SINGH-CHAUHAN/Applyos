export const authMiddleware = async (
// eslint-disable-next-line @typescript-eslint/no-unused-vars
request) => {
    // Authentication is currently disabled; we may re-enable when a real auth backend is wired up.
    return await isAuthenticated();
};
// TODO: Temporarily disable auth until setup in supabase
const isAuthenticated = async () => {
    return true;
};
