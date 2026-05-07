import { Trash2, Crop, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { formatBytes } from '../utils/imageHelpers';
import '../styles/ImageCard.css';

export default function ImageCard({ 
  img, 
  index, 
  totalImages, 
  onCropStart, 
  onPreviewStart, 
  onRemove, 
  onMoveUp, 
  onMoveDown, 
  onUndoCrop 
}) {
  return (
    <div className="image-card">
      <div className="card-badge">Page {index + 1}</div>
      
      <div className="card-image-wrap">
        <img 
          src={img.croppedUrl || img.previewUrl} 
          alt={img.name} 
          className="card-image"
        />
        
        {/* Hover overlay actions */}
        <div className="card-image-overlay">
          <button 
            type="button" 
            className="overlay-btn crop" 
            title="Lossless Crop Editor"
            onClick={() => onCropStart(img)}
          >
            <Crop size={16} />
            <span>Crop</span>
          </button>
          <button 
            type="button" 
            className="overlay-btn preview" 
            title="View Full Resolution"
            onClick={() => onPreviewStart(img.id)}
          >
            <Eye size={16} />
            <span>View</span>
          </button>
        </div>
      </div>

      <div className="card-meta">
        <h4 className="card-filename" title={img.name}>{img.name}</h4>
        <div className="card-dims-row">
          <span className="dim-badge">{img.width} × {img.height} px</span>
          <span className="size-badge">{formatBytes(img.size)}</span>
        </div>
        {img.croppedUrl && (
          <div className="crop-applied-tag">
            <span>Lossless Crop Applied</span>
            <button 
              type="button" 
              className="btn-undo-crop"
              onClick={() => onUndoCrop(img.id)}
              title="Undo Crop to Original"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <div className="card-footer-controls">
        <div className="reorder-btns">
          <button 
            type="button" 
            className="reorder-btn" 
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            title="Move Page Up"
          >
            <ArrowUp size={15} />
          </button>
          <button 
            type="button" 
            className="reorder-btn" 
            disabled={index === totalImages - 1}
            onClick={() => onMoveDown(index)}
            title="Move Page Down"
          >
            <ArrowDown size={15} />
          </button>
        </div>
        <button 
          type="button" 
          className="btn-card-delete"
          onClick={() => onRemove(img.id)}
          title="Delete Page"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
