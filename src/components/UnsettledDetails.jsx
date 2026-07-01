import React from 'react';
import { DRAWER_CATEGORIES } from '../constants/gameData';

export default function UnsettledDetails({
  onBack,
  onOpenMenu,
  placedBets = [],
  currentIssue = 958,
  addToast
}) {
  // Left picker = category (with a synthetic 全部游戏 at the top);
  // right picker = specific game within that category. Picking 全部游戏 disables
  // the right picker and shows every order.
  const CATEGORY_OPTIONS = [{ id: 'all', name: '全部游戏' }, ...DRAWER_CATEGORIES];
  const [categoryId, setCategoryId] = React.useState('all');
  const [gameId, setGameId] = React.useState(null);
  const [openMenu, setOpenMenu] = React.useState(null); // 'category' | 'game' | null

  const selectedCategory = CATEGORY_OPTIONS.find((c) => c.id === categoryId);
  const categoryGames = categoryId === 'all' ? [] : (selectedCategory.games || []);
  const selectedGameObj = categoryGames.find((g) => g.id === gameId);
  const selectedGameName = selectedGameObj ? selectedGameObj.name : '';

  const handleSelectCategory = (id) => {
    setCategoryId(id);
    const cat = CATEGORY_OPTIONS.find((c) => c.id === id);
    setGameId(id === 'all' ? null : cat.games[0].id);
    setOpenMenu(null);
  };

  const handleSelectGame = (id) => {
    setGameId(id);
    setOpenMenu(null);
  };

  // Helper to format full issue format: YYYYMMDD + 4-digit issue serial
  const formatFullIssue = (issue) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${String(issue).padStart(4, '0')}`;
  };

  // Helper to get formatted current time
  const formatCurrentTime = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Clipboard copy functions
  const handleCopy = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          if (addToast) addToast('复制成功', 'success');
        })
        .catch(() => {
          copyFallback(text);
        });
    } else {
      copyFallback(text);
    }
  };

  const copyFallback = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      if (addToast) addToast('复制成功', 'success');
    } catch (err) {
      console.error('Copy fallback failed', err);
    }
    document.body.removeChild(textArea);
  };

  // Static mock bets data matching the screenshot exactly
  const mockBets = React.useMemo(() => {
    return [
      {
        id: 'mock-1',
        gameName: '一分极速赛车',
        issue: '202606101013',
        orderId: '2064633253016285187',
        time: '06-10 16:58:21',
        rebate: '0%',
        amount: 10,
        winnable: 90,
        play: '冠军 3@10'
      },
      {
        id: 'mock-2',
        gameName: '一分极速赛车',
        issue: '202606101013',
        orderId: '2064633253016285186',
        time: '06-10 16:58:21',
        rebate: '0%',
        amount: 10,
        winnable: 90,
        play: '冠军 1@10'
      }
    ];
  }, []);

  // Format user-placed bets for rendering
  const formattedPlacedBets = React.useMemo(() => {
    return placedBets.map((bet, idx) => {
      // Deterministic order ID suffix based on the bet ID/index
      const randSuffix = String(Math.abs(bet.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + idx)).slice(-6).padStart(6, '0');
      const orderId = `2064633253016${randSuffix}`;
      
      const timeStr = bet.timestamp || formatCurrentTime();
      const winnable = Math.round(bet.amount * (bet.odds - 1));
      // 六合彩 bets carry their 盘口 (A~D); show it before the play description.
      const pankouPrefix = bet.pankou ? `${bet.pankou}盘 ` : '';
      const play = `${pankouPrefix}${bet.positionName} ${bet.betName}@${bet.amount}`;
      
      return {
        id: bet.id,
        gameName: bet.gameName || '一分极速赛车',
        issue: formatFullIssue(bet.issue || currentIssue),
        orderId,
        time: timeStr,
        rebate: '0%',
        amount: bet.amount,
        winnable,
        play
      };
    });
  }, [placedBets, currentIssue]);

  // Combine mock data and actual placed bets
  const allBets = React.useMemo(() => {
    return [...formattedPlacedBets, ...mockBets];
  }, [formattedPlacedBets, mockBets]);

  // Filter based on dropdown selection. 全部游戏 (category 'all') shows every order;
  // otherwise filter to the specific game selected in the right picker.
  const filteredBets = React.useMemo(() => {
    if (categoryId === 'all' || !selectedGameName) return allBets;
    return allBets.filter(bet => bet.gameName === selectedGameName);
  }, [allBets, categoryId, selectedGameName]);

  const totalCount = filteredBets.length;
  const totalAmount = filteredBets.reduce((acc, bet) => acc + bet.amount, 0);

  return (
    <div className="unsettled-detail-container">
      {/* Header */}
      <div className="unsettled-header">
        <button 
          type="button" 
          className="unsettled-back-btn" 
          onClick={onBack}
          title="返回"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="unsettled-title">未结明细</span>
        <button 
          type="button" 
          className="unsettled-menu-btn" 
          onClick={onOpenMenu} 
          title="菜单"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <div className="unsettled-body">
        {/* Dropdown Filters (drawer style) — left: category, right: specific game */}
        <div className="unsettled-filters-row">
          <div className="history-picker-wrap">
            <button
              type="button"
              className={`history-picker ${openMenu === 'category' ? 'open' : ''}`}
              onClick={() => setOpenMenu(openMenu === 'category' ? null : 'category')}
            >
              <span className="history-picker-value">{selectedCategory.name}</span>
              <svg className="history-picker-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openMenu === 'category' && (
              <div className="history-dropdown-menu">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`history-dropdown-item ${cat.id === categoryId ? 'active' : ''}`}
                    onClick={() => handleSelectCategory(cat.id)}
                  >
                    <span>{cat.name}</span>
                    {cat.id === categoryId && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="history-picker-wrap">
            <button
              type="button"
              className={`history-picker ${openMenu === 'game' ? 'open' : ''}`}
              disabled={categoryId === 'all'}
              onClick={() => setOpenMenu(openMenu === 'game' ? null : 'game')}
            >
              <span className="history-picker-value">{selectedGameName || ' '}</span>
              <svg className="history-picker-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openMenu === 'game' && categoryId !== 'all' && (
              <div className="history-dropdown-menu">
                {categoryGames.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`history-dropdown-item ${g.id === gameId ? 'active' : ''}`}
                    onClick={() => handleSelectGame(g.id)}
                  >
                    <span>{g.name}</span>
                    {g.id === gameId && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transparent click-catcher to close the dropdown when tapping outside */}
        {openMenu && (
          <div className="history-picker-backdrop" onClick={() => setOpenMenu(null)} />
        )}

        {/* Summary Banner Card */}
        <div className="unsettled-summary-card">
          <div className="summary-item">
            <span className="summary-label">总注数</span>
            <span className="summary-value">{totalCount}笔</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">总金额</span>
            <span className="summary-value">{totalAmount}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="unsettled-list">
          {filteredBets.length > 0 ? (
            filteredBets.map((bet, idx) => (
              <div key={bet.uid || `${bet.id}-${idx}`} className="unsettled-bet-card">
                <div className="bet-card-header">
                  {bet.gameName} <span className="issue-text">（期数：{bet.issue}）</span>
                </div>
                <div className="bet-card-body">
                  <div className="bet-detail-row full-width">
                    <span className="detail-label">注单：</span>
                    <span className="detail-value order-id-container">
                      {bet.orderId}
                      <button 
                        type="button" 
                        className="copy-btn" 
                        onClick={() => handleCopy(bet.orderId)}
                        title="复制单号"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </span>
                  </div>
                  <div className="bet-detail-grid">
                    <div className="bet-detail-column">
                      <div className="bet-detail-row">
                        <span className="detail-label">时间：</span>
                        <span className="detail-value">{bet.time}</span>
                      </div>
                      <div className="bet-detail-row">
                        <span className="detail-label">金额：</span>
                        <span className="detail-value">{bet.amount}</span>
                      </div>
                    </div>
                    <div className="bet-detail-column">
                      <div className="bet-detail-row">
                        <span className="detail-label">退水比例：</span>
                        <span className="detail-value highlight-blue">{bet.rebate}</span>
                      </div>
                      <div className="bet-detail-row">
                        <span className="detail-label">可赢金额：</span>
                        <span className="detail-value highlight-blue">{bet.winnable}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bet-detail-row full-width play-row">
                    <span className="detail-label">玩法：</span>
                    <span className="detail-value play-name-text">{bet.play}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="unsettled-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>暂无未结明细</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
