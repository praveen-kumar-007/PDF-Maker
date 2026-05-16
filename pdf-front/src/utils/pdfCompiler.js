import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { convertImageToCompatibleBytes, compressImage, compressImageToTargetSize, rotateImageAtResolution, applyScannerFilterToImage } from './imageHelpers';

/**
 * Advanced, premium client-side PDF document builder
 * @param {Array} images - list of queue items (images or PDF pages)
 * @param {object} settings - configuration settings
 * @param {string} settings.pageSizeSetting - 'original', 'a4', or 'letter'
 * @param {string} settings.marginSetting - 'none', 'thin', or 'standard'
 * @param {string} settings.qualitySetting - 'original', 'balanced', or 'compact'
 * @param {string} settings.watermarkText - custom watermark text
 * @param {string} settings.watermarkColor - hex color of watermark (e.g. '#ff0000')
 * @param {number} settings.watermarkOpacity - opacity of watermark (0.1 - 1.0)
 * @param {number} settings.watermarkSize - font size of watermark
 * @param {boolean} settings.addPageNumbers - whether to add page numbers
 * @param {string} settings.pageNumberPosition - 'left', 'center', 'right', 'top-right'
 * @param {string} settings.pdfPassword - password protection string
 * @param {Function} setStep - state hook to display status
 * @returns {Promise<void>}
 */
export const generateClientPDF = async (images, settings, setStep, onProgress) => {
  const {
    pageSizeSetting = 'original',
    marginSetting = 'standard',
    compressionMode = 'original',
    targetSizeMB = 0.5,
    compressionPercent = 50,
    watermarkText = '',
    watermarkColor = '#e0e0e0',
    watermarkOpacity = 0.3,
    watermarkSize = 48,
    addPageNumbers = false,
    pageNumberPosition = 'center',
    pdfPassword = ''
  } = settings;

  const updateProgress = (pct, step, friendly) => {
    if (typeof setStep === 'function') setStep(step);
    if (typeof onProgress === 'function') onProgress(pct, friendly);
  };

  updateProgress(2, 'Initializing high-fidelity PDF canvas...', 'Preparing document templates...');
  const pdfDoc = await PDFDocument.create();

  const N = images.length;
  for (let i = 0; i < N; i++) {
    const img = images[i];
    const baseline = 5 + (i / N) * 80;
    const size = 80 / N;
    const srcUrl = img.croppedUrl || img.previewUrl;

    updateProgress(
      Math.round(baseline),
      `Processing Page ${i + 1} of ${N}: [${img.name}]...`,
      `Adding page ${i + 1} of ${N} to your document...`
    );

    if (img.isPdfPage) {
      // 1. Existing PDF page insertion
      try {
        updateProgress(
          Math.round(baseline + size * 0.4),
          `Extracting page ${img.pageIndex + 1} from PDF [${img.name}]...`,
          `Reading page ${img.pageIndex + 1} of your imported PDF...`
        );
        const srcPdfDoc = await PDFDocument.load(img.pdfSource);
        
        if (pageSizeSetting === 'original') {
          // Lossless transfer of page
          const [copiedPage] = await pdfDoc.copyPages(srcPdfDoc, [img.pageIndex]);
          
          // Apply rotation
          const currentRotation = copiedPage.getRotation().angle;
          const userRotation = img.rotation || 0;
          copiedPage.setRotation(degrees((currentRotation + userRotation) % 360));
          
          pdfDoc.addPage(copiedPage);
        } else {
          // Standard size wrapper (embed page as graphics vector)
          const [tempPage] = await pdfDoc.copyPages(srcPdfDoc, [img.pageIndex]);
          const embeddedPage = await pdfDoc.embedPage(tempPage);

          let baseWidth = 595.27;  // A4 Width
          let baseHeight = 841.89; // A4 Height

          if (pageSizeSetting === 'letter') {
            baseWidth = 612.0;   // US Letter Width
            baseHeight = 792.0;  // US Letter Height
          }

          // Dynamic orientation match
          const isLandscape = embeddedPage.width > embeddedPage.height;
          const targetWidth = isLandscape ? baseHeight : baseWidth;
          const targetHeight = isLandscape ? baseWidth : baseHeight;

          let margin = 20;
          if (marginSetting === 'none') margin = 0;
          else if (marginSetting === 'thin') margin = 10;

          const maxWidth = targetWidth - (margin * 2);
          const maxHeight = targetHeight - (margin * 2);

          let drawWidth = embeddedPage.width;
          let drawHeight = embeddedPage.height;
          const ratio = drawWidth / drawHeight;

          if (drawWidth > maxWidth) {
            drawWidth = maxWidth;
            drawHeight = drawWidth / ratio;
          }

          if (drawHeight > maxHeight) {
            drawHeight = maxHeight;
            drawWidth = drawHeight * ratio;
          }

          const xOffset = margin + (maxWidth - drawWidth) / 2;
          const yOffset = margin + (maxHeight - drawHeight) / 2;

          const newPage = pdfDoc.addPage([targetWidth, targetHeight]);
          newPage.drawPage(embeddedPage, {
            x: xOffset,
            y: yOffset,
            width: drawWidth,
            height: drawHeight
          });

          // Rotate page
          if (img.rotation) {
            const currentRotation = tempPage.getRotation().angle;
            newPage.setRotation(degrees((currentRotation + img.rotation) % 360));
          }
        }
      } catch (pdfPageErr) {
        console.error('Error copying PDF page:', pdfPageErr);
        throw new Error(`Failed to extract page ${img.pageIndex + 1} from ${img.name}: ${pdfPageErr.message}`);
      }
    } else {
      // 2. Image page insertion
      let isPng = img.croppedUrl ? true : img.type.toLowerCase().includes('png');
      let pdfImage;
      let finalWidth = img.width;
      let finalHeight = img.height;

      let compileUrl = srcUrl;
      let createdRotatedUrl = null;
      let filterAppliedUrl = null;

      // Apply scanner filters (e.g. Doc Scan, Vivid, Mono) if configured
      if (img.filter && img.filter !== 'original') {
        try {
          updateProgress(
            Math.round(baseline + size * 0.15),
            `Applying scanner filter "${img.filter}" to page ${i + 1}...`,
            `Enhancing details for page ${i + 1}...`
          );
          const filterBlob = await applyScannerFilterToImage(compileUrl, img.filter);
          filterAppliedUrl = URL.createObjectURL(filterBlob);
          compileUrl = filterAppliedUrl;
          isPng = true; // Scanner filter outputs PNG
        } catch (filterErr) {
          console.error('Failed to apply scanner filter during compilation:', filterErr);
        }
      }

      // Physically rotate image pixels if there is user rotation
      if (img.rotation && img.rotation % 360 !== 0) {
        try {
          updateProgress(
            Math.round(baseline + size * 0.35),
            `Physically rotating page ${i + 1} (${img.rotation}°)...`,
            `Aligning and adjusting rotation for page ${i + 1}...`
          );
          const rotated = await rotateImageAtResolution(compileUrl, img.rotation);
          createdRotatedUrl = URL.createObjectURL(rotated.blob);
          compileUrl = createdRotatedUrl;
          finalWidth = rotated.width;
          finalHeight = rotated.height;
          isPng = true; // Rotation outputs PNG
        } catch (rotErr) {
          console.error('Physical rotation failed, falling back to upright:', rotErr);
        }
      }

      // Handle compression / optimization settings
      if (compressionMode !== 'original') {
        try {
          let compressed;
          if (compressionMode === 'target-size') {
            // Target overall PDF size of targetSizeMB
            // Subtract structural overhead estimated at 25KB
            const sizeLimit = targetSizeMB ? Number(targetSizeMB) : 0.5;
            const totalTargetBytes = Math.max(10000, (sizeLimit * 1024 * 1024) - 25000);
            const targetBytesPerImage = Math.max(5000, Math.round(totalTargetBytes / N));

            updateProgress(
              Math.round(baseline + size * 0.5),
              `Compressing page ${i + 1} to hit target limit (${Math.round(targetBytesPerImage / 1024)} KB)...`,
              `Optimizing image size to match your ${sizeLimit} MB target...`
            );

            compressed = await compressImageToTargetSize(compileUrl, targetBytesPerImage);
          } else {
            // Percentage-based compression (compressionPercent is between 10 and 100)
            const pct = compressionPercent / 100;
            const quality = Math.max(0.08, Math.min(0.95, pct));
            const scale = Math.max(0.4, Math.min(1.0, 0.35 + 0.65 * pct));
            const maxDim = scale < 1.0 ? Math.round(Math.max(600, 3000 * scale)) : null;

            updateProgress(
              Math.round(baseline + size * 0.5),
              `Compressing page ${i + 1} with custom level of ${compressionPercent}%...`,
              `Applying custom resolution compression to page ${i + 1}...`
            );

            compressed = await compressImage(compileUrl, quality, maxDim);
          }

          if (compressed) {
            const arrayBuffer = await compressed.blob.arrayBuffer();
            const imageBytes = new Uint8Array(arrayBuffer);

            pdfImage = await pdfDoc.embedJpg(imageBytes);
            finalWidth = compressed.width;
            finalHeight = compressed.height;
          }
        } catch (compErr) {
          console.warn('Canvas compression failed, falling back to original quality:', compErr);
        }
      }

      // Always normalize images through canvas to ensure EXIF orientation is baked into pixels
      if (!pdfImage) {
        updateProgress(
          Math.round(baseline + size * 0.8),
          `Standardizing raw bytes for [${img.name}]...`,
          `Optimizing image data for page ${i + 1}...`
        );
        try {
          const fallbackBytes = await convertImageToCompatibleBytes(compileUrl, isPng);
          pdfImage = isPng ? await pdfDoc.embedPng(fallbackBytes) : await pdfDoc.embedJpg(fallbackBytes);
        } catch (embedError) {
          console.error('Failed to embed image:', embedError);
          throw new Error(`Failed to process image data for ${img.name}`);
        }
      }

      if (pageSizeSetting === 'original') {
        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfImage.width,
          height: pdfImage.height
        });
      } else {
        let baseWidth = 595.27;  // A4 Width
        let baseHeight = 841.89; // A4 Height

        if (pageSizeSetting === 'letter') {
          baseWidth = 612.0;   // US Letter Width
          baseHeight = 792.0;  // US Letter Height
        }

        const isLandscapeImage = pdfImage.width > pdfImage.height;
        const targetWidth = isLandscapeImage ? baseHeight : baseWidth;
        const targetHeight = isLandscapeImage ? baseWidth : baseHeight;

        let margin = 20;
        if (marginSetting === 'none') margin = 0;
        else if (marginSetting === 'thin') margin = 10;

        const maxWidth = targetWidth - (margin * 2);
        const maxHeight = targetHeight - (margin * 2);

        let drawWidth = pdfImage.width;
        let drawHeight = pdfImage.height;
        const ratio = drawWidth / drawHeight;

        if (drawWidth > maxWidth) {
          drawWidth = maxWidth;
          drawHeight = drawWidth / ratio;
        }

        if (drawHeight > maxHeight) {
          drawHeight = maxHeight;
          drawWidth = drawHeight * ratio;
        }

        const xOffset = margin + (maxWidth - drawWidth) / 2;
        const yOffset = margin + (maxHeight - drawHeight) / 2;

        const page = pdfDoc.addPage([targetWidth, targetHeight]);
        page.drawImage(pdfImage, {
          x: xOffset,
          y: yOffset,
          width: drawWidth,
          height: drawHeight
        });
      }

      // Revoke temporary rotated or filtered Blob URLs to prevent memory leakage
      if (createdRotatedUrl) {
        URL.revokeObjectURL(createdRotatedUrl);
      }
      if (filterAppliedUrl) {
        URL.revokeObjectURL(filterAppliedUrl);
      }
    }
  }

  const pages = pdfDoc.getPages();

  // 3. Add Custom Diagonal Watermarks (if configured)
  if (watermarkText && watermarkText.trim() !== '') {
    updateProgress(88, 'Injecting custom security watermarks...', 'Adding your custom watermark security layer...');
    const watermarkFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Parse color hex to rgb decimal
    const hex = watermarkColor.startsWith('#') ? watermarkColor : '#e0e0e0';
    const r = parseInt(hex.slice(1, 3), 16) / 255 || 0.8;
    const g = parseInt(hex.slice(3, 5), 16) / 255 || 0.8;
    const b = parseInt(hex.slice(5, 7), 16) / 255 || 0.8;

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = watermarkFont.widthOfTextAtSize(watermarkText, watermarkSize);
      const textHeight = watermarkFont.heightAtSize(watermarkSize);
      
      // Calculate coordinates to draw text rotated 45 degrees exactly at center of page
      const x = width / 2 - (Math.cos(Math.PI / 4) * textWidth / 2 - Math.sin(Math.PI / 4) * textHeight / 2);
      const y = height / 2 - (Math.sin(Math.PI / 4) * textWidth / 2 + Math.cos(Math.PI / 4) * textHeight / 2);

      page.drawText(watermarkText, {
        x: x,
        y: y,
        size: watermarkSize,
        font: watermarkFont,
        color: rgb(r, g, b),
        opacity: Number(watermarkOpacity),
        rotate: degrees(45)
      });
    }
  }

  // 4. Add Automatic Page Numbering (if configured)
  if (addPageNumbers) {
    updateProgress(92, 'Stamping page indexing metadata...', 'Stamping page numbers neatly...');
    const numFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      const text = `Page ${i + 1} of ${totalPages}`;
      const textWidth = numFont.widthOfTextAtSize(text, 9);
      
      let x = width / 2 - textWidth / 2; // Default bottom-center
      let y = 25;

      if (pageNumberPosition === 'right') {
        x = width - textWidth - 30;
      } else if (pageNumberPosition === 'left') {
        x = 30;
      } else if (pageNumberPosition === 'top-right') {
        x = width - textWidth - 30;
        y = height - 25;
      }

      page.drawText(text, {
        x: x,
        y: y,
        size: 9,
        font: numFont,
        color: rgb(0.4, 0.4, 0.4)
      });
    }
  }

  updateProgress(96, 'Optimizing document vector architecture...', 'Finalizing document structure and layout...');
  const pdfBytes = await pdfDoc.save();

  updateProgress(99, 'Triggering secure system download...', 'All done! Preparing your download now...');
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  
  // Sanitize the filename to prevent path traversal or special character issues
  const rawName = settings.pdfFilename || 'Indocreonix_Compiled';
  const sanitizedName = rawName.trim().replace(/[^a-zA-Z0-9_\-]/g, '_') || 'Indocreonix_Compiled';
  const finalFilename = `${sanitizedName}.pdf`;

  link.download = finalFilename;
  link.setAttribute('download', finalFilename);
  document.body.appendChild(link);
  link.click();
  
  // Retain the temporary blob URL and link for 60 seconds to ensure slow download streams are not interrupted
  setTimeout(() => {
    try {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.warn('Temporary download URL cleanup completed already:', e);
    }
  }, 60000);
};
