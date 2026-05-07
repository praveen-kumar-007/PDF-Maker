import { ImageIcon, X } from 'lucide-react';
import '../styles/PreviewModal.css';

export default function PreviewModal({ 
  imgSrc, 
  imgName, 
  onClose 
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content preview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-meta">
            <ImageIcon className="modal-header-icon" />
            <h3>Full Resolution Preview</h3>
            <p>{imgName}</p>
          </div>
          <button type="button" className="modal-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="preview-workspace">
          <img 
            src={imgSrc} 
            alt="Full resolution preview"
            className="preview-full-img" 
          />
        </div>
      </div>
    </div>
  );
}
