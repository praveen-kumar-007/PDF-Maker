import { PDFDocument } from 'pdf-lib';
import { convertImageToCompatibleBytes } from './imageHelpers';

/**
 * 100% Lossless client-side PDF document builder using pdf-lib
 * @param {Array} images - list of queue items
 * @param {string} pageSizeSetting - 'original', 'a4', or 'letter'
 * @param {string} marginSetting - 'none', 'thin', or 'standard'
 * @param {Function} setStep - state hook to display status
 * @returns {Promise<void>}
 */
export const generateClientPDF = async (images, pageSizeSetting, marginSetting = 'standard', setStep) => {
  setStep('Initializing high-fidelity PDF canvas...');
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    setStep(`Embedding Page ${i + 1} of ${images.length}: [${img.name}]...`);

    const srcUrl = img.croppedUrl || img.previewUrl;
    const isPng = img.croppedUrl ? true : img.type.toLowerCase().includes('png');

    // Fetch original raw binary stream
    const response = await fetch(srcUrl);
    const arrayBuffer = await response.arrayBuffer();
    const imageBytes = new Uint8Array(arrayBuffer);

    let pdfImage;
    try {
      if (isPng) {
        pdfImage = await pdfDoc.embedPng(imageBytes);
      } else {
        pdfImage = await pdfDoc.embedJpg(imageBytes);
      }
    } catch (embedError) {
      // Fallback convert image buffer to standardized format if stream is progressive
      setStep(`Standardizing image format for [${img.name}]...`);
      const fallbackBytes = await convertImageToCompatibleBytes(srcUrl, isPng);
      // Since convertImageToCompatibleBytes always outputs PNG bytes, we embed it as PNG to prevent embedding failures
      pdfImage = await pdfDoc.embedPng(fallbackBytes);
    }

    if (pageSizeSetting === 'original') {
      // Set page dimensions EXACTLY equal to the photo resolution for absolute zero loss
      const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
      page.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: pdfImage.width,
        height: pdfImage.height
      });
    } else {
      // Standard page dimensions (A4 or US Letter)
      let baseWidth = 595.27;  // A4 Width
      let baseHeight = 841.89; // A4 Height

      if (pageSizeSetting === 'letter') {
        baseWidth = 612.0;   // US Letter Width
        baseHeight = 792.0;  // US Letter Height
      }

      // Auto-orientation check: if image is landscape, rotate the sheet orientation to match beautifully!
      const isLandscapeImage = pdfImage.width > pdfImage.height;
      const targetWidth = isLandscapeImage ? baseHeight : baseWidth;
      const targetHeight = isLandscapeImage ? baseWidth : baseHeight;

      // Determine margin padding in points
      let margin = 20; // Default standard
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
  }

  setStep('Optimizing document vector architecture...');
  const pdfBytes = await pdfDoc.save();

  setStep('Triggering system download...');
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `ultimapdf_${Date.now()}.pdf`);
  document.body.appendChild(link);
  link.click();
  
  // Defer cleanup to prevent race conditions where Chrome downloads the file as a UUID without extension
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }, 10000);
};
