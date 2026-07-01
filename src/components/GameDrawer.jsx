import { useState, useEffect } from 'react';
import { DRAWER_CATEGORIES } from '../constants/gameData';

export default function GameDrawer({ isOpen, onClose, onSelectGame, gameTimers = {} }) {
  const [activeCategory, setActiveCategory] = useState('pk10'); // Default to PK10
  const [timers, setTimers] = useState(() => {
    const initialTimers = {};
    DRAWER_CATEGORIES.forEach(cat => {
      cat.games.forEach(game => {
        if (game.status === 'active') {
          initialTimers[game.id] = game.initialTime || 30;
        }
      });
    });
    return initialTimers;
  });

  // Timer interval loop (runs only when drawer is open)
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(gameId => {
          if (next[gameId] <= 1) {
            // Reset to a random value between 30 and 75 seconds to keep it dynamic
            next[gameId] = Math.floor(Math.random() * 45) + 30;
          } else {
            next[gameId] = next[gameId] - 1;
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Format seconds to HH:MM:SS format (or MM:SS since it's short)
  const formatCountdown = (totalSeconds) => {
    if (!totalSeconds) return '00:00:00';
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  // Icon renderer for categories
  const renderCategoryIcon = (catId) => {
    switch (catId) {
      case 'lhc':
        // Two overlapping lottery balls with shine + a "6"
        return (
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="15.5" cy="9" r="4.8" />
            <path d="M13.4 6.5a3 3 0 0 1 2.4-.7" opacity="0.7" />
            <circle cx="8.5" cy="14.5" r="5.6" fill="currentColor" fillOpacity="0.12" />
            <path d="M5.7 11.9a3.4 3.4 0 0 1 2.6-1" opacity="0.7" />
            <text x="8.5" y="17.4" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="currentColor" stroke="none">6</text>
          </svg>
        );
      case 'pk10':
        // Checkered racing flag on a pole
        return (
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="3" x2="5" y2="21.5" />
            <rect x="5" y="4" width="14" height="10" rx="0.6" />
            <g fill="currentColor" stroke="none">
              <rect x="5" y="4" width="3.5" height="3.33" />
              <rect x="12" y="4" width="3.5" height="3.33" />
              <rect x="8.5" y="7.33" width="3.5" height="3.34" />
              <rect x="15.5" y="7.33" width="3.5" height="3.34" />
              <rect x="5" y="10.67" width="3.5" height="3.33" />
              <rect x="12" y="10.67" width="3.5" height="3.33" />
            </g>
          </svg>
        );
      case 'ffc':
        // Clock face with tick marks, hands and a "60" marker
        return (
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9.2" />
            <path d="M12 3.2v1.6M12 19.2v1.6M20.8 12h-1.6M4.8 12H3.2" />
            <polyline points="12 7 12 12 15.5 13.8" />
            <text x="12" y="9.6" textAnchor="middle" fontSize="4.6" fontWeight="700" fill="currentColor" stroke="none">60</text>
          </svg>
        );
      case 'k3':
        // Isometric 3D dice cube with pips on the three visible faces
        return (
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.5 20.5 7 12 11.5 3.5 7Z" />
            <path d="M3.5 7 12 11.5 12 21 3.5 16.5Z" fill="currentColor" fillOpacity="0.08" />
            <path d="M20.5 7 12 11.5 12 21 20.5 16.5Z" fill="currentColor" fillOpacity="0.16" />
            <circle cx="12" cy="6.9" r="1" fill="currentColor" stroke="none" />
            <circle cx="6.6" cy="11.3" r="0.95" fill="currentColor" stroke="none" />
            <circle cx="8.9" cy="15.6" r="0.95" fill="currentColor" stroke="none" />
            <circle cx="15.3" cy="10.6" r="0.95" fill="currentColor" stroke="none" />
            <circle cx="17.4" cy="14.3" r="0.95" fill="currentColor" stroke="none" />
          </svg>
        );
      case 'xy28':
        return <span className="tab-icon-num">28</span>;
      default:
        return null;
    }
  };

  const activeCategoryData = DRAWER_CATEGORIES.find(cat => cat.id === activeCategory);

  return (
    <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div 
        className={`drawer-panel ${isOpen ? 'open' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side Tab Menu */}
        <div className="drawer-sidebar">
          {DRAWER_CATEGORIES.map(cat => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                type="button"
                className={`drawer-sidebar-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {renderCategoryIcon(cat.id)}
                <span className="drawer-tab-name">{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side Game List Grid */}
        <div className="drawer-content">
          <div className="drawer-game-grid">
            {activeCategoryData && activeCategoryData.games.map(game => {
              const isClosed = game.status === 'closed';
              const timeLeft = gameTimers[game.id] !== undefined ? gameTimers[game.id] : timers[game.id];

              return (
                <div 
                  key={game.id} 
                  className={`drawer-game-card ${isClosed ? 'closed' : 'active'}`}
                  onClick={() => onSelectGame(game)}
                >
                  <div className="game-card-name">{game.name}</div>
                  <div className="game-card-status">
                    {isClosed ? (
                      <span className="game-status-closed">已封盘</span>
                    ) : (
                      <span className="game-status-time">{formatCountdown(timeLeft)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
