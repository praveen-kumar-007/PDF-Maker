import { useState, useRef, useEffect } from 'react';
import { Crop, X } from 'lucide-react';
import '../styles/CropModal.css';

export default function CropModal({ 
  imgSrc, 
  previousCrop, 
  onClose, 
  onSave 
}) {
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [aspectRatioPreset, setAspectRatioPreset] = useState('free');
  
  const cropImgRef = useRef(null);
  const cropContainerRef = useRef(null);
  const dragStartRef = useRef(null);
  const activeHandleRef = useRef(null);

  // Initialize crop box coordinates
  useEffect(() => {
    if (previousCrop) {
      setCropBox(previousCrop);
    } else {
      setCropBox({ x: 10, y: 10, width: 80, height: 80 });
    }
  }, [previousCrop]);

  // Handle aspect ratio constraint modifications
  useEffect(() => {
    let ratio = null;
    if (aspectRatioPreset === '1:1') ratio = 1;
    else if (aspectRatioPreset === '16:9') ratio = 16 / 9;
    else if (aspectRatioPreset === '4:3') ratio = 4 / 3;
    else if (aspectRatioPreset === 'a4') ratio = 1 / 1.414; // A4 ratio is approx 1:1.414

    if (ratio && cropImgRef.current) {
      const imgWidth = cropImgRef.current.clientWidth;
      const imgHeight = cropImgRef.current.clientHeight;
      const containerAspect = imgWidth / imgHeight;

      setCropBox(prev => {
        let newWidth = prev.width;
        // Adjust relative height by multiplying raw aspect ratio with container scaling
        let newHeight = (newWidth * ratio) / containerAspect;

        if (prev.y + newHeight > 100) {
          newHeight = 100 - prev.y;
          newWidth = (newHeight * containerAspect) / ratio;
        }

        return {
          ...prev,
          width: Math.min(newWidth, 100 - prev.x),
          height: Math.min(newHeight, 100 - prev.y)
        };
      });
    }
  }, [aspectRatioPreset]);

  // Drag and Resize Mouse/Touch Events
  const handleMouseDown = (e, handle = null) => {
    e.preventDefault();
    const isTouchEvent = e.type.startsWith('touch');
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      boxX: cropBox.x,
      boxY: cropBox.y,
      boxWidth: cropBox.width,
      boxHeight: cropBox.height,
    };
    activeHandleRef.current = handle;

    if (isTouchEvent) {
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = (e) => {
    if (!dragStartRef.current) return;
    e.preventDefault();

    const isTouchEvent = e.type.startsWith('touch');
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragStartRef.current.startX;
    const dy = clientY - dragStartRef.current.startY;

    const containerWidth = cropContainerRef.current.clientWidth;
    const containerHeight = cropContainerRef.current.clientHeight;

    const dxPercent = (dx / containerWidth) * 100;
    const dyPercent = (dy / containerHeight) * 100;

    const start = dragStartRef.current;
    const handle = activeHandleRef.current;

    let newX = start.boxX;
    let newY = start.boxY;
    let newW = start.boxWidth;
    let newH = start.boxHeight;

    if (handle === 'move') {
      newX = Math.max(0, Math.min(100 - start.boxWidth, start.boxX + dxPercent));
      newY = Math.max(0, Math.min(100 - start.boxHeight, start.boxY + dyPercent));
    } else {
      let ratio = null;
      if (aspectRatioPreset === '1:1') ratio = 1;
      else if (aspectRatioPreset === '16:9') ratio = 16 / 9;
      else if (aspectRatioPreset === '4:3') ratio = 4 / 3;
      else if (aspectRatioPreset === 'a4') ratio = 1 / 1.414;

      const containerAspect = containerWidth / containerHeight;

      if (handle === 'tl') {
        newX = Math.max(0, Math.min(start.boxX + start.boxWidth - 5, start.boxX + dxPercent));
        newW = start.boxWidth - (newX - start.boxX);
        newY = Math.max(0, Math.min(start.boxY + start.boxHeight - 5, start.boxY + dyPercent));
        newH = start.boxHeight - (newY - start.boxY);

        if (ratio) {
          newH = (newW * ratio) / containerAspect;
          newY = start.boxY + start.boxHeight - newH;
          if (newY < 0) {
            newY = 0;
            newH = start.boxY + start.boxHeight;
            newW = (newH * containerAspect) / ratio;
            newX = start.boxX + start.boxWidth - newW;
          }
        }
      } else if (handle === 'tr') {
        newW = Math.max(5, Math.min(100 - start.boxX, start.boxWidth + dxPercent));
        newY = Math.max(0, Math.min(start.boxY + start.boxHeight - 5, start.boxY + dyPercent));
        newH = start.boxHeight - (newY - start.boxY);

        if (ratio) {
          newH = (newW * ratio) / containerAspect;
          newY = start.boxY + start.boxHeight - newH;
          if (newY < 0) {
            newY = 0;
            newH = start.boxY + start.boxHeight;
            newW = (newH * containerAspect) / ratio;
          }
        }
      } else if (handle === 'bl') {
        newX = Math.max(0, Math.min(start.boxX + start.boxWidth - 5, start.boxX + dxPercent));
        newW = start.boxWidth - (newX - start.boxX);
        newH = Math.max(5, Math.min(100 - start.boxY, start.boxHeight + dyPercent));

        if (ratio) {
          newH = (newW * ratio) / containerAspect;
          if (start.boxY + newH > 100) {
            newH = 100 - start.boxY;
            newW = (newH * containerAspect) / ratio;
            newX = start.boxX + start.boxWidth - newW;
          }
        }
      } else if (handle === 'br') {
        newW = Math.max(5, Math.min(100 - start.boxX, start.boxWidth + dxPercent));
        newH = Math.max(5, Math.min(100 - start.boxY, start.boxHeight + dyPercent));

        if (ratio) {
          newH = (newW * ratio) / containerAspect;
          if (start.boxY + newH > 100) {
            newH = 100 - start.boxY;
            newW = (newH * containerAspect) / ratio;
          }
        }
      }
    }

    setCropBox({
      x: parseFloat(newX.toFixed(3)),
      y: parseFloat(newY.toFixed(3)),
      width: parseFloat(newW.toFixed(3)),
      height: parseFloat(newH.toFixed(3))
    });
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
    activeHandleRef.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('touchmove', handleMouseMove);
    window.removeEventListener('touchend', handleMouseUp);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content crop-modal">
        <div className="modal-header">
          <div className="header-meta">
            <Crop className="modal-header-icon" />
            <h3>Lossless Image Crop</h3>
            <p>Drag boundaries to select crop area. Retains full density pixels.</p>
          </div>
          <button type="button" className="modal-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="crop-controls-toolbar">
          <span className="toolbar-label">Aspect Ratio Presets:</span>
          <div className="aspect-ratio-buttons">
            {['free', '1:1', '16:9', '4:3', 'a4'].map((preset) => (
              <button
                key={preset}
                type="button"
                className={`preset-btn ${aspectRatioPreset === preset ? 'active' : ''}`}
                onClick={() => setAspectRatioPreset(preset)}
              >
                {preset.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Workspace canvas container */}
        <div className="crop-workspace-container">
          <div className="crop-bounding-box" ref={cropContainerRef}>
            <img 
              src={imgSrc} 
              ref={cropImgRef}
              alt="To crop" 
              className="crop-target-image"
              onLoad={() => setAspectRatioPreset('free')}
            />
            
            {/* Overlay dim shader mask */}
            <div className="crop-dimmer-layer">
              <div 
                className="crop-visible-box"
                style={{
                  left: `${cropBox.x}%`,
                  top: `${cropBox.y}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                onTouchStart={(e) => handleMouseDown(e, 'move')}
              >
                {/* Drag corner handlers */}
                <div 
                  className="crop-handle tl" 
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'tl'); }}
                  onTouchStart={(e) => { e.stopPropagation(); handleMouseDown(e, 'tl'); }}
                ></div>
                <div 
                  className="crop-handle tr" 
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'tr'); }}
                  onTouchStart={(e) => { e.stopPropagation(); handleMouseDown(e, 'tr'); }}
                ></div>
                <div 
                  className="crop-handle bl" 
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'bl'); }}
                  onTouchStart={(e) => { e.stopPropagation(); handleMouseDown(e, 'bl'); }}
                ></div>
                <div 
                  className="crop-handle br" 
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'br'); }}
                  onTouchStart={(e) => { e.stopPropagation(); handleMouseDown(e, 'br'); }}
                ></div>

                {/* Rule of thirds lines */}
                <div className="crop-grid-line h-1"></div>
                <div className="crop-grid-line h-2"></div>
                <div className="crop-grid-line v-1"></div>
                <div className="crop-grid-line v-2"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="crop-info-meta">
            <span>Selection: {Math.round(cropBox.width)}% × {Math.round(cropBox.height)}%</span>
          </div>
          <div className="footer-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={() => onSave(cropBox)}>
              Apply Lossless Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
