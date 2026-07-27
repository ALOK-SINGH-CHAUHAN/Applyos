import { createDbConnection } from '@/utils/DBConnection';
declare global {
    var cachedDrizzle: ReturnType<typeof createDbConnection> | undefined;
}
declare const db: any;
export { db };
