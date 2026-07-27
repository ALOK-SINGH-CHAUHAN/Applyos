import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageProvider } from './storage-provider.interface';

export class LocalStorageProvider implements StorageProvider {
  constructor(private basePath: string = '/tmp/autoapply-storage') {}

  private async ensureDir(key: string) {
    const filePath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    return filePath;
  }

  async uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const filePath = await this.ensureDir(key);
    await fs.writeFile(filePath, buffer);
    return this.getPublicUrl(key);
  }

  async getFile(key: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, key);
    return fs.readFile(filePath);
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    await fs.unlink(filePath).catch(() => {});
  }

  getPublicUrl(key: string): string {
    return `/files/${key}`;
  }
}
