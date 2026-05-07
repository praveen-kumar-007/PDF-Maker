import { Trash2, Crop, ArrowUp, ArrowDown, Eye, RotateCw, RotateCcw, Copy, FileCode2 } from 'lucide-react';
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
  onDuplicate,
  onApplyFilter
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
      
      <div 
        className="card-image-wrap"
        onClick={() => onPreviewStart(img.id)}
        style={{ cursor: 'zoom-in' }}
        title="Click to view full resolution preview"
      >
        <img 
          src={img.croppedUrl || img.previewUrl} 
          alt={img.name} 
          className="card-image"
          style={{ 
            transform: `rotate(${img.rotation || 0}deg)`,
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            filter: img.filter === 'doc' 
              ? 'contrast(1.45) brightness(1.1) grayscale(1)' 
              : img.filter === 'enhance'
                ? 'contrast(1.25) saturate(1.35) brightness(1.05)'
                : img.filter === 'grayscale'
                  ? 'grayscale(1)'
                  : 'none'
          }}
        />
      </div>

      <div className="card-meta">
        <h4 className="card-filename" title={img.name}>{img.name}</h4>
        <div className="card-dims-row">
          <span className="dim-badge">{img.width} × {img.height} px</span>
          <span className="size-badge">{formatBytes(img.size)}</span>
        </div>

        {/* Permanently visible premium actions */}
        <div className="card-primary-actions">
          <button 
            type="button" 
            className="btn-primary-action crop" 
            title="Lossless Crop Editor"
            onClick={(e) => {
              e.stopPropagation();
              onCropStart(img);
            }}
          >
            <Crop size={14} />
            <span>Crop</span>
          </button>
          <button 
            type="button" 
            className="btn-primary-action view" 
            title="View Full Resolution"
            onClick={(e) => {
              e.stopPropagation();
              onPreviewStart(img.id);
            }}
          >
            <Eye size={14} />
            <span>View</span>
          </button>
        </div>

        {img.croppedUrl && (
          <div className="crop-applied-tag">
            <span>Lossless Crop Applied</span>
            <button 
              type="button" 
              className="btn-undo-crop"
              onClick={(e) => {
                e.stopPropagation();
                onUndoCrop(img.id);
              }}
              title="Undo Crop to Original"
            >
              Reset
            </button>
          </div>
        )}

        {!img.isPdfPage && (
          <div className="scanner-filters-section" onClick={(e) => e.stopPropagation()}>
            <span className="filters-label">Scanner Enhancements</span>
            <div className="filter-options">
              <button
                type="button"
                className={`filter-opt-btn ${(!img.filter || img.filter === 'original') ? 'active' : ''}`}
                onClick={() => onApplyFilter(img.id, 'original')}
                title="Keep original photograph quality"
              >
                Original
              </button>
              <button
                type="button"
                className={`filter-opt-btn ${img.filter === 'doc' ? 'active' : ''}`}
                onClick={() => onApplyFilter(img.id, 'doc')}
                title="Doc Scan: Convert photograph to high-contrast photocopy"
              >
                Doc Scan
              </button>
              <button
                type="button"
                className={`filter-opt-btn ${img.filter === 'enhance' ? 'active' : ''}`}
                onClick={() => onApplyFilter(img.id, 'enhance')}
                title="Vivid Ink: Boost contrast and text saturation"
              >
                Vivid Ink
              </button>
              <button
                type="button"
                className={`filter-opt-btn ${img.filter === 'grayscale' ? 'active' : ''}`}
                onClick={() => onApplyFilter(img.id, 'grayscale')}
                title="Mono: Convert photograph to professional black & white"
              >
                Mono
              </button>
            </div>
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
            className="card-action-btn rotate rotate-ccw" 
            onClick={() => onRotate(img.id, 'anticlockwise')}
            title="Rotate Page 90° Anticlockwise"
          >
            <RotateCcw size={13} />
          </button>
          <button 
            type="button" 
            className="card-action-btn rotate" 
            onClick={() => onRotate(img.id, 'clockwise')}
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
