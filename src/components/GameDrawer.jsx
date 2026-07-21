import { useState, useEffect } from 'react';
import { DRAWER_CATEGORIES } from '../constants/gameData';

// Flat lookup of every game by id, so we can resolve the "常用" recent list.
const GAME_BY_ID = {};
DRAWER_CATEGORIES.forEach(cat => {
  cat.games.forEach(game => { GAME_BY_ID[game.id] = game; });
});

export default function GameDrawer({ isOpen, onClose, onSelectGame, gameTimers = {}, activeGameId, recentGameIds = [] }) {
  const [activeCategory, setActiveCategory] = useState('recent'); // Default to 常用
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
    animal: '动物',
    ffc: '分分',
    k3: '快三',
    xy28: '28',
  };

  // 「常用」用内联星形图标（没有对应 PNG），active 时蓝色，未选中时灰色。
  const starIconSrc = (isActive) => {
    const color = isActive ? '#547cfd' : '#94a3b8';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}"><path d="M12 2.5l2.7 6.5 7 .6-5.3 4.6 1.6 6.8L12 17.9 5.9 21l1.6-6.8L2.3 9.6l7-.6z"/></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  // 鱼虾蟹 无对应 PNG，用内联鱼形图标，配色规则同 starIcon。
  const fishIconSrc = (isActive) => {
    const color = isActive ? '#547cfd' : '#94a3b8';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}"><path d="M2 12c3-5 8-6 12-6 3.6 0 6.4 1.9 8 6-1.6 4.1-4.4 6-8 6-4 0-9-1-12-6zm20-4l-3.5 4L22 16V8zM8.5 10.5a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z"/></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const categoryIconSrc = (catId, isActive) => {
    if (catId === 'recent') return starIconSrc(isActive);
    if (catId === 'fhc') return fishIconSrc(isActive);
    const base = CATEGORY_ICON_BASE[catId];
    if (!base) return null;
    return `${import.meta.env.BASE_URL}gametype/${encodeURIComponent(base)}-${isActive ? 2 : 1}.png`;
  };

  const renderCategoryIcon = (catId, isActive) => {
    const src = categoryIconSrc(catId, isActive);
    if (!src) return null;
    return <img className="tab-icon" src={src} alt="" />;
  };

  // 「常用」分类：把最近玩过的 id 还原成游戏对象，最多 6 个。始终作为第一个分类显示。
  const recentGames = recentGameIds
    .map(id => GAME_BY_ID[id])
    .filter(Boolean)
    .slice(0, 6);
  const categories = [{ id: 'recent', name: '常用', games: recentGames }, ...DRAWER_CATEGORIES];

  const activeCategoryData = categories.find(cat => cat.id === activeCategory);

  return (
    <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div 
        className={`drawer-panel ${isOpen ? 'open' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side Tab Menu */}
        <div className="drawer-sidebar">
          {categories.map(cat => {
            const isActive = cat.id === activeCategory;
            const iconSrc = categoryIconSrc(cat.id, isActive);
            return (
              <button
                key={cat.id}
                type="button"
                className={`drawer-sidebar-tab ${isActive ? 'active' : ''}`}
                style={iconSrc ? { '--tab-icon-url': `url("${iconSrc}")` } : undefined}
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
          {activeCategory === 'recent' && recentGames.length === 0 && (
            <div className="drawer-recent-empty">暂无常用游戏，选择游戏后自动记录</div>
          )}
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
