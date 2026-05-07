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

/**
 * Compresses and optionally resizes an image on the fly.
 * @param {string} srcUrl - Blob URL or Data URL of the source image
 * @param {number} quality - JPEG quality from 0.0 to 1.0
 * @param {number|null} maxDimension - Max width or height (aspect ratio is preserved)
 * @returns {Promise<{blob: Blob, width: number, height: number}>}
 */
export const compressImage = (srcUrl, quality = 0.8, maxDimension = null) => {
  return new Promise((resolve, reject) => {
    const imgObj = new Image();
    imgObj.src = srcUrl;
    imgObj.onload = () => {
      let width = imgObj.naturalWidth;
      let height = imgObj.naturalHeight;

      if (maxDimension && (width > maxDimension || height > maxDimension)) {
        const ratio = width / height;
        if (width > height) {
          width = maxDimension;
          height = Math.round(width / ratio);
        } else {
          height = maxDimension;
          width = Math.round(height * ratio);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Draw and apply compression
      ctx.drawImage(imgObj, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Image compression failed'));
        resolve({
          blob: blob,
          width: width,
          height: height
        });
      }, 'image/jpeg', quality);
    };
    imgObj.onerror = (err) => reject(new Error('Failed to load image for compression: ' + err.message));
  });
};

/**
 * Physically rotates an image's pixel grid on an offscreen canvas by a multiple of 90 degrees.
 * Returns a new blob and rotated dimensions.
 * @param {string} srcUrl
 * @param {number} rotationAngle - 0, 90, 180, or 270
 * @returns {Promise<{blob: Blob, width: number, height: number}>}
 */
export const rotateImageAtResolution = (srcUrl, rotationAngle) => {
  return new Promise((resolve, reject) => {
    if (!rotationAngle || rotationAngle % 360 === 0) {
      // No rotation needed, return a clean load
      const imgObj = new Image();
      imgObj.src = srcUrl;
      imgObj.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imgObj.naturalWidth;
        canvas.height = imgObj.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgObj, 0, 0);
        canvas.toBlob((blob) => {
          resolve({ blob, width: imgObj.naturalWidth, height: imgObj.naturalHeight });
        }, 'image/png');
      };
      imgObj.onerror = reject;
      return;
    }

    const imgObj = new Image();
    imgObj.src = srcUrl;
    imgObj.onload = () => {
      const angleRad = (rotationAngle * Math.PI) / 180;
      const is90or270 = rotationAngle === 90 || rotationAngle === 270;
      
      const canvas = document.createElement('canvas');
      const width = is90or270 ? imgObj.naturalHeight : imgObj.naturalWidth;
      const height = is90or270 ? imgObj.naturalWidth : imgObj.naturalHeight;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angleRad);
      ctx.drawImage(imgObj, -imgObj.naturalWidth / 2, -imgObj.naturalHeight / 2);
      
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to rotate image pixels'));
        resolve({
          blob: blob,
          width: width,
          height: height
        });
      }, 'image/png');
    };
    imgObj.onerror = reject;
  });
};

/**
 * Applies native hardware-accelerated filters to an image using offscreen canvas.
 * @param {string} srcUrl
 * @param {string} filterType - 'original', 'doc', 'enhance', or 'grayscale'
 * @returns {Promise<Blob>}
 */
export const applyScannerFilterToImage = (srcUrl, filterType) => {
  return new Promise((resolve, reject) => {
    if (!filterType || filterType === 'original') {
      fetch(srcUrl).then(res => res.blob()).then(resolve).catch(reject);
      return;
    }

    const imgObj = new Image();
    imgObj.src = srcUrl;
    imgObj.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = imgObj.naturalWidth;
      canvas.height = imgObj.naturalHeight;
      const ctx = canvas.getContext('2d');

      // Map filter key to Canvas API Filter string
      let filterString = 'none';
      if (filterType === 'doc') {
        filterString = 'contrast(1.45) brightness(1.1) grayscale(1)';
      } else if (filterType === 'enhance') {
        filterString = 'contrast(1.25) saturate(1.3) brightness(1.05)';
      } else if (filterType === 'grayscale') {
        filterString = 'grayscale(1)';
      }

      ctx.filter = filterString;
      ctx.drawImage(imgObj, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to apply filter to image'));
        resolve(blob);
      }, 'image/png');
    };
    imgObj.onerror = reject;
  });
};
