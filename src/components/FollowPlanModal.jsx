import { useState, useEffect, useMemo } from 'react';

// ============================================================
// 跟单计划 (Follow-Plan / 计划中心)
// A self-contained, mock "expert plan" center opened from the 长龙 rail.
// Data is simulated — buttons only give toast feedback (no bet integration).
// Plan conditions per game kind follow the product spec table:
//   时时彩(=分分彩/ffc) & PK10 : N码计划  × 第X球 / 名次
//   快3(k3) & 六合彩(lhc)      : 大小/单双计划 × 和值 / 特码
//   幸运28(xy28)               : 大小/单双计划 × 总和  (not in the table; sensible default)
// ============================================================

// Game variants grouped by kind. The plan center is NOT limited to the current
// game's kind — every game below is switchable, and picking one from another
// kind swaps the plan conditions accordingly.
const GAME_VARIANTS = {
  pk10: [['pk10_1m', '一分极速赛车'], ['pk10_5m', '五分极速赛车'], ['pk10_10m', '十分极速赛车']],
  ffc: [['ffc_1m', '一分分分彩'], ['ffc_5m', '五分分分彩'], ['ffc_10m', '十分分分彩']],
  k3: [['k3_1m', '一分快三'], ['k3_5m', '五分快三'], ['k3_10m', '十分快三']],
  xy28: [['xy28_1m', '一分幸运28'], ['xy28_5m', '五分幸运28'], ['xy28_10m', '十分幸运28']],
  lhc: [['ap_lhc_1m', '一分澳门六合彩'], ['ap_lhc_5m', '五分澳门六合彩'], ['ap_lhc_10m', '十分澳门六合彩']],
};

// Flattened list of every game with its kind, used by the game dropdown.
const ALL_GAMES = Object.entries(GAME_VARIANTS).flatMap(([kind, list]) =>
  list.map(([id, name]) => ({ id, name, kind })));

const kindOfGame = (id) => (ALL_GAMES.find((g) => g.id === id) || {}).kind;

// Plan condition sets + how a prediction is generated for each kind.
const PLAN_CONFIG = {
  pk10: { cond1: ['5码计划', '6码计划', '7码计划', '8码计划'], cond2: ['冠军', '亚军', '第三名', '第四名', '第五名', '第六名', '第七名', '第八名', '第九名', '第十名'], predict: 'balls', min: 1, max: 10 },
  ffc: { cond1: ['5码计划', '6码计划', '7码计划', '8码计划'], cond2: ['第一球', '第二球', '第三球', '第四球', '第五球'], predict: 'balls', min: 0, max: 9 },
  k3: { cond1: ['大小计划', '单双计划'], cond2: ['和值'], predict: 'twoside' },
  lhc: { cond1: ['大小计划', '单双计划'], cond2: ['特码'], predict: 'twoside' },
  xy28: { cond1: ['大小计划', '单双计划'], cond2: ['总和'], predict: 'twoside' },
};

// Colored lottery-ball palette keyed by digit.
const BALL_COLORS = {
  0: '#9ca3af', 1: '#f59e0b', 2: '#3b82f6', 3: '#374151', 4: '#f97316',
  5: '#06b6d4', 6: '#8b5cf6', 7: '#10b981', 8: '#ef4444', 9: '#ec4899', 10: '#22c55e',
};

// Fixed roster with stable head-line stats so the list feels consistent.
const EXPERTS = [
  { name: '专家九号', winRate: 68.75, dragon: 5 },
  { name: '专家七号', winRate: 56.25, dragon: 3 },
  { name: '专家十号', winRate: 56.25, dragon: null },
  { name: '专家八号', winRate: 62.5, dragon: 4 },
  { name: '专家五号', winRate: 50.0, dragon: 2 },
  { name: '专家三号', winRate: 43.75, dragon: null },
  { name: '专家六号', winRate: 75.0, dragon: 6 },
  { name: '专家一号', winRate: 37.5, dragon: 1 },
];

const TOTAL_ROUNDS = 24;
const ROUND_SECONDS = 20;

function genBalls(count, min, max) {
  const pool = [];
  for (let n = min; n <= max; n++) pool.push(n);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

// 反投 flips a two-sided prediction to its opposite within the same pair.
const OPPOSITE_SIDE = { 大: '小', 小: '大', 单: '双', 双: '单' };

export default function FollowPlanModal({ open, onClose, gameKind = 'pk10', activeGameId, addToast, onFollowBet, onOpenMenu }) {
  const initialCfg = PLAN_CONFIG[gameKind] || PLAN_CONFIG.pk10;
  const [tab, setTab] = useState('experts'); // 'experts' | 'followed'
  const [selectedGameId, setSelectedGameId] = useState(activeGameId);
  const [cond1, setCond1] = useState(initialCfg.cond1[0]);
  const [cond2, setCond2] = useState(initialCfg.cond2[0]);
  const [round, setRound] = useState(1);
  const [countdown, setCountdown] = useState(ROUND_SECONDS);
  const [followed, setFollowed] = useState([]); // expert names on auto-follow
  const [openMenu, setOpenMenu] = useState(null); // 'game' | 'cond1' | 'cond2' | null
  const [tempValue, setTempValue] = useState(null); // pending selection inside the bottom sheet

  // Reset filters to the current game whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    const c = PLAN_CONFIG[gameKind] || PLAN_CONFIG.pk10;
    setSelectedGameId(activeGameId);
    setCond1(c.cond1[0]);
    setCond2(c.cond2[0]);
    setTab('experts');
    setRound(1);
    setCountdown(ROUND_SECONDS);
    setOpenMenu(null);
  }, [open, gameKind, activeGameId]);

  // Per-round countdown; on expiry, advance the round (wrapping at TOTAL_ROUNDS).
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setRound((r) => (r >= TOTAL_ROUNDS ? 1 : r + 1));
          return ROUND_SECONDS;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [open]);

  // The active kind follows the *selected* game, not the game we opened from,
  // so switching to a game of another kind swaps the plan conditions too.
  const selectedKind = kindOfGame(selectedGameId) || gameKind;
  const cfg = PLAN_CONFIG[selectedKind] || PLAN_CONFIG.pk10;
  const selectedGameName = (ALL_GAMES.find((g) => g.id === selectedGameId) || {}).name || '';

  // Pick a game; if its kind differs, reset the conditions to that kind's defaults.
  const handleSelectGame = (id) => {
    const newKind = kindOfGame(id);
    setSelectedGameId(id);
    if (newKind && newKind !== selectedKind) {
      const nc = PLAN_CONFIG[newKind] || PLAN_CONFIG.pk10;
      setCond1(nc.cond1[0]);
      setCond2(nc.cond2[0]);
    }
  };

  // Predictions regenerate on round / game / condition change.
  const predictions = useMemo(() => {
    const c = PLAN_CONFIG[selectedKind] || PLAN_CONFIG.pk10;
    return EXPERTS.map(() => {
      if (c.predict === 'balls') {
        const n = parseInt(cond1, 10) || 5;
        return { kind: 'balls', value: genBalls(n, c.min, c.max) };
      }
      const opts = cond1 === '单双计划' ? ['单', '双'] : ['大', '小'];
      return { kind: 'twoside', value: opts[Math.floor(Math.random() * opts.length)] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, selectedGameId, cond1, cond2, selectedKind]);

  if (!open) return null;

  const toggleFollow = (name) => {
    // Decide from the current render's state, then update + toast in the
    // event handler (never call addToast inside the setState updater — that
    // would setState on App during FollowPlanModal's render).
    if (followed.includes(name)) {
      setFollowed((prev) => prev.filter((n) => n !== name));
      addToast?.(`已取消自动跟投 ${name}`, 'info');
    } else {
      setFollowed((prev) => [...prev, name]);
      addToast?.(`已开启自动跟投 ${name}`, 'success');
    }
  };

  // Resolve which 号码 / 面 a 跟投('follow') or 反投('reverse') actually stakes.
  //   balls  : 跟投 = predicted digits; 反投 = every other ball in the pool.
  //   twoside: 跟投 = predicted side;   反投 = the opposite side (大↔小 / 单↔双).
  const resolveTargets = (pred, mode) => {
    if (!pred) return [];
    if (pred.kind === 'balls') {
      if (mode === 'follow') return pred.value.map(String);
      const pool = [];
      for (let n = cfg.min; n <= cfg.max; n++) pool.push(n);
      return pool.filter((n) => !pred.value.includes(n)).map(String);
    }
    const side = mode === 'follow' ? pred.value : (OPPOSITE_SIDE[pred.value] || pred.value);
    return [side];
  };

  // Hand the resolved bet spec up to App, which turns it into real bet objects
  // for the *selected* game and opens the shared 投注 confirmation modal.
  const handleFollow = (expert, pred, mode) => {
    const targets = resolveTargets(pred, mode);
    if (!targets.length) {
      addToast?.('本期暂无可投注号码', 'info');
      return;
    }
    onFollowBet?.({
      mode,                      // 'follow' | 'reverse'
      gameId: selectedGameId,
      kind: selectedKind,
      cond2,                     // 第一球 / 和值 / 特码 …
      predictKind: pred.kind,    // 'balls' | 'twoside'
      targets,                   // ['2','5',…] or ['大']
      expertName: expert.name,
    });
  };

  // Config for each of the three pickers (label, title, options, how to apply).
  const pickerConfig = {
    game: { current: selectedGameId, title: '请选择游戏', options: ALL_GAMES.map((g) => ({ value: g.id, label: g.name })), apply: handleSelectGame },
    cond1: { current: cond1, title: '请选择计划', options: cfg.cond1.map((c) => ({ value: c, label: c })), apply: setCond1 },
    cond2: { current: cond2, title: '请选择', options: cfg.cond2.map((c) => ({ value: c, label: c })), apply: setCond2 },
  };

  const openSheet = (key) => {
    setTempValue(pickerConfig[key].current);
    setOpenMenu(key);
  };
  const confirmSheet = () => {
    if (openMenu) pickerConfig[openMenu].apply(tempValue);
    setOpenMenu(null);
  };

  // The closed trigger — looks like the report-page picker pill; opens a bottom sheet.
  const renderTrigger = (key) => {
    const { current, options } = pickerConfig[key];
    return (
      <div className="history-picker-wrap">
        <button
          type="button"
          className={`history-picker ${openMenu === key ? 'open' : ''}`}
          onClick={() => openSheet(key)}
        >
          <span className="history-picker-value">{(options.find((o) => o.value === current) || {}).label}</span>
          <svg className="history-picker-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    );
  };

  // Bottom sheet that slides up (取消 / title / 确认 + centered option list).
  const renderSheet = () => {
    if (!openMenu) return null;
    const { title, options } = pickerConfig[openMenu];
    return (
      <>
        <div className="fp-sheet-backdrop" onClick={() => setOpenMenu(null)} />
        <div className="fp-sheet">
          <div className="fp-sheet-header">
            <button type="button" className="fp-sheet-cancel" onClick={() => setOpenMenu(null)}>取消</button>
            <span className="fp-sheet-title">{title}</span>
            <button type="button" className="fp-sheet-confirm" onClick={confirmSheet}>确认</button>
          </div>
          <div className="fp-sheet-list">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`fp-sheet-item ${opt.value === tempValue ? 'active' : ''}`}
                onClick={() => setTempValue(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderPrediction = (pred) => {
    if (!pred) return null;
    if (pred.kind === 'twoside') {
      const blue = pred.value === '大' || pred.value === '单';
      return (
        <span className="fp-side-pill" style={{ backgroundColor: blue ? '#3b82f6' : '#f59e0b' }}>{pred.value}</span>
      );
    }
    return pred.value.map((num) => (
      <span key={num} className="fp-ball" style={{ backgroundColor: BALL_COLORS[num] || '#6b7280' }}>{num}</span>
    ));
  };

  const renderCard = (expert, idx, isFollowedView) => {
    const pred = predictions[idx];
    const on = followed.includes(expert.name);
    return (
      <div key={expert.name} className="fp-card">
        <div className="fp-card-main">
          <div className="fp-card-top">
            <span className="fp-expert-name">{expert.name}</span>
            <span className="fp-tag">{selectedGameName}</span>
            <span className="fp-tag">{cond1}</span>
            <span className="fp-tag">{cond2}</span>
          </div>
          <div className="fp-stats">
            <div className="fp-stat"><span className="fp-stat-label">长龙</span><span className="fp-stat-val">{expert.dragon ? `${expert.dragon}期` : '--'}</span></div>
            <div className="fp-stat"><span className="fp-stat-label">总胜率</span><span className="fp-stat-val fp-rate">{expert.winRate.toFixed(2)}%</span></div>
            <div className="fp-stat"><span className="fp-stat-label">总输赢</span><span className="fp-stat-val">￥0.00</span></div>
          </div>
          <div className="fp-predict-label">本期预测</div>
          <div className="fp-predict">{renderPrediction(pred)}</div>
        </div>
        <div className="fp-card-actions">
          {isFollowedView ? (
            <button type="button" className="fp-btn fp-btn-cancel" onClick={() => toggleFollow(expert.name)}>取消跟投</button>
          ) : (
            <>
              <button type="button" className="fp-btn" onClick={() => handleFollow(expert, pred, 'follow')}>跟投</button>
              <button type="button" className="fp-btn" onClick={() => handleFollow(expert, pred, 'reverse')}>反投</button>
              <button type="button" className={`fp-btn ${on ? 'fp-btn-on' : ''}`} onClick={() => toggleFollow(expert.name)}>{on ? '已跟投' : '自动跟投'}</button>
            </>
          )}
        </div>
      </div>
    );
  };

  const followedExperts = EXPERTS.filter((e) => followed.includes(e.name));

  return (
    <div className="fp-page">
      <div className="fp-modal">
        <div className="fp-header">
          <button type="button" className="fp-back" onClick={onClose} aria-label="返回">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="fp-title">计划中心</span>
          <button type="button" className="fp-menu-btn" onClick={() => onOpenMenu?.()} aria-label="菜单">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        <div className="fp-tabs">
          <button type="button" className={`fp-tab ${tab === 'experts' ? 'active' : ''}`} onClick={() => setTab('experts')}>专家计划</button>
          <button type="button" className={`fp-tab ${tab === 'followed' ? 'active' : ''}`} onClick={() => setTab('followed')}>已跟专家</button>
        </div>

        {tab === 'experts' && (
          <>
            <div className="fp-filters">
              {renderTrigger('game')}
              {renderTrigger('cond1')}
              {renderTrigger('cond2')}
            </div>

            <div className="fp-round-row">
              <span className="fp-round">当前轮数：{round} / {TOTAL_ROUNDS}</span>
              <span className="fp-timer">倒计时 <span className="fp-timer-val">00:{String(countdown).padStart(2, '0')}</span></span>
            </div>

            <div className="fp-list">
              {EXPERTS.map((e, i) => renderCard(e, i, false))}
            </div>
          </>
        )}

        {tab === 'followed' && (
          <div className="fp-list">
            {followedExperts.length === 0 ? (
              <div className="fp-empty">暂无已跟专家<br />在「专家计划」中点击「自动跟投」即可添加</div>
            ) : (
              followedExperts.map((e) => renderCard(e, EXPERTS.indexOf(e), true))
            )}
          </div>
        )}

        {renderSheet()}
      </div>
    </div>
  );
}
