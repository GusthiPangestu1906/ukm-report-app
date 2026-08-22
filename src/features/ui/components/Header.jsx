import React, { useState, useEffect, useRef } from 'react';
import logoMedfo from '../../../assets/Medfo.png';

const CONTACT_PHONE = '6282334015531';
const CONTACT_DISPLAY = '0823-3401-5531';

const Header = ({ publicSpreadsheetUrl }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="card-top-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '1px solid rgba(217, 70, 239, 0.12)',
      gap: '12px',
      position: 'relative'
    }}>
      {/* Left: Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src={logoMedfo}
          alt="Medfo Logo"
          className="header-logo"
        />
        <div>
          <h2 className="form-title" style={{ margin: 0, textAlign: 'left', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: '#1e1b4b' }}>
            Formulir Pelaporan
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Laporan Kegiatan UKM</span>
        </div>
      </div>

      {/* Right: Hamburger menu */}
      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          title="Menu"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '5px',
            width: '40px',
            height: '40px',
            background: menuOpen
              ? 'linear-gradient(135deg, rgba(217, 70, 239, 0.12), rgba(147, 51, 234, 0.1))'
              : 'transparent',
            border: '1px solid',
            borderColor: menuOpen ? 'rgba(217, 70, 239, 0.35)' : 'rgba(217, 70, 239, 0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            padding: 0,
          }}
        >
          <span style={{ display: 'block', width: '18px', height: '2px', borderRadius: '2px', background: menuOpen ? '#9333ea' : '#64748b', transition: 'background 0.2s' }} />
          <span style={{ display: 'block', width: '18px', height: '2px', borderRadius: '2px', background: menuOpen ? '#9333ea' : '#64748b', transition: 'background 0.2s' }} />
          <span style={{ display: 'block', width: '18px', height: '2px', borderRadius: '2px', background: menuOpen ? '#9333ea' : '#64748b', transition: 'background 0.2s' }} />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '240px',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(88, 28, 135, 0.15), 0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(217, 70, 239, 0.15)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {/* Header dropdown */}
            <div style={{
              padding: '14px 16px 10px',
              background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.06) 0%, rgba(147, 51, 234, 0.04) 100%)',
              borderBottom: '1px solid rgba(217, 70, 239, 0.1)',
            }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#9333ea', letterSpacing: '0.4px' }}>
                BUTUH BANTUAN?
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                Hubungi admin jika ada error
              </p>
            </div>

            {/* WhatsApp contact */}
            <div style={{ padding: '12px 16px' }}>
              <a
                href={`https://wa.me/${CONTACT_PHONE}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(37, 211, 102, 0.07)',
                  border: '1px solid rgba(37, 211, 102, 0.25)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(37, 211, 102, 0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(37, 211, 102, 0.07)'}
              >
                {/* WhatsApp icon */}
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="#25D366"/>
                  <path d="M22.8 9.2C21.1 7.5 18.8 6.5 16.3 6.5C11.1 6.5 6.9 10.7 6.9 15.9C6.9 17.6 7.4 19.3 8.2 20.7L6.8 25.5L11.7 24.1C13.1 24.9 14.7 25.3 16.3 25.3C21.5 25.3 25.7 21.1 25.7 15.9C25.7 13.3 24.7 11 22.8 9.2ZM16.3 23.7C14.9 23.7 13.5 23.3 12.3 22.6L12 22.4L9 23.3L9.9 20.4L9.7 20.1C8.9 18.8 8.5 17.4 8.5 15.9C8.5 11.6 12 8.1 16.3 8.1C18.4 8.1 20.3 8.9 21.8 10.4C23.2 11.8 24.1 13.8 24.1 15.9C24.1 20.2 20.6 23.7 16.3 23.7ZM20.5 17.9C20.3 17.8 19.2 17.2 19 17.1C18.8 17 18.7 17 18.6 17.2C18.4 17.4 18 17.9 17.9 18.1C17.8 18.2 17.7 18.2 17.5 18.1C16.3 17.5 15.5 17 14.7 15.7C14.5 15.4 14.8 15.4 15.1 14.8C15.2 14.6 15.1 14.5 15.1 14.4C15 14.2 14.5 13.1 14.3 12.6C14.1 12.1 13.9 12.2 13.8 12.2C13.7 12.2 13.5 12.2 13.4 12.2C13.2 12.2 13 12.3 12.8 12.5C12.6 12.7 12 13.3 12 14.4C12 15.5 12.8 16.5 12.9 16.7C13 16.8 14.5 19.1 16.7 20.1C18.2 20.8 18.8 20.8 19.5 20.7C20 20.6 20.9 20.1 21.1 19.5C21.3 18.9 21.3 18.4 21.2 18.3C21.1 18.1 20.8 18 20.5 17.9Z" fill="white"/>
                </svg>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>Chat WhatsApp</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Gusthi · {CONTACT_DISPLAY}</p>
                </div>
              </a>
            </div>

            {/* Spreadsheet link (jika ada) */}
            {publicSpreadsheetUrl && (
              <div style={{ padding: '0 16px 12px' }}>
                <a
                  href={publicSpreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    color: '#059669',
                    fontSize: '12px',
                    fontWeight: '700',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Buka Spreadsheet
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
