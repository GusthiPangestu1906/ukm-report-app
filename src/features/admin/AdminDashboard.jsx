import React, { useState, useEffect } from 'react';
import DatabaseConfig from './DatabaseConfig';

export default function AdminDashboard(props) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: isMobile ? '10px auto' : '20px auto', 
      padding: isMobile ? '0 8px' : '0',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        border: '1px solid var(--neon-yellow)', 
        padding: isMobile ? '16px 12px' : '24px', 
        borderRadius: '12px', 
        background: 'var(--bg-card, rgba(10, 10, 12, 0.6))',
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.05)',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        
        <div style={{ 
          textAlign: 'center', 
          fontFamily: 'var(--font-tech)', 
          fontSize: isMobile ? '15px' : '18px', 
          fontWeight: 'bold', 
          letterSpacing: '2px', 
          color: 'var(--neon-yellow)', 
          marginBottom: '25px'
        }}>
          DASHBOARD INFRASTRUKTUR
        </div>

        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <DatabaseConfig {...props} isMobile={isMobile} />
        </div>
        
      </div>
    </div>
  );
}