import '../styles/Header.css';

export default function Header() {
  return (
    <header className="main-header">
      <div className="header-logo">
        <div className="logo-icon logo-image-container">
          <img src="/image.png" alt="Indocreonix Logo" className="logo-img-branding" />
        </div>
        <div className="logo-meta">
          <h1>Indocreonix</h1>
          <p>Premium Lossless PDF Maker</p>
        </div>
      </div>
      <div className="header-badge">
        <span className="badge-pulsar"></span>
        <span className="badge-text">100% Lossless Canvas</span>
      </div>
    </header>
  );
}
