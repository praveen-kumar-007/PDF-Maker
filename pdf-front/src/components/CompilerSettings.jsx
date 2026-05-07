import { useState } from 'react';
import { 
  Settings, RefreshCw, FileText, CheckCircle2, 
  Lock, Hash, Sliders, Type, HelpCircle, Eye, EyeOff 
} from 'lucide-react';
import '../styles/CompilerSettings.css';

export default function CompilerSettings({
  pageSizeSetting,
  setPageSizeSetting,
  marginSetting,
  setMarginSetting,
  qualitySetting,
  setQualitySetting,
  watermarkText,
  setWatermarkText,
  watermarkColor,
  setWatermarkColor,
  watermarkOpacity,
  setWatermarkOpacity,
  watermarkSize,
  setWatermarkSize,
  addPageNumbers,
  setAddPageNumbers,
  pageNumberPosition,
  setPageNumberPosition,
  pdfFilename,
  setPdfFilename,
  isCompiling,
  compileStep,
  compileSuccess,
  onCompile
}) {
  return (
    <div className="compiler-controls-panel card animate-slide-up">
      <div className="panel-title-row">
        <Settings className="settings-icon" />
        <h3>AeroPDF Premium Compiler</h3>
      </div>
      
      <div className="settings-sections-wrapper">
        {/* SECTION 1: Layout & Page Size */}
        <div className="settings-section">
          <h4 className="section-title">
            <Sliders size={14} className="section-icon" />
            <span>Layout &amp; Dimensions</span>
          </h4>
          <div className="settings-grid-sub">
            <div className="setting-col">
              <label className="setting-label">PDF Page Layout</label>
              <div className="toggle-group-three">
                <button 
                  type="button" 
                  className={`toggle-btn ${pageSizeSetting === 'original' ? 'active' : ''}`}
                  onClick={() => setPageSizeSetting('original')}
                >
                  Original Size
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${pageSizeSetting === 'a4' ? 'active' : ''}`}
                  onClick={() => setPageSizeSetting('a4')}
                >
                  Standard A4
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${pageSizeSetting === 'letter' ? 'active' : ''}`}
                  onClick={() => setPageSizeSetting('letter')}
                >
                  US Letter
                </button>
              </div>
              <p className="setting-desc">
                {pageSizeSetting === 'original' 
                  ? 'Zero-loss. Sized to match source physical pixel dimensions exactly.' 
                  : `Fits images to standard ${pageSizeSetting.toUpperCase()} size with auto-rotation.`}
              </p>
            </div>

            <div className="setting-col">
              <label className={`setting-label ${pageSizeSetting === 'original' ? 'disabled' : ''}`}>Page Margins</label>
              <div className="toggle-group-three">
                <button 
                  type="button" 
                  className={`toggle-btn ${pageSizeSetting === 'original' ? 'disabled' : ''} ${marginSetting === 'none' && pageSizeSetting !== 'original' ? 'active' : ''}`}
                  onClick={() => pageSizeSetting !== 'original' && setMarginSetting('none')}
                  disabled={pageSizeSetting === 'original'}
                >
                  None
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${pageSizeSetting === 'original' ? 'disabled' : ''} ${marginSetting === 'thin' && pageSizeSetting !== 'original' ? 'active' : ''}`}
                  onClick={() => pageSizeSetting !== 'original' && setMarginSetting('thin')}
                  disabled={pageSizeSetting === 'original'}
                >
                  Thin
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${pageSizeSetting === 'original' ? 'disabled' : ''} ${marginSetting === 'standard' && pageSizeSetting !== 'original' ? 'active' : ''}`}
                  onClick={() => pageSizeSetting !== 'original' && setMarginSetting('standard')}
                  disabled={pageSizeSetting === 'original'}
                >
                  Standard
                </button>
              </div>
              <p className="setting-desc">
                {pageSizeSetting === 'original'
                  ? 'Margins disabled for original pixel bleed.'
                  : marginSetting === 'none'
                    ? 'Full-bleed layout. Images cover the entire page.'
                    : `Elegant padding around your content (${marginSetting === 'thin' ? '10pt' : '20pt'}).`}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Compression & File Size */}
        <div className="settings-section">
          <h4 className="section-title">
            <Sliders size={14} className="section-icon" />
            <span>Optimization &amp; Compression</span>
          </h4>
          <div className="setting-col">
            <label className="setting-label">Image Compression Mode</label>
            <div className="toggle-group-three">
              <button 
                type="button" 
                className={`toggle-btn ${qualitySetting === 'original' ? 'active' : ''}`}
                onClick={() => setQualitySetting('original')}
              >
                Lossless (Original)
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${qualitySetting === 'balanced' ? 'active' : ''}`}
                onClick={() => setQualitySetting('balanced')}
                title="80% Quality JPEG"
              >
                Balanced
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${qualitySetting === 'compact' ? 'active' : ''}`}
                onClick={() => setQualitySetting('compact')}
                title="50% Quality JPEG + Downscale"
              >
                Compact (Small)
              </button>
            </div>
            <p className="setting-desc">
              {qualitySetting === 'original' 
                ? 'Absolute original file byte insertion. Best for printing and highest fidelity.' 
                : qualitySetting === 'balanced'
                  ? 'Compresses photos to 80% JPEG. Greatly reduces size while keeping images very crisp.'
                  : 'Compresses to 50% JPEG and caps dimensions at 1200px. Perfect for fast email and strict portal uploads.'}
            </p>
          </div>
        </div>

        {/* SECTION 3: Branding & Document Marking */}
        <div className="settings-section">
          <h4 className="section-title">
            <Type size={14} className="section-icon" />
            <span>Watermarks &amp; Page Numbers</span>
          </h4>
          <div className="settings-grid-sub">
            {/* Watermark controls */}
            <div className="setting-col">
              <label className="setting-label">Diagonal Watermark Text</label>
              <input 
                type="text" 
                className="text-input-premium"
                placeholder="e.g. CONFIDENTIAL"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
              />
              {watermarkText.trim() !== '' && (
                <div className="watermark-subcontrols animate-fade-in">
                  <div className="subcontrol-row">
                    <span className="subcontrol-lbl">Size ({watermarkSize}px)</span>
                    <input 
                      type="range" 
                      min="14" 
                      max="100" 
                      value={watermarkSize} 
                      onChange={(e) => setWatermarkSize(Number(e.target.value))}
                      className="slider-premium"
                    />
                  </div>
                  <div className="subcontrol-row">
                    <span className="subcontrol-lbl">Opacity ({Math.round(watermarkOpacity * 100)}%)</span>
                    <input 
                      type="range" 
                      min="0.05" 
                      max="0.80" 
                      step="0.05"
                      value={watermarkOpacity} 
                      onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                      className="slider-premium"
                    />
                  </div>
                  <div className="subcontrol-row">
                    <span className="subcontrol-lbl">Text Color</span>
                    <div className="color-picker-wrap">
                      <input 
                        type="color" 
                        value={watermarkColor} 
                        onChange={(e) => setWatermarkColor(e.target.value)}
                        className="color-picker-premium"
                      />
                      <span className="color-code">{watermarkColor.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Page number controls */}
            <div className="setting-col">
              <label className="setting-label">Automatic Page Numbers</label>
              <div className="toggle-group">
                <button 
                  type="button" 
                  className={`toggle-btn ${!addPageNumbers ? 'active' : ''}`}
                  onClick={() => setAddPageNumbers(false)}
                >
                  Disabled
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${addPageNumbers ? 'active' : ''}`}
                  onClick={() => setAddPageNumbers(true)}
                >
                  Enabled
                </button>
              </div>

              {addPageNumbers && (
                <div className="number-subcontrols animate-fade-in">
                  <span className="subcontrol-lbl">Stamping Alignment:</span>
                  <div className="toggle-group-three" style={{ marginTop: '4px' }}>
                    <button 
                      type="button" 
                      className={`toggle-btn ${pageNumberPosition === 'left' ? 'active' : ''}`}
                      onClick={() => setPageNumberPosition('left')}
                    >
                      Bottom Left
                    </button>
                    <button 
                      type="button" 
                      className={`toggle-btn ${pageNumberPosition === 'center' ? 'active' : ''}`}
                      onClick={() => setPageNumberPosition('center')}
                    >
                      Bottom Center
                    </button>
                    <button 
                      type="button" 
                      className={`toggle-btn ${pageNumberPosition === 'right' ? 'active' : ''}`}
                      onClick={() => setPageNumberPosition('right')}
                    >
                      Bottom Right
                    </button>
                  </div>
                  <button 
                    type="button" 
                    className={`toggle-btn ${pageNumberPosition === 'top-right' ? 'active' : ''}`}
                    onClick={() => setPageNumberPosition('top-right')}
                    style={{ marginTop: '4px', width: '100%' }}
                  >
                    Top Right
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: Output File Settings */}
        <div className="settings-section">
          <h4 className="section-title">
            <FileText size={14} className="section-icon" />
            <span>Output File Specifications</span>
          </h4>
          <div className="setting-col">
            <label className="setting-label">Compiled PDF Filename</label>
            <div className="filename-input-wrap">
              <input 
                type="text" 
                className="text-input-premium"
                placeholder="e.g. AeroPDF_Compiled"
                value={pdfFilename}
                onChange={(e) => setPdfFilename(e.target.value)}
              />
            </div>
            <p className="setting-desc">
              Type a customized name for your PDF. Special characters will be automatically sanitized to ensure cross-system compatibility.
            </p>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="panel-actions-row">
        <div className="security-badge-desc">
          🛡️ <strong>100% Local Processing:</strong> Your files are compiled entirely inside your browser. No files are uploaded to any server, guaranteeing absolute data privacy.
        </div>
        <button 
          type="button" 
          className="btn-compile-pdf"
          onClick={onCompile}
          disabled={isCompiling}
        >
          {isCompiling ? (
            <>
              <RefreshCw className="animate-spin" size={18} />
              <span>{compileStep || 'Processing...'}</span>
            </>
          ) : (
            <>
              <FileText size={18} />
              <span>Compile Premium PDF</span>
            </>
          )}
        </button>
      </div>

      {compileSuccess && (
        <div className="success-toast">
          <CheckCircle2 className="toast-icon" />
          <span>Success! PDF Compiled and download started successfully.</span>
        </div>
      )}
    </div>
  );
}
