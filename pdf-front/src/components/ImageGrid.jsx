import { Image as ImageIcon, Calendar, SortAsc, ArrowUpDown } from 'lucide-react';
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
  onReset,
  onRotate,
  onDuplicate,
  onSort,
  onReverse
}) {
  if (images.length === 0) {
    return (
      <div className="empty-workspace">
        <div className="empty-icon-box">
          <ImageIcon className="empty-icon" />
        </div>
        <h2>No images in queue</h2>
        <p>Upload files or select folders on the left to start compiling your lossless PDF.</p>
      </div>
    );
  }

  return (
    <div className="image-grid-container">
      <div className="workspace-header">
        <div className="workspace-title">
          <h2>Compiled Queue ({images.length} {images.length === 1 ? 'page' : 'pages'})</h2>
          <p>Rearrange, crop, rotate or duplicate pages below before compiling.</p>
        </div>
        
        <div className="workspace-actions">
          <div className="sorting-controls">
            <button 
              type="button" 
              className="btn-sort" 
              onClick={() => onSort('date')}
              title="Sort queue by file creation/modification date"
            >
              <Calendar size={13} style={{ marginRight: 5 }} />
              Sort by Date
            </button>
            <button 
              type="button" 
              className="btn-sort" 
              onClick={() => onSort('name')}
              title="Sort queue alphabetically by filename"
            >
              <SortAsc size={13} style={{ marginRight: 5 }} />
              Sort by Name
            </button>
            <button 
              type="button" 
              className="btn-sort btn-reverse" 
              onClick={onReverse}
              title="Reverse queue direction (toggle ascending / descending)"
            >
              <ArrowUpDown size={13} style={{ marginRight: 5 }} />
              Reverse Order
            </button>
          </div>

          <button type="button" className="btn-clear-all" onClick={onReset}>
            Clear Queue
          </button>
        </div>
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
            onRotate={onRotate}
            onDuplicate={onDuplicate}
          />
        ))}
      </div>
    </div>
  );
}
