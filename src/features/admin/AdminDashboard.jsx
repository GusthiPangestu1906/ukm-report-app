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
    <div style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <DatabaseConfig {...props} isMobile={isMobile} />
        </div>
  );
}