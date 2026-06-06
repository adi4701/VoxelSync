import * as dicomParser from 'dicom-parser';
import sharp from 'sharp';
import { DicomMetadata } from '@voxelsync/types';

export class DicomParserService {
  /**
   * Parses a DICOM buffer and extracts metadata
   */
  public extractMetadata(buffer: Buffer): { metadata: DicomMetadata; dataSet: dicomParser.DataSet } {
    const byteArray = new Uint8Array(buffer);
    const dataSet = dicomParser.parseDicom(byteArray);

    const metadata: DicomMetadata = {
      patientName: dataSet.string('x00100010') || 'Unknown',
      patientId: dataSet.string('x00100020') || 'Unknown',
      studyDate: dataSet.string('x00080020') || '',
      studyDescription: dataSet.string('x00081030') || '',
      seriesDescription: dataSet.string('x0008103e') || '',
      modality: dataSet.string('x00080060') || 'OT',
      rows: dataSet.uint16('x00280010') || 0,
      columns: dataSet.uint16('x00280011') || 0,
      bitsAllocated: dataSet.uint16('x00280100') || 16,
      pixelRepresentation: dataSet.uint16('x00280103') || 0, // 0=unsigned, 1=signed
      numberOfFrames: parseInt(dataSet.string('x00280008') || '1', 10),
      windowCenter: parseFloat(dataSet.string('x00281050') || '0'),
      windowWidth: parseFloat(dataSet.string('x00281051') || '0'),
      studyInstanceUid: dataSet.string('x0020000d') || '',
      seriesInstanceUid: dataSet.string('x0020000e') || '',
    };

    return { metadata, dataSet };
  }

  /**
   * Extracts raw binary pixel data without base64 conversion.
   * Returns a Buffer pointing to the exact bytes in the original file (zero-copy).
   */
  public extractPixelData(buffer: Buffer, dataSet: dicomParser.DataSet): Buffer {
    const pixelDataElement = dataSet.elements.x7fe00010;
    if (!pixelDataElement) {
      throw new Error('No pixel data found in DICOM file');
    }

    return buffer.subarray(
      pixelDataElement.dataOffset,
      pixelDataElement.dataOffset + pixelDataElement.length
    );
  }

  /**
   * Renders the first frame of a DICOM file as a JPEG thumbnail (256px wide).
   * Applies a linear window/level mapping before encoding.
   */
  public async renderThumbnail(
    buffer: Buffer,
    pixelDataOffset: number,
    pixelDataLength: number,
    metadata: DicomMetadata
  ): Promise<Buffer> {
    const { rows, columns, bitsAllocated, pixelRepresentation, windowCenter, windowWidth } = metadata;

    // Use the first frame only
    const frameSize = rows * columns * (bitsAllocated / 8);
    const rawSlice = buffer.subarray(pixelDataOffset, pixelDataOffset + Math.min(frameSize, pixelDataLength));

    // Build an 8-bit output buffer by applying window/level mapping
    const out = Buffer.alloc(rows * columns);
    const lower = windowCenter - windowWidth / 2;
    const upper = windowCenter + windowWidth / 2;

    for (let i = 0; i < rows * columns; i++) {
      let value: number;
      if (bitsAllocated === 8) {
        value = rawSlice[i] ?? 0;
      } else {
        const lo = rawSlice[i * 2] ?? 0;
        const hi = rawSlice[i * 2 + 1] ?? 0;
        // Pixel representation 1 = signed two's complement
        const raw = (hi << 8) | lo;
        value = pixelRepresentation === 1 && raw > 0x7fff ? raw - 0x10000 : raw;
      }

      // Linear windowing clamp to [0, 255]
      if (windowWidth > 0) {
        value = Math.round(((value - lower) / (upper - lower)) * 255);
      }
      out[i] = Math.max(0, Math.min(255, value));
    }

    // Use sharp to resize and compress as JPEG
    return sharp(out, { raw: { width: columns, height: rows, channels: 1 } })
      .resize({ width: 256, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}

export const dicomParserService = new DicomParserService();
