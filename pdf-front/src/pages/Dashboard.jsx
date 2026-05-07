import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Dropzone from '../components/Dropzone';
import ImageGrid from '../components/ImageGrid';
import CompilerSettings from '../components/CompilerSettings';
import CropModal from '../components/CropModal';
import PreviewModal from '../components/PreviewModal';
import { cropImageAtResolution } from '../utils/imageHelpers';
import { generateClientPDF } from '../utils/pdfCompiler';
import { 
  saveFileToDB, 
  getFileFromDB, 
  deleteFileFromDB, 
  clearAllFilesFromDB 
} from '../utils/storageHelper';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [images, setImages] = useState([]);
  const [activeCropId, setActiveCropId] = useState(null);
  const [activePreviewId, setActivePreviewId] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStep, setCompileStep] = useState('');
  const [compileSuccess, setCompileSuccess] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  
  // Custom states for premium compilation progress
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileFriendlyStep, setCompileFriendlyStep] = useState('');
  const compileStartTimeRef = useRef(null);

  const calculateTimeRemaining = (progress, totalPages) => {
    if (progress <= 5) {
      const estSeconds = Math.max(2, Math.round(totalPages * 0.8));
      return `Estimated: ~${estSeconds}s remaining`;
    }
    
    if (progress >= 98) {
      return "Finishing up details...";
    }
    
    if (compileStartTimeRef.current) {
      const elapsed = Date.now() - compileStartTimeRef.current;
      const totalEstimated = (elapsed / progress) * 100;
      const remaining = totalEstimated - elapsed;
      const remainingSeconds = Math.round(remaining / 1000);
      
      if (remainingSeconds <= 1) {
        return "Almost ready...";
      }
      return `Estimated: ~${remainingSeconds}s remaining`;
    }
    
    return "Analyzing document...";
  };
  
  // Compiler settings - load from LocalStorage
  const [pageSizeSetting, setPageSizeSetting] = useState(() => localStorage.getItem('indocreonix_pageSizeSetting') || 'original');
  const [marginSetting, setMarginSetting] = useState(() => localStorage.getItem('indocreonix_marginSetting') || 'standard');
  const [qualitySetting, setQualitySetting] = useState(() => localStorage.getItem('indocreonix_qualitySetting') || 'original');
  const [watermarkText, setWatermarkText] = useState(() => localStorage.getItem('indocreonix_watermarkText') || '');
  const [watermarkColor, setWatermarkColor] = useState(() => localStorage.getItem('indocreonix_watermarkColor') || '#9ca3af');
  const [watermarkOpacity, setWatermarkOpacity] = useState(() => {
    const val = localStorage.getItem('indocreonix_watermarkOpacity');
    return val !== null ? parseFloat(val) : 0.25;
  });
  const [watermarkSize, setWatermarkSize] = useState(() => {
    const val = localStorage.getItem('indocreonix_watermarkSize');
    return val !== null ? parseInt(val, 10) : 48;
  });
  const [addPageNumbers, setAddPageNumbers] = useState(() => localStorage.getItem('indocreonix_addPageNumbers') === 'true');
  const [pageNumberPosition, setPageNumberPosition] = useState(() => localStorage.getItem('indocreonix_pageNumberPosition') || 'center');
  const [pdfFilename, setPdfFilename] = useState(() => localStorage.getItem('indocreonix_pdfFilename') || 'Indocreonix_Compiled');

  // Restore session from Local Storage and IndexedDB on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const metaStr = localStorage.getItem('indocreonix_images_meta');
        if (!metaStr) {
          setIsRestoringSession(false);
          return;
        }

        const metaList = JSON.parse(metaStr);
        if (!Array.isArray(metaList) || metaList.length === 0) {
          setIsRestoringSession(false);
          return;
        }

        setIsCompiling(true);
        setCompileStep('Restoring your active session...');

        const restoredImages = [];

        for (const meta of metaList) {
          let previewUrl = null;
          let file = null;
          let pdfSource = null;
          let croppedUrl = null;
          let croppedFile = null;

          if (meta.isPdfPage) {
            // Restore PDF page dependencies
            const previewBlob = await getFileFromDB(`${meta.id}_previewBlob`);
            const sourceBytes = await getFileFromDB(`${meta.id}_pdfSource`);

            if (previewBlob) {
              previewUrl = URL.createObjectURL(previewBlob);
            }
            if (sourceBytes) {
              pdfSource = sourceBytes;
            }
          } else {
            // Restore standard image file dependencies
            const originalFile = await getFileFromDB(`${meta.id}_file`);
            if (originalFile) {
              file = originalFile;
              previewUrl = URL.createObjectURL(originalFile);
            }
          }

          // Restore crops if applied
          const cropFile = await getFileFromDB(`${meta.id}_croppedFile`);
          if (cropFile) {
            croppedFile = cropFile;
            croppedUrl = URL.createObjectURL(cropFile);
          }

          // Reconstitute only if files were successfully loaded
          if (previewUrl || croppedUrl) {
            restoredImages.push({
              ...meta,
              previewUrl,
              file,
              pdfSource,
              croppedUrl,
              croppedFile
            });
          }
        }

        setImages(restoredImages);
      } catch (err) {
        console.error('Session restoration failed:', err);
      } finally {
        setIsRestoringSession(false);
        setIsCompiling(false);
        setCompileStep('');
      }
    };

    restoreSession();
  }, []);

  // Save settings to Local Storage whenever they change
  useEffect(() => {
    localStorage.setItem('indocreonix_pageSizeSetting', pageSizeSetting);
    localStorage.setItem('indocreonix_marginSetting', marginSetting);
    localStorage.setItem('indocreonix_qualitySetting', qualitySetting);
    localStorage.setItem('indocreonix_watermarkText', watermarkText);
    localStorage.setItem('indocreonix_watermarkColor', watermarkColor);
    localStorage.setItem('indocreonix_watermarkOpacity', watermarkOpacity);
    localStorage.setItem('indocreonix_watermarkSize', watermarkSize);
    localStorage.setItem('indocreonix_addPageNumbers', addPageNumbers);
    localStorage.setItem('indocreonix_pageNumberPosition', pageNumberPosition);
    localStorage.setItem('indocreonix_pdfFilename', pdfFilename);
  }, [
    pageSizeSetting,
    marginSetting,
    qualitySetting,
    watermarkText,
    watermarkColor,
    watermarkOpacity,
    watermarkSize,
    addPageNumbers,
    pageNumberPosition,
    pdfFilename
  ]);

  // Save images metadata to Local Storage whenever queue changes
  useEffect(() => {
    if (isRestoringSession) return;
    
    const serializable = images.map(img => ({
      id: img.id,
      name: img.name,
      size: img.size,
      type: img.type,
      width: img.width,
      height: img.height,
      originalWidth: img.originalWidth,
      originalHeight: img.originalHeight,
      rotation: img.rotation,
      isPdfPage: img.isPdfPage,
      pageIndex: img.pageIndex,
      cropBoxPercent: img.cropBoxPercent,
      lastModified: img.lastModified
    }));
    
    localStorage.setItem('indocreonix_images_meta', JSON.stringify(serializable));
  }, [images, isRestoringSession]);

  // Keep a ref to the latest images array so the unmount cleanup can read it without triggering on every change
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Clean up object URLs on unmount to prevent memory leaks and prevent active blob URL destruction
  useEffect(() => {
    return () => {
      const urlsToRevoke = new Set();
      imagesRef.current.forEach(img => {
        if (img.previewUrl) urlsToRevoke.add(img.previewUrl);
        if (img.croppedUrl && img.croppedUrl.startsWith('blob:')) urlsToRevoke.add(img.croppedUrl);
      });
      urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Handle adding new files (Images and PDFs)
  const handleImagesSelected = async (validFiles) => {
    setIsCompiling(true);
    setCompileStep('Analyzing and rendering imported files...');

    // Sort files chronologically by default to match physical folder organization
    const sortedFiles = [...validFiles].sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0));

    try {
      for (const file of sortedFiles) {
        if (file.type === 'application/pdf') {
          // Process existing PDF document client-side
          const arrayBuffer = await file.arrayBuffer();
          const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
          
          if (!pdfjsLib) {
            throw new Error('PDF.js library is not loaded. Please ensure you are connected to the internet.');
          }

          // Point to cdnjs worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            setCompileStep(`Decompiling & rendering page ${pageNum} of ${pdf.numPages} from [${file.name}]...`);
            
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 }); // High-DPI canvas render
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;

            const pageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const previewUrl = URL.createObjectURL(pageBlob);

            const newPdfPageObj = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: `${file.name} (Pg ${pageNum}/${pdf.numPages})`,
              size: Math.round(file.size / pdf.numPages), // Approximated per-page file size
              type: 'application/pdf',
              previewUrl: previewUrl,
              croppedUrl: null,
              cropBoxPercent: null,
              originalWidth: Math.round(viewport.width),
              originalHeight: Math.round(viewport.height),
              width: Math.round(viewport.width),
              height: Math.round(viewport.height),
              isPdfPage: true,
              pdfSource: arrayBuffer,
              pageIndex: pageNum - 1,
              rotation: 0,
              lastModified: file.lastModified || Date.now()
            };

            // Save decompile artifacts securely inside IndexedDB
            await saveFileToDB(`${newPdfPageObj.id}_previewBlob`, pageBlob);
            await saveFileToDB(`${newPdfPageObj.id}_pdfSource`, arrayBuffer);

            setImages(prev => [...prev, newPdfPageObj]);
          }
        } else {
          // Process standard image file
          const previewUrl = URL.createObjectURL(file);
          
          await new Promise((resolve) => {
            const img = new Image();
            img.src = previewUrl;
            img.onload = async () => {
              const newImageObj = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                size: file.size,
                type: file.type,
                file: file,
                previewUrl: previewUrl,
                croppedUrl: null,
                cropBoxPercent: null,
                originalWidth: img.naturalWidth,
                originalHeight: img.naturalHeight,
                width: img.naturalWidth,
                height: img.naturalHeight,
                rotation: 0,
                lastModified: file.lastModified || Date.now()
              };

              // Store image file directly in IndexedDB
              await saveFileToDB(`${newImageObj.id}_file`, file);

              setImages(prev => [...prev, newImageObj]);
              resolve();
            };
            img.onerror = () => {
              console.error('Failed to load image preview');
              resolve();
            };
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error importing file: ' + err.message);
    } finally {
      setIsCompiling(false);
      setCompileStep('');
    }
  };

  // Remove an image from the queue with duplicate protection
  const handleRemoveImage = async (id) => {
    // Delete files from IndexedDB asynchronously to avoid blockages
    await deleteFileFromDB(`${id}_file`);
    await deleteFileFromDB(`${id}_previewBlob`);
    await deleteFileFromDB(`${id}_pdfSource`);
    await deleteFileFromDB(`${id}_croppedFile`);

    setImages(prev => {
      const target = prev.find(img => img.id === id);
      const remaining = prev.filter(img => img.id !== id);
      
      if (target) {
        // Prevent revoking if another page card is still referencing the same source
        const isPreviewUsed = remaining.some(img => img.previewUrl === target.previewUrl);
        const isCroppedUsed = remaining.some(img => img.croppedUrl === target.croppedUrl);

        if (target.previewUrl && !isPreviewUsed) URL.revokeObjectURL(target.previewUrl);
        if (target.croppedUrl && target.croppedUrl.startsWith('blob:') && !isCroppedUsed) {
          URL.revokeObjectURL(target.croppedUrl);
        }
      }
      return remaining;
    });
  };

  // Reordering queue handlers
  const handleMoveUp = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
  };

  const handleMoveDown = (index) => {
    if (index === images.length - 1) return;
    setImages(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
  };

  // Rotate a page 90 degrees clockwise
  const handleRotatePage = (id) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        return {
          ...img,
          rotation: ((img.rotation || 0) + 90) % 360
        };
      }
      return img;
    }));
  };

  // Duplicate page inside queue
  const handleDuplicatePage = async (id) => {
    let sourceId = id;
    const index = images.findIndex(img => img.id === id);
    if (index === -1) return;
    
    const target = images[index];
    const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duplicatedItem = {
      ...target,
      id: newId,
      name: target.name.includes('(Copy)') ? target.name : `${target.name} (Copy)`
    };

    // Duplicate corresponding binary attachments inside IndexedDB
    try {
      if (target.isPdfPage) {
        const previewBlob = await getFileFromDB(`${sourceId}_previewBlob`);
        const sourceBytes = await getFileFromDB(`${sourceId}_pdfSource`);
        if (previewBlob) await saveFileToDB(`${newId}_previewBlob`, previewBlob);
        if (sourceBytes) await saveFileToDB(`${newId}_pdfSource`, sourceBytes);
      } else {
        const originalFile = await getFileFromDB(`${sourceId}_file`);
        if (originalFile) await saveFileToDB(`${newId}_file`, originalFile);
      }

      if (target.croppedFile) {
        const cropFile = await getFileFromDB(`${sourceId}_croppedFile`);
        if (cropFile) await saveFileToDB(`${newId}_croppedFile`, cropFile);
      }
    } catch (dbErr) {
      console.error('Failed to duplicate page assets:', dbErr);
    }

    setImages(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, duplicatedItem);
      return updated;
    });
  };

  // Crop controls
  const handleCropStart = (imgObj) => {
    setActiveCropId(imgObj.id);
  };

  const handleCropSave = async (cropBoxPercent) => {
    const targetImage = images.find(img => img.id === activeCropId);
    if (!targetImage) return;

    try {
      setIsCompiling(true);
      setCompileStep('Slicing high-resolution pixels...');
      
      const { blob, width, height } = await cropImageAtResolution(
        targetImage.previewUrl, 
        cropBoxPercent, 
        targetImage.type
      );

      // Clean up previous crop URL and delete its IndexedDB entry if not used by others
      if (targetImage.croppedUrl && targetImage.croppedUrl.startsWith('blob:')) {
        const isCroppedUsedByOthers = images.some(img => img.id !== activeCropId && img.croppedUrl === targetImage.croppedUrl);
        if (!isCroppedUsedByOthers) {
          URL.revokeObjectURL(targetImage.croppedUrl);
          await deleteFileFromDB(`${activeCropId}_croppedFile`);
        }
      }

      const croppedUrl = URL.createObjectURL(blob);
      const mimeType = 'image/png';
      const baseName = targetImage.name.substring(0, targetImage.name.lastIndexOf('.')) || targetImage.name;
      const croppedFilename = `cropped_${baseName}.png`;
      const croppedFileObj = new File([blob], croppedFilename, { type: mimeType });

      // Save new crop to IndexedDB
      await saveFileToDB(`${activeCropId}_croppedFile`, croppedFileObj);

      setImages(prev => prev.map(img => {
        if (img.id === activeCropId) {
          return {
            ...img,
            croppedUrl: croppedUrl,
            cropBoxPercent: cropBoxPercent,
            width: width,
            height: height,
            croppedFile: croppedFileObj
          };
        }
        return img;
      }));

      setActiveCropId(null);
    } catch (err) {
      console.error(err);
      alert('Error during crop application: ' + err.message);
    } finally {
      setIsCompiling(false);
      setCompileStep('');
    }
  };

  const handleUndoCrop = async (id) => {
    // Delete crop file from IndexedDB
    await deleteFileFromDB(`${id}_croppedFile`);

    setImages(prev => prev.map(img => {
      if (img.id === id) {
        if (img.croppedUrl && img.croppedUrl.startsWith('blob:')) {
          const isCroppedUsedByOthers = prev.some(item => item.id !== id && item.croppedUrl === img.croppedUrl);
          if (!isCroppedUsedByOthers) {
            URL.revokeObjectURL(img.croppedUrl);
          }
        }
        return {
          ...img,
          croppedUrl: null,
          cropBoxPercent: null,
          width: img.originalWidth,
          height: img.originalHeight,
          croppedFile: null
        };
      }
      return img;
    }));
  };

  const handleApplyFilter = (id, filterType) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        return { ...img, filter: filterType };
      }
      return img;
    }));
  };

  // Queue reset
  const handleResetQueue = async () => {
    // Completely wipe all files from IndexedDB database
    await clearAllFilesFromDB();

    const urlsToRevoke = new Set();
    images.forEach(img => {
      if (img.previewUrl) urlsToRevoke.add(img.previewUrl);
      if (img.croppedUrl && img.croppedUrl.startsWith('blob:')) urlsToRevoke.add(img.croppedUrl);
    });
    urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
    setImages([]);
    setCompileSuccess(false);
  };
  // Sort and Reverse Queue
  const handleSortQueue = (field) => {
    setImages(prev => {
      const sorted = [...prev].sort((a, b) => {
        if (field === 'date') {
          return (a.lastModified || 0) - (b.lastModified || 0);
        } else {
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        }
      });
      return sorted;
    });
  };

  const handleReverseQueue = () => {
    setImages(prev => [...prev].reverse());
  };

  // Compile Trigger
  const handleCompile = async () => {
    if (images.length === 0) return;

    setIsGeneratingPDF(true);
    setCompileProgress(0);
    setCompileFriendlyStep('Initializing document templates...');
    setCompileSuccess(false);
    compileStartTimeRef.current = Date.now();

    try {
      const compilerSettings = {
        pageSizeSetting,
        marginSetting,
        qualitySetting,
        watermarkText,
        watermarkColor,
        watermarkOpacity,
        watermarkSize,
        addPageNumbers,
        pageNumberPosition,
        pdfFilename
      };

      const handleProgress = (progress, friendlyStep) => {
        setCompileProgress(progress);
        setCompileFriendlyStep(friendlyStep);
      };

      await generateClientPDF(images, compilerSettings, setCompileStep, handleProgress);
      
      setCompileProgress(100);
      setCompileFriendlyStep('Your premium PDF is ready and download started!');
      setCompileSuccess(true);
      
      setTimeout(() => {
        setIsGeneratingPDF(false);
        handleResetQueue(); // Reset the page queue and all local temporary files
      }, 1500); // Elegant wait so the progress bar completion feels satisfying
      
      setTimeout(() => setCompileSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert('Error compiling PDF: ' + err.message);
      setIsGeneratingPDF(false);
    }
  };

  const activeCropImage = images.find(img => img.id === activeCropId);
  const activePreviewImage = images.find(img => img.id === activePreviewId);

  return (
    <div className="app-container animate-slide-up">
      {/* Dynamic Header */}
      <Header />

      {/* Main Dashboard Layout */}
      <main className="dashboard">
        <div className="left-panel">
          <Dropzone 
            onImagesSelected={handleImagesSelected} 
            hasImages={images.length > 0} 
          />
        </div>

        <div className="right-panel">
          <ImageGrid 
            images={images}
            onCropStart={handleCropStart}
            onPreviewStart={setActivePreviewId}
            onRemove={handleRemoveImage}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onUndoCrop={handleUndoCrop}
            onReset={handleResetQueue}
            onRotate={handleRotatePage}
            onDuplicate={handleDuplicatePage}
            onSort={handleSortQueue}
            onReverse={handleReverseQueue}
            onApplyFilter={handleApplyFilter}
          />

          {images.length > 0 && (
            <CompilerSettings 
              pageSizeSetting={pageSizeSetting}
              setPageSizeSetting={setPageSizeSetting}
              marginSetting={marginSetting}
              setMarginSetting={setMarginSetting}
              qualitySetting={qualitySetting}
              setQualitySetting={setQualitySetting}
              watermarkText={watermarkText}
              setWatermarkText={setWatermarkText}
              watermarkColor={watermarkColor}
              setWatermarkColor={setWatermarkColor}
              watermarkOpacity={watermarkOpacity}
              setWatermarkOpacity={setWatermarkOpacity}
              watermarkSize={watermarkSize}
              setWatermarkSize={setWatermarkSize}
              addPageNumbers={addPageNumbers}
              setAddPageNumbers={setAddPageNumbers}
              pageNumberPosition={pageNumberPosition}
              setPageNumberPosition={setPageNumberPosition}
              pdfFilename={pdfFilename}
              setPdfFilename={setPdfFilename}
              isCompiling={isCompiling || isGeneratingPDF}
              compileStep={isGeneratingPDF ? 'Processing...' : compileStep}
              compileSuccess={compileSuccess}
              onCompile={handleCompile}
            />
          )}
        </div>
      </main>

      {/* Lossless Crop Modal */}
      {activeCropId && activeCropImage && (
        <CropModal 
          imgSrc={activeCropImage.previewUrl}
          previousCrop={activeCropImage.cropBoxPercent}
          onClose={() => setActiveCropId(null)}
          onSave={handleCropSave}
        />
      )}

      {/* Full Preview Modal */}
      {activePreviewId && activePreviewImage && (
        <PreviewModal 
          imgSrc={activePreviewImage.croppedUrl || activePreviewImage.previewUrl}
          imgName={activePreviewImage.name}
          onClose={() => setActivePreviewId(null)}
        />
      )}

      {/* Premium Compiling Progress Overlay */}
      {isGeneratingPDF && (
        <div className="compiling-overlay">
          <div className="compiling-progress-card">
            <div className="brand-header">
              <img src="/image.png" alt="Indocreonix Logo" className="brand-logo-img animate-pulse-slow" />
              <h2>Indocreonix</h2>
              <p className="brand-subtext">Premium PDF Engine</p>
            </div>
            
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${compileProgress}%` }}
              ></div>
              <div className="progress-glow" style={{ width: `${compileProgress}%` }}></div>
            </div>
            
            <div className="progress-stats">
              <span className="percentage-text">{compileProgress}% Completed</span>
              <span className="time-remaining-text">
                {calculateTimeRemaining(compileProgress, images.length)}
              </span>
            </div>
            
            <p className="friendly-step-text">{compileFriendlyStep}</p>
            
            <div className="compiling-footer">
              <span className="lock-icon">🔒</span>
              <span>100% secure offline compilation</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
