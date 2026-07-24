import React from 'react';
import {
  lhcColorOf, lhcZodiacOf, lhcIsDomestic, lhcBallSrc, LHC_WUXING,
  pk10BallSrc, animalBallSrc, DRAWER_CATEGORIES,
  fhcSymbolSrc, fhcSymbolNameOf,
  bacDeal, bacTotal, bacCardSrc,
} from '../constants/gameData';

// 五行 (element) of a number — find the element set it belongs to.
const lhcWuxingOf = (n) => {
  const found = LHC_WUXING.find((w) => w.nums.includes(n));
  return found ? found.element : '';
};

// 波色 -> 中文 (用于「波段」显示)
const WAVE_CN = { red: '红', green: '绿', blue: '蓝' };

// Tabs available per category id. Categories without an implemented 开奖记录 view
// (分分彩 / 快三 / 28类) fall back to an empty state.
const TABS_BY_CATEGORY = {
  lhc: [
    { id: 'balls', name: '彩球' },
    { id: 'zhengma', name: '正码' },
    { id: 'tema', name: '特码' },
  ],
  pk10: [
    { id: 'numbers', name: '号码' },
    { id: 'sum', name: '冠亚和' },
    { id: 'other', name: '其他' },
  ],
  animal: [
    { id: 'numbers', name: '号码' },
    { id: 'other', name: '龙虎' },
  ],
};

// ----- 六合彩 mock history -----
// Format a daily draw date as MM-DD. issue 2026180 -> 06-29, decreasing by 1 day per issue.
const lhcDate = (offset) => {
  const base = new Date(2026, 5, 29); // 2026-06-29 (month is 0-indexed)
  base.setDate(base.getDate() - offset);
  const mm = String(base.getMonth() + 1).padStart(2, '0');
  const dd = String(base.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
};

const randomLhcDraw = () => {
  const pool = Array.from({ length: 49 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 7);
};

const buildLhcHistory = () => {
  const seeds = [
    [14, 10, 37, 30, 49, 19, 21], // 2026180 06-29
    [10, 11, 26, 6, 31, 9, 15],   // 2026179 06-28
    [26, 46, 22, 44, 31, 17, 18], // 2026178 06-27
  ];
  const list = [];
  const startIssue = 2026180;
  for (let i = 0; i < 40; i++) {
    list.push({
      issue: String(startIssue - i),
      date: lhcDate(i),
      numbers: seeds[i] || randomLhcDraw(),
    });
  }
  return list;
};

// ----- PK10 mock history -----
// issue 202606300822 -> 06-30 13:43, decreasing by one minute per issue.
const pk10DateTime = (offset) => {
  const base = new Date(2026, 5, 30, 13, 43); // 2026-06-30 13:43
  base.setMinutes(base.getMinutes() - offset);
  const mm = String(base.getMonth() + 1).padStart(2, '0');
  const dd = String(base.getDate()).padStart(2, '0');
  const hh = String(base.getHours()).padStart(2, '0');
  const mi = String(base.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
};

const randomPk10Draw = () => {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
};

const buildPk10History = () => {
  const seeds = [
    [6, 3, 1, 10, 7, 8, 2, 4, 9, 5],  // 202606300822 06-30 13:43
    [6, 3, 9, 7, 2, 10, 4, 8, 1, 5],  // 202606300821 13:42
    [5, 3, 10, 9, 6, 2, 1, 8, 4, 7],  // 202606300820 13:41
    [4, 10, 2, 3, 9, 1, 6, 8, 5, 7],  // 202606300819 13:40
    [1, 4, 10, 5, 7, 2, 6, 8, 9, 3],  // 202606300818 13:39
  ];
  const list = [];
  const startIssue = 202606300822;
  for (let i = 0; i < 40; i++) {
    list.push({
      issue: String(startIssue - i),
      date: pk10DateTime(i),
      numbers: seeds[i] || randomPk10Draw(),
    });
  }
  return list;
};

// ----- 动物运动会 mock history (permutation of 1-6) -----
const randomAnimalDraw = () => {
  const nums = [1, 2, 3, 4, 5, 6];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
};

const buildAnimalHistory = () => {
  const seeds = [
    [5, 2, 1, 3, 6, 4],
    [3, 1, 5, 2, 6, 4],
    [6, 4, 2, 5, 1, 3],
  ];
  const list = [];
  const startIssue = 202607080581;
  for (let i = 0; i < 40; i++) {
    list.push({
      issue: String(startIssue - i),
      date: pk10DateTime(i),
      numbers: seeds[i] || randomAnimalDraw(),
    });
  }
  return list;
};

// ----- 鱼虾蟹 mock history (3 dice, each a symbol id 1-6) -----
const randomFhcDraw = () => Array.from({ length: 3 }, () => Math.floor(Math.random() * 6) + 1);

const buildFhcHistory = () => {
  const seeds = [
    [1, 3, 5],
    [6, 2, 4],
    [3, 3, 1],
  ];
  const list = [];
  const startIssue = 3480;
  for (let i = 0; i < 40; i++) {
    list.push({
      issue: String(startIssue - i),
      date: pk10DateTime(i),
      numbers: seeds[i] || randomFhcDraw(),
    });
  }
  return list;
};

// ----- 百家乐 mock history ({ p: [cards], b: [cards] }) -----
const buildBacHistory = () => {
  const list = [];
  const startIssue = 1480;
  for (let i = 0; i < 40; i++) {
    list.push({
      issue: String(startIssue - i),
      date: pk10DateTime(i),
      numbers: bacDeal(),
    });
  }
  return list;
};

export default function DrawHistory({ onBack, onOpenMenu }) {
  const [categoryId, setCategoryId] = React.useState('lhc');
  const [gameId, setGameId] = React.useState(DRAWER_CATEGORIES[0].games[0].id);
  const [activeTab, setActiveTab] = React.useState('balls');
  const [issueInput, setIssueInput] = React.useState('');
  const [issueQuery, setIssueQuery] = React.useState('');
  // Drawer-style pickers (bottom sheets) replacing the native <select> dropdowns.
  const [sheet, setSheet] = React.useState(null); // 'category' | 'game' | null

  const lhcHistory = React.useMemo(() => buildLhcHistory(), []);
  const pk10History = React.useMemo(() => buildPk10History(), []);
  const animalHistory = React.useMemo(() => buildAnimalHistory(), []);
  const fhcHistory = React.useMemo(() => buildFhcHistory(), []);
  const bacHistory = React.useMemo(() => buildBacHistory(), []);

  const category = DRAWER_CATEGORIES.find((c) => c.id === categoryId);
  const game = category.games.find((g) => g.id === gameId);
  const tabs = TABS_BY_CATEGORY[categoryId] || [];

  const allHistory = categoryId === 'lhc'
    ? lhcHistory
    : categoryId === 'pk10'
      ? pk10History
      : categoryId === 'animal'
        ? animalHistory
        : categoryId === 'fhc'
          ? fhcHistory
          : categoryId === 'bac'
            ? bacHistory
            : [];

  const history = React.useMemo(() => {
    if (!issueQuery) return allHistory;
    return allHistory.filter((item) => item.issue.includes(issueQuery));
  }, [allHistory, issueQuery]);

  const handleSelectCategory = (id) => {
    const cat = DRAWER_CATEGORIES.find((c) => c.id === id);
    setCategoryId(id);
    setGameId(cat.games[0].id);
    setActiveTab((TABS_BY_CATEGORY[id] || [{ id: '' }])[0].id);
    setIssueInput('');
    setIssueQuery('');
    setSheet(null);
  };

  const handleSelectGame = (id) => {
    setGameId(id);
    setIssueInput('');
    setIssueQuery('');
    setSheet(null);
  };

  const handleReset = () => {
    setIssueInput('');
    setIssueQuery('');
  };

  const handleQuery = () => {
    setIssueQuery(issueInput.trim());
  };

  // ===== PK10: 号码 — 10 colored square balls =====
  const renderPk10Balls = (numbers) => numbers.map((num, idx) => (
    <img key={idx} className="pk10-ball" src={pk10BallSrc(num)} alt={num} />
  ));

  // ===== PK10: 冠亚和 =====
  const pk10SumStats = (numbers) => {
    const sum = numbers[0] + numbers[1];
    return {
      sum,
      bigSmall: sum >= 12 ? '大' : '小',
      oddEven: sum % 2 !== 0 ? '单' : '双',
    };
  };

  // ===== PK10: 其他 — 5 个龙虎 (冠vs第十 ... 第五vs第六) =====
  const pk10DragonTiger = (numbers) =>
    [0, 1, 2, 3, 4].map((i) => (numbers[i] > numbers[9 - i] ? '龙' : '虎'));

  // ===== 动物运动会: 号码 — 6 animal balls =====
  const renderAnimalBalls = (numbers) => numbers.map((num, idx) => (
    <img key={idx} className="pk10-ball animal-ball" src={animalBallSrc(num)} alt={num} />
  ));

  // ===== 动物运动会: 其他 — 3 个龙虎 (冠vs第六, 亚vs第五, 季vs第四) =====
  const animalDragonTiger = (numbers) =>
    [0, 1, 2].map((i) => (numbers[i] > numbers[5 - i] ? '龙' : '虎'));

  // ===== 鱼虾蟹: 号码 — 3 个图案（鱼/虾/蟹/葫芦/金钱/鸡） =====
  const renderFhcSymbols = (numbers) => numbers.map((num, idx) => (
    <img key={idx} className="history-fhc-symbol" src={fhcSymbolSrc(fhcSymbolNameOf(num))} alt={fhcSymbolNameOf(num)} />
  ));

  // ===== 百家乐: 闲X [牌] | [牌] 庄X（补牌横放于外侧，与投注页一致） =====
  const renderBacResult = (numbers) => {
    const pCards = (numbers && numbers.p) || [];
    const bCards = (numbers && numbers.b) || [];
    const pt = bacTotal(pCards);
    const bt = bacTotal(bCards);
    const upCard = (c, key) => <img key={key} className="bac-result-card" src={bacCardSrc(c)} alt="" />;
    const drawnCard = (c, key) => (
      <span key={key} className="bac-drawn"><img className="bac-result-card" src={bacCardSrc(c)} alt="" /></span>
    );
    const playerEls = [];
    if (pCards[2]) playerEls.push(drawnCard(pCards[2], 'p2'));
    pCards.slice(0, 2).forEach((c, i) => playerEls.push(upCard(c, `p${i}`)));
    const bankerEls = [];
    bCards.slice(0, 2).forEach((c, i) => bankerEls.push(upCard(c, `b${i}`)));
    if (bCards[2]) bankerEls.push(drawnCard(bCards[2], 'b2'));
    return (
      <span className="bac-result-row">
        <span className="bac-hand bac-hand-left">
          <span className="bac-side-label player">闲{pt}</span>
          {playerEls}
        </span>
        <span className="bac-result-sep" />
        <span className="bac-hand bac-hand-right">
          {bankerEls}
          <span className="bac-side-label banker">庄{bt}</span>
        </span>
      </span>
    );
  };

  // ===== 六合彩: 彩球 — 6 正码 + 特码 =====
  const renderLhcBalls = (numbers) => {
    const els = [];
    numbers.forEach((num, idx) => {
      if (idx === 6) els.push(<span key="plus" className="lhc-plus">+</span>);
      els.push(
        <span key={idx} className="lhc-ball-wrap">
          <img className="lhc-ball" src={lhcBallSrc(num)} alt={num.toString().padStart(2, '0')} />
          <span className="lhc-zodiac">{lhcZodiacOf(num)}</span>
        </span>
      );
    });
    return els;
  };

  // ===== 六合彩: 正码 =====
  const lhcZhengmaStats = (numbers) => {
    const sum = numbers.reduce((a, b) => a + b, 0);
    return {
      sum,
      oddEven: sum % 2 === 0 ? '总双' : '总单',
      bigSmall: sum >= 175 ? '总大' : '总小',
      dragonTiger: numbers[0] > numbers[5] ? '龙' : '虎',
    };
  };

  // ===== 六合彩: 特码 =====
  const lhcTemaStats = (numbers) => {
    const special = numbers[6];
    const tail = special % 10;
    return {
      tailBigSmall: tail >= 5 ? '特尾大' : '特尾小',
      oddEven: special % 2 !== 0 ? '单' : '双',
      bigSmall: special === 49 ? '和' : special >= 25 ? '大' : '小',
      wuxing: lhcWuxingOf(special),
      wave: WAVE_CN[lhcColorOf(special)],
      animal: lhcIsDomestic(special) ? '家禽' : '野兽',
    };
  };

  return (
    <div className="settled-detail-container draw-history-container">
      {/* Header */}
      <div className="settled-header">
        <button type="button" className="settled-back-btn" onClick={onBack} title="返回">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="settled-title">开奖历史</span>
        <button type="button" className="settled-menu-btn" onClick={onOpenMenu} title="菜单">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <div className="settled-body">
        {/* Category / game pickers (dropdown style) */}
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

        {/* Issue search row */}
        <div className="history-search-row">
          <input
            type="text"
            className="history-issue-input"
            placeholder="请输入期数"
            value={issueInput}
            onChange={(e) => setIssueInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuery(); }}
          />
          <button type="button" className="history-reset-btn" onClick={handleReset}>重置</button>
          <button type="button" className="history-query-btn" onClick={handleQuery}>查询</button>
        </div>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="history-tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`history-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >{t.name}</button>
            ))}
          </div>
        )}

        {/* List */}
        <div className="history-list">
          {history.length === 0 ? (
            <div className="settled-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>{tabs.length === 0 ? '该游戏暂未开放开奖记录' : '暂无开奖记录'}</span>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.issue} className="history-card">
                {/* Common header: 期数 + 开奖时间 (+总分 on 六合彩 正码 tab) */}
                <div className={`history-card-top ${activeTab === 'zhengma' ? 'cols-3' : 'cols-2'}`}>
                  <div className="history-field">
                    <span className="history-field-label">期数：</span>
                    <span className="history-field-value">{item.issue}</span>
                  </div>
                  <div className="history-field">
                    <span className="history-field-label">开奖时间：</span>
                    <span className="history-field-value">{item.date}</span>
                  </div>
                  {activeTab === 'zhengma' && (
                    <div className="history-field">
                      <span className="history-field-label">总分：</span>
                      <span className="history-field-value strong">{lhcZhengmaStats(item.numbers).sum}</span>
                    </div>
                  )}
                </div>

                {/* ===== PK10 / 动物运动会 tabs ===== */}
                {activeTab === 'numbers' && (
                  <div className={`history-balls-row ${categoryId === 'animal' ? 'animal' : 'pk10'}`}>
                    {categoryId === 'animal'
                      ? renderAnimalBalls(item.numbers)
                      : renderPk10Balls(item.numbers)}
                  </div>
                )}

                {/* ===== 鱼虾蟹：只显示历史号码（无 tab 切换） ===== */}
                {categoryId === 'fhc' && (
                  <div className="history-balls-row fhc">
                    {renderFhcSymbols(item.numbers)}
                  </div>
                )}

                {/* ===== 百家乐：只显示开奖结果（无 tab 切换） ===== */}
                {categoryId === 'bac' && (
                  <div className="history-balls-row bac">
                    {renderBacResult(item.numbers)}
                  </div>
                )}

                {activeTab === 'sum' && (() => {
                  const s = pk10SumStats(item.numbers);
                  return (
                    <div className="history-badge-row">
                      <span className="history-badge filled">{s.sum}</span>
                      <span className="history-badge filled">{s.bigSmall}</span>
                      <span className="history-badge filled">{s.oddEven}</span>
                    </div>
                  );
                })()}

                {activeTab === 'other' && (
                  <div className="history-badge-row">
                    {(categoryId === 'animal'
                      ? animalDragonTiger(item.numbers)
                      : pk10DragonTiger(item.numbers)
                    ).map((dt, i) => (
                      <span key={i} className="history-badge outline">{dt}</span>
                    ))}
                  </div>
                )}

                {/* ===== 六合彩 tabs ===== */}
                {activeTab === 'balls' && (
                  <div className="history-balls-row">
                    {renderLhcBalls(item.numbers)}
                  </div>
                )}

                {activeTab === 'zhengma' && (() => {
                  const s = lhcZhengmaStats(item.numbers);
                  return (
                    <div className="history-stat-grid cols-3">
                      <div className="history-field">
                        <span className="history-field-label">总单双：</span>
                        <span className="history-field-value strong">{s.oddEven}</span>
                      </div>
                      <div className="history-field">
                        <span className="history-field-label">总大小：</span>
                        <span className="history-field-value strong">{s.bigSmall}</span>
                      </div>
                      <div className="history-field">
                        <span className="history-field-label">龙虎：</span>
                        <span className="history-field-value strong">{s.dragonTiger}</span>
                      </div>
                    </div>
                  );
                })()}

                {activeTab === 'tema' && (() => {
                  const s = lhcTemaStats(item.numbers);
                  return (
                    <div className="history-stat-grid cols-3">
                      <div className="history-field">
                        <span className="history-field-label">特尾大小：</span>
                        <span className="history-field-value strong">{s.tailBigSmall}</span>
                      </div>
                      <div className="history-field">
                        <span className="history-field-label">特单双：</span>
                        <span className="history-field-value strong">{s.oddEven}</span>
                      </div>
                      <div className="history-field">
                        <span className="history-field-label">特大小：</span>
                        <span className="history-field-value strong">{s.bigSmall}</span>
                      </div>
                      <div className="history-field">
                        <span className="history-field-label">特码五行：</span>
                        <span className="history-field-value strong">{s.wuxing}</span>
                      </div>
                      <div className="history-field">
                        <span className="history-field-label">波段：</span>
                        <span className="history-field-value strong">{s.wave}</span>
                      </div>
                      <div className="history-field">
                        <span className="history-field-label">家禽野兽：</span>
                        <span className="history-field-value strong">{s.animal}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transparent click-catcher to close an open dropdown when tapping outside */}
      {sheet && (
        <div className="history-picker-backdrop" onClick={() => setSheet(null)} />
      )}
    </div>
  );
}
