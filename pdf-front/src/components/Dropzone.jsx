import { useRef, useState } from 'react';
import { Upload, Info, Check } from 'lucide-react';
import '../styles/Dropzone.css';

export default function Dropzone({ onImagesSelected, hasImages }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const validImageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validImageFiles.length === 0) {
      alert('Please upload valid image files (JPEG, PNG, WebP, etc.).');
      return;
    }
    onImagesSelected(validImageFiles);
  };

  return (
    <div className={`left-panel-wrapper ${hasImages ? 'has-images' : ''}`}>
      <div 
        className={`dropzone ${isDraggingOver ? 'dragging' : ''} ${hasImages ? 'has-images' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          accept="image/*" 
          onChange={handleFileSelect} 
          style={{ display: 'none' }} 
        />
        <div className="dropzone-content">
          <div className="dropzone-icon-ring">
            <Upload className="dropzone-icon" />
          </div>
          <h3>Drag &amp; Drop Images</h3>
          <p>Supports full resolution JPG, PNG, WebP &amp; more. No file size or page limit.</p>
          <button type="button" className="btn-upload">Select Files</button>
        </div>
      </div>

      {/* High-Fidelity Info */}
      <div className="card info-card">
        <div className="info-header">
          <Info className="info-icon" />
          <h4>High-Fidelity Engine Instructions</h4>
        </div>
        <p className="info-text">
          By default, AeroPDF embeds images directly in their **original pixel resolution**. 
          This means a 50MP photo will have full 50MP depth inside the compiled PDF.
        </p>
        <div className="info-bullets">
          <div className="bullet-item">
            <Check className="bullet-icon" />
            <span>**Zero Re-Compression**: We insert JPG/PNG binaries raw.</span>
          </div>
          <div className="bullet-item">
            <Check className="bullet-icon" />
            <span>**Lossless Crops**: Crop canvas exports at full target resolution.</span>
          </div>
          <div className="bullet-item">
            <Check className="bullet-icon" />
            <span>**No Limits**: Upload thousands of pages without system throttle.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
