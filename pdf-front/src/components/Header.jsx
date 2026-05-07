import { Sparkles } from 'lucide-react';
import '../styles/Header.css';

export default function Header() {
  return (
    <header className="main-header">
      <div className="header-logo">
        <div className="logo-icon">
          <Sparkles className="icon-sparkle animate-pulse" />
        </div>
        <div className="logo-meta">
          <h1>AeroPDF</h1>
          <p>Lossless Multi-Page Image Compiler</p>
        </div>
      </div>
      <div className="header-badge">
        <span className="badge-pulsar"></span>
        <span className="badge-text">100% Lossless Canvas</span>
      </div>
    </header>
  );
}
