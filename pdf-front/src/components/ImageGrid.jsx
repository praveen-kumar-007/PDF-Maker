import { Image as ImageIcon } from 'lucide-react';
import ImageCard from './ImageCard';
import '../styles/ImageGrid.css';

export default function ImageGrid({ 
  images, 
  onCropStart, 
  onPreviewStart, 
  onRemove, 
  onMoveUp, 
  onMoveDown, 
  onUndoCrop,
  onReset 
}) {
  if (images.length === 0) {
    return (
      <div className="empty-workspace">
        <div className="empty-icon-box">
          <ImageIcon className="empty-icon" />
        </div>
        <h2>No images in queue</h2>
        <p>Upload files on the left to start compiling your lossless PDF.</p>
      </div>
    );
  }

  return (
    <div className="image-grid-container">
      <div className="workspace-header">
        <div className="workspace-title">
          <h2>Compiled Queue ({images.length} {images.length === 1 ? 'page' : 'pages'})</h2>
          <p>Drag files on the left to upload more. Rearrange or crop below.</p>
        </div>
        <button type="button" className="btn-clear-all" onClick={onReset}>
          Clear Queue
        </button>
      </div>

      <div className="images-grid">
        {images.map((img, index) => (
          <ImageCard 
            key={img.id}
            img={img}
            index={index}
            totalImages={images.length}
            onCropStart={onCropStart}
            onPreviewStart={onPreviewStart}
            onRemove={onRemove}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onUndoCrop={onUndoCrop}
          />
        ))}
      </div>
    </div>
  );
}
