import React from 'react';

const TabNavigation = ({ activeTab, setActiveTab, queueLength }) => (
  <div className="staff-tabs-wrapper">
    <button
      onClick={() => setActiveTab('form')}
      className={`staff-tab-button ${activeTab === 'form' ? 'active' : ''}`}
    >
      📝 <span className="hide-on-mobile">FORMULIR </span>INPUT
    </button>
    <button
      onClick={() => setActiveTab('queue')}
      className={`staff-tab-button ${activeTab === 'queue' ? 'active' : ''}`}
    >
      🚀 ANTREAN<span className="hide-on-mobile"> PENGIRIMAN</span> {queueLength > 0 && <span className="queue-badge-cool">{queueLength}</span>}
    </button>
  </div>
);

export default TabNavigation;
