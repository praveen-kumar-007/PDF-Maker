/**
 * AeroPDF Image & Utility Helpers
 */

/**
 * Formats a raw number of bytes into a human-readable size string.
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Convert standard file objects or canvas data to a raw binary Uint8Array stream on the fly.
 * Handles fallbacks for progressive JPEGs, TIFFs, WebPs, etc., to make them pdf-lib safe.
 * @param {string} srcUrl 
 * @param {boolean} isPng 
 * @returns {Promise<Uint8Array>}
 */
export const convertImageToCompatibleBytes = (srcUrl, isPng) => {
  return new Promise((resolve, reject) => {
    const imgObj = new Image();
    imgObj.crossOrigin = 'anonymous';
    imgObj.src = srcUrl;
    imgObj.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = imgObj.naturalWidth;
      canvas.height = imgObj.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgObj, 0, 0);
      
      const mimeType = 'image/png';
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas compilation failed'));
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(new Uint8Array(reader.result));
        };
        reader.readAsArrayBuffer(blob);
      }, mimeType);
    };
    imgObj.onerror = reject;
  });
};

/**
 * Executes a 100% lossless crop slice using an offscreen canvas at full pixel density.
 * @param {string} srcUrl 
 * @param {object} cropBox - coordinates as percentages { x, y, width, height }
 * @param {string} fileType - image/png or image/jpeg
 * @returns {Promise<{blob: Blob, width: number, height: number}>}
 */
export const cropImageAtResolution = (srcUrl, cropBox, fileType) => {
  return new Promise((resolve, reject) => {
    const imgObj = new Image();
    imgObj.src = srcUrl;
    imgObj.onload = () => {
      const naturalWidth = imgObj.naturalWidth;
      const naturalHeight = imgObj.naturalHeight;

      // Map percentages to raw original physical pixel bounds
      const pxX = (cropBox.x / 100) * naturalWidth;
      const pxY = (cropBox.y / 100) * naturalHeight;
      const pxW = (cropBox.width / 100) * naturalWidth;
      const pxH = (cropBox.height / 100) * naturalHeight;

      if (pxW < 1 || pxH < 1) {
        return reject(new Error('Crop selection is too small.'));
      }

      const canvas = document.createElement('canvas');
      canvas.width = pxW;
      canvas.height = pxH;
      const ctx = canvas.getContext('2d');

      // Zero-loss slicing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgObj, pxX, pxY, pxW, pxH, 0, 0, pxW, pxH);

      const mimeType = 'image/png';

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to capture cropped pixels'));
        resolve({
          blob: blob,
          width: Math.round(pxW),
          height: Math.round(pxH)
        });
      }, mimeType);
    };
    imgObj.onerror = reject;
  });
};
