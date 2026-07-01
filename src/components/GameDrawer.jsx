import { useState, useEffect } from 'react';
import { DRAWER_CATEGORIES } from '../constants/gameData';

export default function GameDrawer({ isOpen, onClose, onSelectGame, gameTimers = {}, activeGameId }) {
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

  // When the drawer opens, jump to the category that holds the currently active game
  useEffect(() => {
    if (!isOpen || !activeGameId) return;
    const owningCat = DRAWER_CATEGORIES.find(cat =>
      cat.games.some(game => game.id === activeGameId)
    );
    if (owningCat) setActiveCategory(owningCat.id);
  }, [isOpen, activeGameId]);

  // Format seconds to HH:MM:SS format (or MM:SS since it's short)
  const formatCountdown = (totalSeconds) => {
    if (!totalSeconds) return '00:00:00';
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  // Category icons live in /public/gametype/<name>-1.png (inactive) and -2.png (active).
  const CATEGORY_ICON_BASE = {
    lhc: '六合彩',
    pk10: 'PK10',
    ffc: '分分',
    k3: '快三',
    xy28: '28',
  };

  const renderCategoryIcon = (catId, isActive) => {
    const base = CATEGORY_ICON_BASE[catId];
    if (!base) return null;
    const src = `${import.meta.env.BASE_URL}gametype/${encodeURIComponent(base)}-${isActive ? 2 : 1}.png`;
    return <img className="tab-icon" src={src} alt="" />;
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
                {renderCategoryIcon(cat.id, isActive)}
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
              const isSelected = game.id === activeGameId;
              const timeLeft = gameTimers[game.id] !== undefined ? gameTimers[game.id] : timers[game.id];

              return (
                <div
                  key={game.id}
                  className={`drawer-game-card ${isClosed ? 'closed' : 'active'} ${isSelected ? 'selected' : ''}`}
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
