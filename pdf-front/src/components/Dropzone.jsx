import { useRef, useState } from 'react';
import { Upload, Info, Check, FolderOpen } from 'lucide-react';
import '../styles/Dropzone.css';

export default function Dropzone({ onImagesSelected, hasImages }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

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
    
    // Reset inputs so the user can re-upload the same files/folders if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const processFiles = (files) => {
    const validFiles = files.filter(file => file.type.startsWith('image/') || file.type === 'application/pdf');
    
    if (validFiles.length === 0) {
      alert('Please upload valid image files (JPEG, PNG, WebP) or PDF documents.');
      return;
    }
    onImagesSelected(validFiles);
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
        {/* Hidden File Input & Label */}
        <label htmlFor="file-import-input" style={{ display: 'none' }}>Import files</label>
        <input 
          id="file-import-input"
          name="file-import-input"
          aria-label="Import files"
          type="file" 
          ref={fileInputRef} 
          multiple 
          accept="image/*, application/pdf" 
          onChange={handleFileSelect} 
          style={{ display: 'none' }} 
        />
        
        {/* Hidden Folder Input & Label */}
        <label htmlFor="folder-import-input" style={{ display: 'none' }}>Import folder</label>
        <input 
          id="folder-import-input"
          name="folder-import-input"
          aria-label="Import folder"
          type="file" 
          ref={folderInputRef} 
          webkitdirectory=""
          directory=""
          multiple 
          onChange={handleFileSelect} 
          style={{ display: 'none' }} 
        />

        <div className="dropzone-content">
          <div className="dropzone-icon-ring">
            <Upload className="dropzone-icon" />
          </div>
          <h3>Import Pages or Folders</h3>
          <p>Supports full resolution JPG, PNG, WebP &amp; PDFs. Merge folders sorted by date modified.</p>
          
          <div className="dropzone-buttons">
            <button 
              type="button" 
              className="btn-upload"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Select Files
            </button>
            <button 
              type="button" 
              className="btn-upload btn-folder"
              onClick={(e) => {
                e.stopPropagation();
                folderInputRef.current?.click();
              }}
            >
              <FolderOpen size={13} style={{ marginRight: 6 }} />
              Select Folder
            </button>
          </div>
        </div>
      </div>

      {/* High-Fidelity Info */}
      <div className="card info-card">
        <div className="info-header">
          <Info className="info-icon" />
          <h4>High-Fidelity Engine Instructions</h4>
        </div>
        <p className="info-text">
          By default, Indocreonix embeds images directly in their <strong>original pixel resolution</strong>. 
          This means a 50MP photo will have full 50MP depth inside the compiled PDF.
        </p>
        <div className="info-bullets">
          <div className="bullet-item">
            <Check className="bullet-icon" />
            <span><strong>Zero Re-Compression</strong>: We insert JPG/PNG binaries raw.</span>
          </div>
          <div className="bullet-item">
            <Check className="bullet-icon" />
            <span><strong>Lossless Crops</strong>: Crop canvas exports at full target resolution.</span>
          </div>
          <div className="bullet-item">
            <Check className="bullet-icon" />
            <span><strong>No Limits</strong>: Upload thousands of pages without system throttle.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
