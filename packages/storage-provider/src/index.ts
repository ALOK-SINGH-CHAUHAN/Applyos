export * from './storage-provider.interface';
export * from './local-storage.provider';
export * from './s3-storage.provider';

import { StorageProvider } from './storage-provider.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

export function createStorageProvider(): StorageProvider {
  if (process.env.STORAGE_PROVIDER === 's3') {
    console.log('[StorageProvider] Initializing production S3StorageProvider...');
    return new S3StorageProvider();
  }
  console.log('[StorageProvider] Initializing development LocalStorageProvider...');
  return new LocalStorageProvider(process.env.LOCAL_STORAGE_PATH || '/tmp/autoapply-storage');
}
