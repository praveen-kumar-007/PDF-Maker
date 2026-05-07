import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Dropzone from '../components/Dropzone';
import ImageGrid from '../components/ImageGrid';
import CompilerSettings from '../components/CompilerSettings';
import CropModal from '../components/CropModal';
import PreviewModal from '../components/PreviewModal';
import { cropImageAtResolution } from '../utils/imageHelpers';
import { generateClientPDF } from '../utils/pdfCompiler';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [images, setImages] = useState([]);
  const [activeCropId, setActiveCropId] = useState(null);
  const [activePreviewId, setActivePreviewId] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStep, setCompileStep] = useState('');
  const [compileSuccess, setCompileSuccess] = useState(false);
  const [pageSizeSetting, setPageSizeSetting] = useState('original'); // 'original', 'a4', or 'letter'
  const [marginSetting, setMarginSetting] = useState('standard'); // 'none', 'thin', or 'standard'

  // Clean up object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
        if (img.croppedUrl && img.croppedUrl.startsWith('blob:')) URL.revokeObjectURL(img.croppedUrl);
      });
    };
  }, []);

  // Handle adding new files
  const handleImagesSelected = (validImageFiles) => {
    validImageFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
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
          height: img.naturalHeight
        };
        setImages(prev => [...prev, newImageObj]);
      };
    });
  };

  // Remove an image from the queue
  const handleRemoveImage = (id) => {
    setImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) {
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
        if (target.croppedUrl && target.croppedUrl.startsWith('blob:')) URL.revokeObjectURL(target.croppedUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  // Reordering queues
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

      // Clean up previous crop URL
      if (targetImage.croppedUrl && targetImage.croppedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(targetImage.croppedUrl);
      }

      const croppedUrl = URL.createObjectURL(blob);
      const mimeType = 'image/png';
      const baseName = targetImage.name.substring(0, targetImage.name.lastIndexOf('.')) || targetImage.name;
      const croppedFilename = `cropped_${baseName}.png`;

      setImages(prev => prev.map(img => {
        if (img.id === activeCropId) {
          return {
            ...img,
            croppedUrl: croppedUrl,
            cropBoxPercent: cropBoxPercent,
            width: width,
            height: height,
            croppedFile: new File([blob], croppedFilename, { type: mimeType })
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

  const handleUndoCrop = (id) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        if (img.croppedUrl && img.croppedUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.croppedUrl);
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

  // Queue reset
  const handleResetQueue = () => {
    images.forEach(img => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      if (img.croppedUrl && img.croppedUrl.startsWith('blob:')) URL.revokeObjectURL(img.croppedUrl);
    });
    setImages([]);
    setCompileSuccess(false);
  };

  // Compile Trigger
  const handleCompile = async () => {
    if (images.length === 0) return;

    setIsCompiling(true);
    setCompileSuccess(false);

    try {
      await generateClientPDF(images, pageSizeSetting, marginSetting, setCompileStep);
      setCompileSuccess(true);
      setTimeout(() => setCompileSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert('Error compiling PDF: ' + err.message);
    } finally {
      setIsCompiling(false);
      setCompileStep('');
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
          />

          {images.length > 0 && (
            <CompilerSettings 
              pageSizeSetting={pageSizeSetting}
              setPageSizeSetting={setPageSizeSetting}
              marginSetting={marginSetting}
              setMarginSetting={setMarginSetting}
              isCompiling={isCompiling}
              compileStep={compileStep}
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
    </div>
  );
}
