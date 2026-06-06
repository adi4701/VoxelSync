import { DicomMetadata } from '@voxelsync/types';
import { v4 as uuidv4 } from 'uuid';

export interface StoredStudy {
  studyId: string;
  metadata: DicomMetadata;
  buffer: Buffer;
  pixelDataOffset: number;
  pixelDataLength: number;
  createdAt: number;
}

class StudyStoreService {
  private cache = new Map<string, StoredStudy>();
  private readonly MAX_CACHE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

  public store(buffer: Buffer, metadata: DicomMetadata, pixelDataOffset: number, pixelDataLength: number): string {
    this.evictIfNecessary(buffer.length);
    
    const studyId = uuidv4();
    this.cache.set(studyId, {
      studyId,
      metadata,
      buffer,
      pixelDataOffset,
      pixelDataLength,
      createdAt: Date.now(),
    });
    
    return studyId;
  }

  public get(studyId: string): StoredStudy | undefined {
    return this.cache.get(studyId);
  }

  private evictIfNecessary(incomingSize: number) {
    let currentSize = Array.from(this.cache.values()).reduce((acc, curr) => acc + curr.buffer.length, 0);
    
    if (currentSize + incomingSize > this.MAX_CACHE_SIZE_BYTES) {
      // Sort by oldest first
      const sortedStudies = Array.from(this.cache.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt);
      
      for (const [id, study] of sortedStudies) {
        if (currentSize + incomingSize <= this.MAX_CACHE_SIZE_BYTES) {
          break;
        }
        this.cache.delete(id);
        currentSize -= study.buffer.length;
      }
    }
  }
}

export const studyStoreService = new StudyStoreService();
