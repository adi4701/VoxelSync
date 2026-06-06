import { imageLoader, type Types } from '@cornerstonejs/core';

export function registerVoxelSyncImageLoader() {
  imageLoader.registerImageLoader('voxelsync', loadImage);
}

function loadImage(imageId: string) {
  // imageId format: voxelsync:http://localhost:3001/api/dicom/study-123/frames/0
  const url = imageId.replace('voxelsync:', '');

  const promise = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.statusText}`);
      }

      const rows = parseInt(response.headers.get('X-Dicom-Rows') || '0', 10);
      const columns = parseInt(response.headers.get('X-Dicom-Columns') || '0', 10);
      const bitsAllocated = parseInt(response.headers.get('X-Dicom-Bits-Allocated') || '16', 10);
      const pixelRepresentation = parseInt(response.headers.get('X-Dicom-Pixel-Representation') || '0', 10);
      const windowCenter = parseFloat(response.headers.get('X-Dicom-Window-Center') || '128');
      const windowWidth = parseFloat(response.headers.get('X-Dicom-Window-Width') || '256');

      return response.arrayBuffer().then((buffer) => {
        let pixelData: Uint8Array | Int16Array | Uint16Array;
        let minPixelValue: number;
        let maxPixelValue: number;

        if (bitsAllocated === 8) {
          pixelData = new Uint8Array(buffer);
          minPixelValue = 0;
          maxPixelValue = 255;
        } else if (pixelRepresentation === 1) {
          // Signed 16-bit (CT Hounsfield units typically range -1024 to +3071)
          pixelData = new Int16Array(buffer);
          minPixelValue = -32768;
          maxPixelValue = 32767;
        } else {
          // Unsigned 16-bit
          pixelData = new Uint16Array(buffer);
          minPixelValue = 0;
          maxPixelValue = 65535;
        }

        // Calculate actual data range for better windowing
        if (pixelData.length > 0) {
          let min = pixelData[0]!;
          let max = pixelData[0]!;
          for (let i = 1; i < pixelData.length; i++) {
            const v = pixelData[i]!;
            if (v < min) min = v;
            if (v > max) max = v;
          }
          minPixelValue = min;
          maxPixelValue = max;
        }

        // Use DICOM window/level if provided, otherwise derive from data range
        const wc = windowWidth > 0 ? windowCenter : (minPixelValue + maxPixelValue) / 2;
        const ww = windowWidth > 0 ? windowWidth : (maxPixelValue - minPixelValue);

        const image = {
          imageId,
          minPixelValue,
          maxPixelValue,
          slope: 1.0,
          intercept: 0,
          windowCenter: wc,
          windowWidth: ww,
          getPixelData: () => pixelData,
          rows,
          columns,
          height: rows,
          width: columns,
          color: false,
          columnPixelSpacing: 1.0,
          rowPixelSpacing: 1.0,
          sizeInBytes: pixelData.byteLength,
        };

        return image as unknown as Types.IImage;
      });
    });

  return {
    promise,
    cancelFn: undefined,
  };
}
