export interface StorageProvider {
    uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string>;
    getFile(key: string): Promise<Buffer>;
    deleteFile(key: string): Promise<void>;
    getPublicUrl(key: string): string;
}
