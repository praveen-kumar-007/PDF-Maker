import { Settings, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import '../styles/CompilerSettings.css';

export default function CompilerSettings({
  pageSizeSetting,
  setPageSizeSetting,
  marginSetting,
  setMarginSetting,
  isCompiling,
  compileStep,
  compileSuccess,
  onCompile
}) {
  return (
    <div className="compiler-controls-panel card">
      <div className="panel-title-row">
        <Settings className="settings-icon" />
        <h3>Compiler Settings</h3>
      </div>
      
      <div className="settings-grid">
        {/* Page size settings */}
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
              ? 'Zero-loss. Each PDF page is dynamically sized to the exact physical pixel dimensions of your image.' 
              : pageSizeSetting === 'a4'
                ? 'Resizes pages to standard A4 (595 × 842 pt) with dynamic auto-orientation to fit images perfectly.'
                : 'Resizes pages to standard US Letter (612 × 792 pt) with dynamic auto-orientation to fit images perfectly.'}
          </p>
        </div>

        {/* Margin settings */}
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
              ? 'Margins are disabled because each page is custom-tailored to fit the image bleed area exactly.'
              : marginSetting === 'none'
                ? 'Full-bleed layout. Images stretch to cover the entire page boundary without borders.'
                : marginSetting === 'thin'
                  ? 'Applies a thin, elegant 10pt border padding around your page content.'
                  : 'Applies a professional 20pt border padding around your page content.'}
          </p>
        </div>
      </div>

      {/* Action row */}
      <div className="panel-actions-row">
        <div className="security-badge-desc">
          🛡️ <strong>100% Local Processing:</strong> Your images are compiled entirely inside your browser. No files are uploaded to any server, guaranteeing absolute data privacy.
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
              <span>Compile Lossless PDF</span>
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
