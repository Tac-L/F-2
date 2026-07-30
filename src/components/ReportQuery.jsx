import React from 'react';
import { DRAWER_CATEGORIES } from '../constants/gameData';

// 报表查询：顶部游戏选择（分类 + 具体游戏，选项与开奖历史一致），本周/上周切换，
// 逐日汇总卡片。点击「查看详情」进入该游戏该日期的「今日已结」版面。

const pad2 = (n) => String(n).padStart(2, '0');

// 一年中的第几天（用于生成每日期号，与开奖历史的 2026xxx 格式一致）。
const dayOfYear = (d) => {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
};

const fmtMMDD = (d) => `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fmtYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const issueOf = (d) => `${d.getFullYear()}${String(dayOfYear(d)).padStart(3, '0')}`;

// 生成某一周的逐日汇总。weekOffset: 0=本周，-1=上周。
// 本周只列出「已结算」的日期（今天之前），最新日期排在最前。
const buildWeek = (weekOffset) => {
  const now = new Date();
  const day = now.getDay(); // 0(周日)..6(周六)
  const mondayOffset = (day + 6) % 7; // 距离本周一的天数
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset + weekOffset * 7);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    if (weekOffset === 0 && d >= today) continue; // 本周仅显示已结算的日期
    days.push(d);
  }
  days.reverse(); // 最新在前
  return days.map((d) => ({
    date: fmtMMDD(d),
    ymd: fmtYMD(d),
    issue: issueOf(d),
    count: 0,
    amount: 0,
    winLoss: 0,
    rebate: 0,
    result: 0,
  }));
};

export default function ReportQuery({ onBack, onOpenMenu, onViewDetail }) {
  const [categoryId, setCategoryId] = React.useState(DRAWER_CATEGORIES[0].id);
  const [gameId, setGameId] = React.useState(DRAWER_CATEGORIES[0].games[0].id);
  const [week, setWeek] = React.useState('this'); // 'this' | 'last'
  const [sheet, setSheet] = React.useState(null); // 'category' | 'game' | null

  const category = DRAWER_CATEGORIES.find((c) => c.id === categoryId);
  const game = category.games.find((g) => g.id === gameId);

  const thisWeek = React.useMemo(() => buildWeek(0), []);
  const lastWeek = React.useMemo(() => buildWeek(-1), []);
  const rows = week === 'this' ? thisWeek : lastWeek;

  const handleSelectCategory = (id) => {
    const cat = DRAWER_CATEGORIES.find((c) => c.id === id);
    setCategoryId(id);
    setGameId(cat.games[0].id);
    setSheet(null);
  };

  const handleSelectGame = (id) => {
    setGameId(id);
    setSheet(null);
  };

  const signClass = (v) => (v > 0 ? 'win-text' : v < 0 ? 'loss-text' : '');

  return (
    <div className="settled-detail-container">
      {/* Header */}
      <div className="settled-header">
        <button type="button" className="settled-back-btn" onClick={onBack} title="返回">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="settled-title">报表查询</span>
        <button type="button" className="settled-menu-btn" onClick={onOpenMenu} title="菜单">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <div className="settled-body">
        {/* 游戏选择：分类 + 具体游戏（与开奖历史一致） */}
        <div className="settled-filters-row">
          <div className="history-picker-wrap">
            <button
              type="button"
              className={`history-picker ${sheet === 'category' ? 'open' : ''}`}
              onClick={() => setSheet(sheet === 'category' ? null : 'category')}
            >
              <span className="history-picker-value">{category.name}</span>
              <svg className="history-picker-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {sheet === 'category' && (
              <div className="history-dropdown-menu">
                {DRAWER_CATEGORIES.map((cat) => (
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
              className={`history-picker ${sheet === 'game' ? 'open' : ''}`}
              onClick={() => setSheet(sheet === 'game' ? null : 'game')}
            >
              <span className="history-picker-value">{game.name}</span>
              <svg className="history-picker-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {sheet === 'game' && (
              <div className="history-dropdown-menu">
                {category.games.map((g) => (
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

        {/* 本周 / 上周 */}
        <div className="history-tabs">
          <button
            type="button"
            className={`history-tab ${week === 'this' ? 'active' : ''}`}
            onClick={() => setWeek('this')}
          >本周</button>
          <button
            type="button"
            className={`history-tab ${week === 'last' ? 'active' : ''}`}
            onClick={() => setWeek('last')}
          >上周</button>
        </div>

        {/* 逐日汇总卡片 */}
        <div className="history-list">
          {rows.length === 0 ? (
            <div className="settled-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>暂无报表数据</span>
            </div>
          ) : (
            rows.map((row) => (
              <div
                key={row.ymd}
                className="history-card report-card clickable"
                onClick={() => onViewDetail && onViewDetail({
                  gameId,
                  gameName: game.name,
                  date: row.ymd,
                })}
              >
                <div className="report-grid">
                  <div className="history-field">
                    <span className="history-field-label">日期</span>
                    <span className="history-field-value strong">{row.date}</span>
                  </div>
                  <div className="history-field">
                    <span className="history-field-label">期数</span>
                    <span className="history-field-value strong">{row.issue}</span>
                  </div>
                  <div className="history-field">
                    <span className="history-field-label">注数</span>
                    <span className="history-field-value strong">{row.count}</span>
                  </div>
                  <div className="history-field">
                    <span className="history-field-label">金额</span>
                    <span className="history-field-value strong">{row.amount}</span>
                  </div>
                  <div className="history-field">
                    <span className="history-field-label">输赢</span>
                    <span className={`history-field-value strong ${signClass(row.winLoss)}`}>{row.winLoss}</span>
                  </div>
                  <div className="history-field">
                    <span className="history-field-label">退水</span>
                    <span className="history-field-value strong">{row.rebate}</span>
                  </div>
                </div>
                <div className="report-card-footer">
                  <div className="history-field">
                    <span className="history-field-label">结果</span>
                    <span className={`history-field-value strong ${signClass(row.result)}`}>{row.result}</span>
                  </div>
                  {/* 整张卡片可点击，这里只作为视觉提示 */}
                  <span className="report-detail-btn">
                    <span>查看详情</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 点击空白处关闭下拉 */}
      {sheet && (
        <div className="history-picker-backdrop" onClick={() => setSheet(null)} />
      )}
    </div>
  );
}
