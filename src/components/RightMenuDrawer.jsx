
export default function RightMenuDrawer({ 
  isOpen, 
  onClose, 
  balance, 
  onRefreshBalance,
  onSelectUnsettled,
  onSelectSettled,
  onSelectBetting,
  onSelectHistory,
  activeItem = '投注',
  unsettledAmount = 20
}) {
  // Menu items list
  const menuItems = [
    {
      id: '投注',
      name: '投注',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      id: '未结明细',
      name: '未结明细',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      )
    },
    {
      id: '今日已结',
      name: '今日已结',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 18v-7m0 0L9 7m3 4l3-4m-4 8h2m-2-3h2" />
        </svg>
      )
    },
    {
      id: '报表查询',
      name: '报表查询',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )
    },
    {
      id: '开奖历史',
      name: '开奖历史',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" />
        </svg>
      )
    },
    {
      id: '个人资讯',
      name: '个人资讯',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: '活动规则',
      name: '活动规则',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="15" y2="16" />
          <circle cx="7" cy="12" r="0.5" fill="currentColor" />
          <circle cx="7" cy="16" r="0.5" fill="currentColor" />
        </svg>
      )
    },
    {
      id: '历史公告',
      name: '历史公告',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    },
    {
      id: '设置',
      name: '设置',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  return (
    <div className={`right-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div 
        className={`right-drawer-panel ${isOpen ? 'open' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="right-drawer-body">
          {/* Member Card */}
          <div className="right-drawer-member-card">
            <div className="right-drawer-member-row">
              <span className="label">会员</span>
              <span className="value username">Player</span>
            </div>
            <div className="right-drawer-member-row">
              <span className="label">信用余额</span>
              <div className="right-drawer-balance-container">
                <span className="value">{balance.toLocaleString()}</span>
                <button 
                  type="button" 
                  className="right-drawer-refresh-btn" 
                  onClick={onRefreshBalance}
                  title="刷新余额"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="right-drawer-member-row">
              <span className="label">未结金额</span>
              <span className="value">{unsettledAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="right-drawer-menu-list">
            {menuItems.map((item) => {
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`right-drawer-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (item.id === '未结明细') {
                      if (onSelectUnsettled) onSelectUnsettled();
                    } else if (item.id === '今日已结') {
                      if (onSelectSettled) onSelectSettled();
                    } else if (item.id === '投注') {
                      if (onSelectBetting) onSelectBetting();
                    } else if (item.id === '开奖历史') {
                      if (onSelectHistory) onSelectHistory();
                    }
                    onClose();
                  }}
                >
                  <span className="icon">{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Sound Control at Bottom */}
          <div className="right-drawer-bottom-section">
            <button 
              type="button" 
              className="right-drawer-sound-btn"
              onClick={onClose}
            >
              <span className="icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              </span>
              <span>游戏音效：关闭</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
