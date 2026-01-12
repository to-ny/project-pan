import './Header.css';

function Header({ title, showBack, onBack }) {
  return (
    <header className="header">
      {showBack && (
        <button className="header-back" onClick={onBack} aria-label="Retour">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      )}
      <h1 className="header-title">{title}</h1>
    </header>
  );
}

export default Header;
