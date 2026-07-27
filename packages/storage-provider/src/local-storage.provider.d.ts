import { StorageProvider } from './storage-provider.interface';
export declare class LocalStorageProvider implements StorageProvider {
    private basePath;
    constructor(basePath?: string);
    private ensureDir;
    uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string>;
    getFile(key: string): Promise<Buffer>;
    deleteFile(key: string): Promise<void>;
    getPublicUrl(key: string): string;
}
