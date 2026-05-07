import { Trash2, Crop, ArrowUp, ArrowDown, Eye, RotateCw, Copy, FileCode2 } from 'lucide-react';
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
  onUndoCrop,
  onRotate,
  onDuplicate
}) {
  return (
    <div className="image-card">
      <div className="card-badge">
        <span>Page {index + 1}</span>
        {img.isPdfPage && (
          <span className="pdf-source-badge" title="Imported PDF Page">
            <FileCode2 size={10} style={{ marginRight: 2 }} /> PDF
          </span>
        )}
      </div>
      
      <div className="card-image-wrap">
        <img 
          src={img.croppedUrl || img.previewUrl} 
          alt={img.name} 
          className="card-image"
          style={{ 
            transform: `rotate(${img.rotation || 0}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
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

        <div className="action-btns-group">
          <button 
            type="button" 
            className="card-action-btn rotate" 
            onClick={() => onRotate(img.id)}
            title="Rotate Page 90° Clockwise"
          >
            <RotateCw size={13} />
          </button>
          <button 
            type="button" 
            className="card-action-btn duplicate" 
            onClick={() => onDuplicate(img.id)}
            title="Duplicate Page"
          >
            <Copy size={13} />
          </button>
          <button 
            type="button" 
            className="btn-card-delete"
            onClick={() => onRemove(img.id)}
            title="Delete Page"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
