import React from 'react';
import { PK10_COLORS, DRAWER_CATEGORIES } from '../constants/gameData';

export default function SettledDetails({
  onBack,
  onOpenMenu,
  settledBets = [],
  addToast
}) {
  const [resultModalData, setResultModalData] = React.useState(null);

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
    if (String(issue).length >= 10) return issue;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const cleanIssue = String(issue).replace(/\D/g, '');
    const padded = cleanIssue.padStart(4, '0');
    return `${yyyy}${mm}${dd}${padded}`;
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
        id: 'mock-settled-1',
        gameName: '一分极速赛车',
        issue: '202606160529',
        orderId: '2066684284659277826',
        time: '06-16 08:48:26',
        rebate: 0,
        amount: 10,
        winLoss: 90,
        result: 90,
        play: '冠军 8@10',
        status: '已结算',
        drawNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      },
      {
        id: 'mock-settled-2',
        gameName: '一分极速赛车',
        issue: '202606160529',
        orderId: '2066684284659277825',
        time: '06-16 08:48:26',
        rebate: 0,
        amount: 10,
        winLoss: -10,
        result: -10,
        play: '冠军 4@10',
        status: '已结算',
        drawNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      }
    ];
  }, []);

  // Format user-placed bets for rendering
  const formattedSettledBets = React.useMemo(() => {
    return settledBets.map((bet, idx) => {
      // Deterministic order ID suffix based on the bet ID/index
      const randSuffix = String(Math.abs(bet.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + idx)).slice(-6).padStart(6, '0');
      const orderId = `2066684284659${randSuffix}`;
      
      const timeStr = bet.timestamp || bet.time;
      // 六合彩 bets carry their 盘口 (A~D); show it before the play description.
      const pankouPrefix = bet.pankou ? `${bet.pankou}盘 ` : '';
      const play = `${pankouPrefix}${bet.positionName} ${bet.betName}@${bet.amount}`;
      
      return {
        id: bet.id,
        gameName: bet.gameName || '一分极速赛车',
        issue: formatFullIssue(bet.issue),
        orderId,
        time: timeStr,
        rebate: 0,
        amount: bet.amount,
        winLoss: bet.winLoss,
        result: bet.winLoss,
        play,
        status: '已结算',
        drawNumbers: bet.drawNumbers || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      };
    });
  }, [settledBets]);

  // Combine mock data and actual settled bets
  const allBets = React.useMemo(() => {
    return [...formattedSettledBets, ...mockBets];
  }, [formattedSettledBets, mockBets]);

  // Filter based on dropdown selection. 全部游戏 (category 'all') shows every order;
  // otherwise filter to the specific game selected in the right picker.
  const filteredBets = React.useMemo(() => {
    if (categoryId === 'all' || !selectedGameName) return allBets;
    return allBets.filter(bet => bet.gameName === selectedGameName);
  }, [allBets, categoryId, selectedGameName]);

  const totalCount = filteredBets.length;
  const totalAmount = filteredBets.reduce((acc, bet) => acc + bet.amount, 0);
  const totalResult = filteredBets.reduce((acc, bet) => acc + bet.winLoss, 0);

  // Dynamic report title date based on current local time
  const reportDate = React.useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  return (
    <div className="settled-detail-container">
      {/* Header */}
      <div className="settled-header">
        <button 
          type="button" 
          className="settled-back-btn" 
          onClick={onBack}
          title="返回"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="settled-title">今日已结</span>
        <button 
          type="button" 
          className="settled-menu-btn" 
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

      <div className="settled-body">
        {/* Dropdown Filters (drawer style) — left: category, right: specific game */}
        <div className="settled-filters-row">
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
              <span className="history-picker-value">{selectedGameName || ' '}</span>
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

        {/* Date report title */}
        <h2 className="settled-report-title">{reportDate} 报表</h2>

        {/* Summary Banner Card */}
        <div className="settled-summary-card">
          <div className="summary-item">
            <span className="summary-label">总注数</span>
            <span className="summary-value">{totalCount}笔</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">总金额</span>
            <span className="summary-value">{totalAmount}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">总结果</span>
            <span className={`summary-value ${totalResult > 0 ? 'win-text' : totalResult < 0 ? 'loss-text' : ''}`}>
              {totalResult}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="settled-list">
          {filteredBets.length > 0 ? (
            filteredBets.map((bet, idx) => (
              <div key={bet.uid || `${bet.id}-${idx}`} className="settled-bet-card">
                <div className="bet-card-header">
                  <span>{bet.gameName} <span className="issue-text">（期数：{bet.issue}）</span></span>
                  <button 
                    type="button" 
                    className="view-result-btn"
                    onClick={() => setResultModalData({ gameName: bet.gameName, issue: bet.issue, drawNumbers: bet.drawNumbers })}
                  >
                    开奖结果
                  </button>
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
                        <span className="detail-value highlight-blue">{bet.amount}</span>
                      </div>
                      <div className="bet-detail-row">
                        <span className="detail-label">结果：</span>
                        <span className={`detail-value ${bet.result > 0 ? 'win-text' : bet.result < 0 ? 'loss-text' : ''}`}>
                          {bet.result}
                        </span>
                      </div>
                    </div>
                    <div className="bet-detail-column">
                      <div className="bet-detail-row">
                        <span className="detail-label">退水金额：</span>
                        <span className="detail-value highlight-blue">{bet.rebate}</span>
                      </div>
                      <div className="bet-detail-row">
                        <span className="detail-label">输赢金额：</span>
                        <span className={`detail-value ${bet.winLoss > 0 ? 'win-text' : bet.winLoss < 0 ? 'loss-text' : ''}`}>
                          {bet.winLoss}
                        </span>
                      </div>
                      <div className="bet-detail-row">
                        <span className="detail-label">结算状态：</span>
                        <span className="detail-value highlight-blue">{bet.status}</span>
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
            <div className="settled-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>暂无已结明细</span>
            </div>
          )}
        </div>
      </div>

      {/* Draw Result Modal Overlay */}
      {resultModalData && (
        <div className="result-modal-overlay" onClick={() => setResultModalData(null)}>
          <div className="result-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="result-modal-header">
              <span className="result-modal-title">
                {resultModalData.gameName} (期数: {resultModalData.issue})
              </span>
              <button 
                type="button" 
                className="result-modal-close"
                onClick={() => setResultModalData(null)}
              >
                &times;
              </button>
            </div>
            <div className="result-modal-body">
              <div className="result-modal-balls">
                {resultModalData.drawNumbers && resultModalData.drawNumbers.map((num, idx) => {
                  const color = PK10_COLORS[num] || { bg: '#9ca3af', text: '#ffffff' };
                  return (
                    <span
                      key={idx}
                      className="modal-pk10-ball"
                      style={{ backgroundColor: color.bg, color: color.text }}
                    >
                      {num}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
