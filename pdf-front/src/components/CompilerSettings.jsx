import { useState } from 'react';
import { 
  Settings, RefreshCw, FileText, CheckCircle2, 
  Lock, Hash, Sliders, Type, HelpCircle, Eye, EyeOff, Activity 
} from 'lucide-react';
import '../styles/CompilerSettings.css';

export default function CompilerSettings({
  images,
  pageSizeSetting,
  setPageSizeSetting,
  marginSetting,
  setMarginSetting,
  compressionMode,
  setCompressionMode,
  targetSizeMB,
  setTargetSizeMB,
  compressionPercent,
  setCompressionPercent,
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
  // Analytics calculations
  const calculateTelemetry = () => {
    if (!images || images.length === 0) {
      return { rawSizeMB: '0.00', estimatedSizeMB: '0.00', savingsPct: 0, savingsText: 'No assets loaded' };
    }
    
    let totalRawBytes = images.reduce((sum, img) => sum + (img.size || 0), 0);
    const rawSizeMB = (totalRawBytes / (1024 * 1024)).toFixed(2);
    
    let estSizeMBVal = 0;
    if (compressionMode === 'original') {
      const totalBytes = totalRawBytes + (images.length * 8000); // slight PDF markup overhead
      estSizeMBVal = totalBytes / (1024 * 1024);
    } else if (compressionMode === 'target-size') {
      const limit = targetSizeMB ? parseFloat(targetSizeMB) : 0.5;
      const rawMB = totalRawBytes / (1024 * 1024);
      estSizeMBVal = rawMB < limit ? rawMB : limit;
    } else {
      // Percentage-based quality
      const pct = compressionPercent / 100;
      const compressionFactor = 0.05 + 0.75 * Math.pow(pct, 1.8);
      const estimatedBytes = totalRawBytes * compressionFactor + (images.length * 8000);
      estSizeMBVal = estimatedBytes / (1024 * 1024);
    }

    // Ensure estimated is never larger than raw in compression modes
    if (compressionMode !== 'original' && estSizeMBVal > parseFloat(rawSizeMB)) {
      estSizeMBVal = parseFloat(rawSizeMB);
    }

    const estimatedSizeMB = estSizeMBVal.toFixed(2);
    
    // Space savings percentage
    const rawNum = parseFloat(rawSizeMB);
    const estNum = parseFloat(estimatedSizeMB);
    let savingsPct = 0;
    let savingsText = 'Keeping pristine source scale';
    
    if (rawNum > 0 && estNum < rawNum) {
      savingsPct = Math.round(((rawNum - estNum) / rawNum) * 100);
      savingsText = `Saved ${Math.round((rawNum - estNum) * 1024)} KB payload`;
    } else if (compressionMode === 'original') {
      savingsPct = 0;
      savingsText = 'Lossless output format';
    } else {
      savingsPct = 0;
      savingsText = 'No reduction needed';
    }

    return {
      rawSizeMB,
      estimatedSizeMB,
      savingsPct,
      savingsText
    };
  };

  const { rawSizeMB, estimatedSizeMB, savingsPct, savingsText } = calculateTelemetry();

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
              <span className="setting-label">PDF Page Layout</span>
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
              <span className={`setting-label ${pageSizeSetting === 'original' ? 'disabled' : ''}`}>Page Margins</span>
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
            <span className="setting-label">Image Compression Mode</span>
            <div className="toggle-group-three">
              <button 
                type="button" 
                className={`toggle-btn ${compressionMode === 'original' ? 'active' : ''}`}
                onClick={() => setCompressionMode('original')}
              >
                Lossless (Original)
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${compressionMode === 'target-size' ? 'active' : ''}`}
                onClick={() => setCompressionMode('target-size')}
                title="Target specific PDF size in MB"
              >
                Target File Size (MB)
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${compressionMode === 'percentage' ? 'active' : ''}`}
                onClick={() => setCompressionMode('percentage')}
                title="Compress by quality percentage scale"
              >
                Custom Quality (%)
              </button>
            </div>
            
            {compressionMode === 'original' && (
              <p className="setting-desc animate-fade-in">
                Absolute original file byte insertion. Best for printing and highest document fidelity.
              </p>
            )}

            {compressionMode === 'target-size' && (
              <div className="target-size-controls animate-fade-in">
                <label htmlFor="targetSizeMB" className="setting-label-sub">Desired PDF Size</label>
                <div className="input-with-addon">
                  <input 
                    id="targetSizeMB"
                    name="targetSizeMB"
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="100"
                    placeholder="e.g. 0.5"
                    value={targetSizeMB}
                    onChange={(e) => setTargetSizeMB(e.target.value)}
                    className="text-input-premium input-addon-field"
                  />
                  <span className="input-addon-text">MB</span>
                </div>
                <p className="setting-desc">
                  Our compile engine will dynamically scale and compress each page to fit the final PDF under <strong>{targetSizeMB || '0.5'} MB</strong>. Great for portal uploads!
                </p>
              </div>
            )}

            {compressionMode === 'percentage' && (
              <div className="percentage-controls animate-fade-in">
                <div className="percentage-header-row">
                  <span className="setting-label-sub">Quality Level Track</span>
                  <span className="percentage-badge">{compressionPercent}% Quality</span>
                </div>
                <div className="slider-percentage-wrap">
                  <input 
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={compressionPercent}
                    onChange={(e) => setCompressionPercent(parseInt(e.target.value, 10))}
                    className="slider-percentage"
                    style={{ '--slider-pct': `${compressionPercent}%` }}
                  />
                  <div className="slider-percentage-fill" style={{ width: `${compressionPercent}%` }}></div>
                </div>
                <div className="slider-labels">
                  <span>10% (Smallest Size)</span>
                  <span>50% (Balanced)</span>
                  <span>100% (High Quality)</span>
                </div>
                <p className="setting-desc">
                  Drag the line to adjust. Lower quality produces a significantly lighter file size but reduces resolution clarity.
                </p>
              </div>
            )}
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
              <label htmlFor="watermarkText" className="setting-label">Diagonal Watermark Text</label>
              <input 
                id="watermarkText"
                name="watermarkText"
                type="text" 
                className="text-input-premium"
                placeholder="e.g. CONFIDENTIAL"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
              />
              {watermarkText.trim() !== '' && (
                <div className="watermark-subcontrols animate-fade-in">
                  <div className="subcontrol-row">
                    <label htmlFor="watermarkSize" className="subcontrol-lbl">Size ({watermarkSize}px)</label>
                    <input 
                      id="watermarkSize"
                      name="watermarkSize"
                      type="range" 
                      min="14" 
                      max="100" 
                      value={watermarkSize} 
                      onChange={(e) => setWatermarkSize(Number(e.target.value))}
                      className="slider-premium"
                    />
                  </div>
                  <div className="subcontrol-row">
                    <label htmlFor="watermarkOpacity" className="subcontrol-lbl">Opacity ({Math.round(watermarkOpacity * 100)}%)</label>
                    <input 
                      id="watermarkOpacity"
                      name="watermarkOpacity"
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
                    <label htmlFor="watermarkColor" className="subcontrol-lbl">Text Color</label>
                    <div className="color-picker-wrap">
                      <input 
                        id="watermarkColor"
                        name="watermarkColor"
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
              <span className="setting-label">Automatic Page Numbers</span>
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
            <label htmlFor="pdfFilename" className="setting-label">Compiled PDF Filename</label>
            <div className="filename-input-wrap">
              <input 
                id="pdfFilename"
                name="pdfFilename"
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

        {/* SECTION 5: Real-time Telemetry & Analytics */}
        <div className="settings-section telemetry-section animate-fade-in">
          <h4 className="section-title">
            <Activity size={14} className="section-icon" />
            <span>AeroEngine Real-Time Telemetry</span>
          </h4>
          <div className="telemetry-grid">
            <div className="telemetry-card">
              <span className="telemetry-lbl">Input PDF Weight</span>
              <span className="telemetry-val">{rawSizeMB} MB</span>
              <span className="telemetry-sub">{images.length} physical {images.length === 1 ? 'page asset' : 'page assets'}</span>
            </div>
            
            <div className="telemetry-card highlight">
              <span className="telemetry-lbl">Estimated Output Weight</span>
              <span className="telemetry-val">{estimatedSizeMB} MB</span>
              <span className="telemetry-sub">Predicted compiled size</span>
            </div>

            <div className="telemetry-card success">
              <span className="telemetry-lbl">Space Efficiency</span>
              <span className="telemetry-val">⚡ {savingsPct}% Saved</span>
              <span className="telemetry-sub">{savingsText}</span>
            </div>
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
