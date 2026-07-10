import { useState, useEffect, useMemo } from 'react';
import { ffcBallSrc, pk10BallSrc } from '../constants/gameData';

// ============================================================
// 跟单计划 (Follow-Plan / 计划中心)
// A self-contained, mock "expert plan" center opened from the 长龙 rail.
// 专家计划 tab browses experts (manual 跟投/反投 → App confirm modal); the
// 自动跟投 button opens a config page that creates an auto-follow *plan*. Plans
// auto-bet one round per real game draw through the App engine (props below),
// and are tracked under 已跟专家 → plan detail → 跟单记录.
//   时时彩(=分分彩/ffc) & PK10 : N码计划  × 第X球 / 名次
//   快3(k3) & 六合彩(lhc)      : 两面计划 × 和值大小/和值单双 · 特码大小/特码单双
//   幸运28(xy28)               : 大小/单双计划 × 总和
// ============================================================

const GAME_VARIANTS = {
  pk10: [['pk10_1m', '一分极速赛车'], ['pk10_5m', '五分极速赛车'], ['pk10_10m', '十分极速赛车']],
  ffc: [['ffc_1m', '一分分分彩'], ['ffc_5m', '五分分分彩'], ['ffc_10m', '十分分分彩']],
  k3: [['k3_1m', '一分快三'], ['k3_5m', '五分快三'], ['k3_10m', '十分快三']],
  xy28: [['xy28_1m', '一分幸运28'], ['xy28_5m', '五分幸运28'], ['xy28_10m', '十分幸运28']],
  lhc: [['ap_lhc_1m', '一分澳门六合彩'], ['ap_lhc_5m', '五分澳门六合彩'], ['ap_lhc_10m', '十分澳门六合彩']],
};

const ALL_GAMES = Object.entries(GAME_VARIANTS).flatMap(([kind, list]) =>
  list.map(([id, name]) => ({ id, name, kind })));

const kindOfGame = (id) => (ALL_GAMES.find((g) => g.id === id) || {}).kind;

const PLAN_CONFIG = {
  pk10: { cond1: ['5码计划', '6码计划', '7码计划', '8码计划'], cond2: ['冠军', '亚军', '第三名', '第四名', '第五名', '第六名', '第七名', '第八名', '第九名', '第十名'], predict: 'balls', min: 1, max: 10 },
  ffc: { cond1: ['5码计划', '6码计划', '7码计划', '8码计划'], cond2: ['第一球', '第二球', '第三球', '第四球', '第五球'], predict: 'balls', min: 0, max: 9 },
  k3: { cond1: ['两面计划'], cond2: ['和值大小', '和值单双'], predict: 'twoside' },
  lhc: { cond1: ['两面计划'], cond2: ['特码大小', '特码单双'], predict: 'twoside' },
  xy28: { cond1: ['大小计划', '单双计划'], cond2: ['总和'], predict: 'twoside' },
};

// 球图使用与投注页开奖球一致的图片素材（pk10 / ffc 两种玩法才有球号预测）。
const ballSrc = (kind, n) => (kind === 'ffc' ? ffcBallSrc(n) : pk10BallSrc(n));

// cond2 → index into the draw array, for highlighting the winning ball.
const POS_INDEX = {
  冠军: 0, 亚军: 1, 第三名: 2, 第四名: 3, 第五名: 4,
  第六名: 5, 第七名: 6, 第八名: 7, 第九名: 8, 第十名: 9,
  第一球: 0, 第二球: 1, 第三球: 2, 第四球: 3, 第五球: 4,
};

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

const OPPOSITE_SIDE = { 大: '小', 小: '大', 单: '双', 双: '单' };

// Mock a 专家's recent track record (multi-period predictions + rolling 胜率).
// Built once on card-tap (not during render) so it stays stable while viewing.
function genExpertHistory(expert, kind, cond1, cond2, curIssueNum, formatIssue) {
  const cfg = PLAN_CONFIG[kind] || PLAN_CONFIG.pk10;
  const isBalls = cfg.predict === 'balls';
  const ballCount = isBalls ? (parseInt(cond1, 10) || 5) : 1;
  const N = 14;
  const p = expert.winRate / 100;
  const raw = [];
  let cum = 0;
  for (let i = 0; i < N; i++) { // oldest -> newest
    let predicted;
    let winNumber = null;
    const win = Math.random() < p;
    if (isBalls) {
      predicted = genBalls(ballCount, cfg.min, cfg.max);
      if (win) {
        winNumber = predicted[Math.floor(Math.random() * predicted.length)];
      } else {
        const pool = [];
        for (let n = cfg.min; n <= cfg.max; n++) if (!predicted.includes(n)) pool.push(n);
        winNumber = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
      }
    } else {
      const opts = (cond1 === '单双计划' || cond2.includes('单双')) ? ['单', '双'] : ['大', '小'];
      predicted = [opts[Math.floor(Math.random() * opts.length)]];
    }
    cum += win ? 1 : 0;
    raw.push({ predicted, winNumber, win, isBalls, rate: (cum / (i + 1)) * 100 });
  }
  // Newest first, with descending issue numbers.
  const out = [];
  for (let j = 0; j < N; j++) {
    const i = N - 1 - j;
    out.push({ ...raw[i], issue: formatIssue(kind, curIssueNum - 1 - j) });
  }
  return out;
}

const predictKindOf = (kind) => (PLAN_CONFIG[kind]?.predict === 'balls' ? 'balls' : 'twoside');
const fmtCountdown = (sec) => {
  const s = Math.max(0, sec | 0);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// iOS-style toggle switch (no such primitive existed in the app).
function FpSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      className={`fp-switch ${checked ? 'on' : ''}`}
      disabled={disabled}
      aria-pressed={checked}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="fp-switch-thumb" />
    </button>
  );
}

export default function FollowPlanModal({
  open, onClose, gameKind = 'pk10', activeGameId, addToast, onFollowBet, onOpenMenu,
  followPlans = [], placedBets = [], settledBets = [], gamesState = {}, balance = 0,
  formatIssue, onCreatePlan, onEditPlan, onStopPlan,
  chipValues = [10, 20, 40, 60, 100], onOpenChipEdit,
}) {
  const initialCfg = PLAN_CONFIG[gameKind] || PLAN_CONFIG.pk10;
  const [tab, setTab] = useState('experts'); // 'experts' | 'followed'
  const [view, setView] = useState('main');   // 'main' | 'config' | 'detail' | 'records'
  const [selectedGameId, setSelectedGameId] = useState(activeGameId);
  const [cond1, setCond1] = useState(initialCfg.cond1[0]);
  const [cond2, setCond2] = useState(initialCfg.cond2[0]);
  const [round, setRound] = useState(1);
  const [countdown, setCountdown] = useState(ROUND_SECONDS);
  const [openMenu, setOpenMenu] = useState(null); // 'game' | 'cond1' | 'cond2' | null
  const [followedFilter, setFollowedFilter] = useState('all'); // 'all' | 'running' | 'stopped'
  const [activePlanId, setActivePlanId] = useState(null);
  const [recordsRoundIdx, setRecordsRoundIdx] = useState(null);
  const [cfg, setCfg] = useState(null); // config draft (create/edit)
  const [confirmStopId, setConfirmStopId] = useState(null); // plan pending stop confirmation
  const [expertView, setExpertView] = useState(null); // { idx, expert, history } for 专家计划详情

  // Reset to the entry state whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    const c = PLAN_CONFIG[gameKind] || PLAN_CONFIG.pk10;
    setSelectedGameId(activeGameId);
    setCond1(c.cond1[0]);
    setCond2(c.cond2[0]);
    setTab('experts');
    setView('main');
    setRound(1);
    setCountdown(ROUND_SECONDS);
    setOpenMenu(null);
    setCfg(null);
  }, [open, gameKind, activeGameId]);

  // Cosmetic per-round countdown for the 专家计划 browsing tab.
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

  const selectedKind = kindOfGame(selectedGameId) || gameKind;
  const cfgSel = PLAN_CONFIG[selectedKind] || PLAN_CONFIG.pk10;
  const selectedGameName = (ALL_GAMES.find((g) => g.id === selectedGameId) || {}).name || '';
  // 封盘窗口：pk10 提前 15s，其余玩法 10s。封盘时倒计时显示「已封盘」，
  // 且跟投/反投不可点（专家计划列表与专家详情共用）。
  const selGame = gamesState[selectedGameId] || {};
  const sealLockSeconds = selectedKind === 'pk10' ? 15 : 10;
  const isSealed = selGame.timeLeft != null && selGame.timeLeft <= sealLockSeconds;
  // 倒计时与投注页同步：直接用该游戏的 timeLeft（同一 gamesState 时钟），
  // 封盘时显示「已封盘」。
  const countdownText = selGame.timeLeft == null ? '加载中' : isSealed ? '已封盘' : fmtCountdown(selGame.timeLeft);

  const handleSelectGame = (id) => {
    const newKind = kindOfGame(id);
    setSelectedGameId(id);
    if (newKind && newKind !== selectedKind) {
      const nc = PLAN_CONFIG[newKind] || PLAN_CONFIG.pk10;
      setCond1(nc.cond1[0]);
      setCond2(nc.cond2[0]);
    }
  };

  // Predictions for the 专家计划 list regenerate on round / game / condition change.
  const predictions = useMemo(() => {
    const c = PLAN_CONFIG[selectedKind] || PLAN_CONFIG.pk10;
    return EXPERTS.map(() => {
      if (c.predict === 'balls') {
        const n = parseInt(cond1, 10) || 5;
        return { kind: 'balls', value: genBalls(n, c.min, c.max) };
      }
      const opts = (cond1 === '单双计划' || cond2.includes('单双')) ? ['单', '双'] : ['大', '小'];
      return { kind: 'twoside', value: opts[Math.floor(Math.random() * opts.length)] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, selectedGameId, cond1, cond2, selectedKind]);

  if (!open) return null;

  // ---- manual 跟投/反投 (unchanged) ----
  const resolveTargets = (pred, mode) => {
    if (!pred) return [];
    if (pred.kind === 'balls') {
      if (mode === 'follow') return pred.value.map(String);
      const pool = [];
      for (let n = cfgSel.min; n <= cfgSel.max; n++) pool.push(n);
      return pool.filter((n) => !pred.value.includes(n)).map(String);
    }
    const side = mode === 'follow' ? pred.value : (OPPOSITE_SIDE[pred.value] || pred.value);
    return [side];
  };

  const handleFollow = (expert, pred, mode) => {
    const targets = resolveTargets(pred, mode);
    if (!targets.length) { addToast?.('本期暂无可投注号码', 'info'); return; }
    onFollowBet?.({
      mode, gameId: selectedGameId, kind: selectedKind, cond2,
      predictKind: pred.kind, targets, expertName: expert.name,
    });
  };

  // 专家计划 card tap → expert detail with a mock multi-period track record.
  const openExpertDetail = (expert, idx) => {
    const game = gamesState[selectedGameId] || {};
    const history = genExpertHistory(expert, selectedKind, cond1, cond2, game.currentIssue ?? 1, formatIssue);
    setExpertView({ idx, expert, history });
    setView('expertDetail');
  };

  // ---- open the config page (自动跟投 create, or 编辑/重新 an existing plan) ----
  const openConfig = ({ expertName, gameId, gameName, kind, cond1: c1, cond2: c2, editingPlanId = null, seed }) => {
    const bc = predictKindOf(kind) === 'balls' ? (parseInt(c1, 10) || 5) : 1;
    setCfg({
      editingPlanId,
      expertName, gameId, gameName, kind, cond1: c1, cond2: c2,
      ballCount: bc,
      roundsTotal: seed?.roundsTotal ?? 8,
      amountPerBall: seed?.amountPerBall ?? chipValues[0] ?? 50,
      globalMode: seed?.globalMode ?? 'follow',
      stop: seed?.stop ?? { profitAbove: { on: false, val: 0 }, profitBelow: { on: false, val: 0 }, stopOnWin: false, stopOnLose: false },
      perRoundOverrides: seed?.perRoundOverrides ?? [],
      detailOpen: true,
    });
    setView('config');
  };

  const startAutoFollow = (expert) => openConfig({
    expertName: expert.name, gameId: selectedGameId, gameName: selectedGameName,
    kind: selectedKind, cond1, cond2,
  });

  // ---- bottom-sheet pickers (专家计划 filters) ----
  const pickerConfig = {
    game: { current: selectedGameId, title: '请选择游戏', options: ALL_GAMES.map((g) => ({ value: g.id, label: g.name })), apply: handleSelectGame },
    cond1: { current: cond1, title: '请选择计划', options: cfgSel.cond1.map((c) => ({ value: c, label: c })), apply: setCond1 },
    cond2: { current: cond2, title: '请选择', options: cfgSel.cond2.map((c) => ({ value: c, label: c })), apply: setCond2 },
  };
  const selectValue = (key, value) => { pickerConfig[key].apply(value); setOpenMenu(null); };

  // Dropdown-drawer picker (matches the 报表 filters): trigger + inline menu below it.
  const renderTrigger = (key) => {
    const { current, options } = pickerConfig[key];
    return (
      <div className={`history-picker-wrap history-picker-wrap--${key}`}>
        <button type="button" className={`history-picker ${openMenu === key ? 'open' : ''}`} onClick={() => setOpenMenu(openMenu === key ? null : key)}>
          <span className="history-picker-value">{(options.find((o) => o.value === current) || {}).label}</span>
          <svg className="history-picker-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {openMenu === key && (
          <div className="history-dropdown-menu">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`history-dropdown-item ${opt.value === current ? 'active' : ''}`}
                onClick={() => selectValue(key, opt.value)}
              >
                <span>{opt.label}</span>
                {opt.value === current && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Transparent click-catcher to close the dropdown when tapping outside.
  const renderSheet = () => (openMenu ? <div className="history-picker-backdrop" onClick={() => setOpenMenu(null)} /> : null);

  // ---- shared renderers ----
  const renderBalls = (nums, winValue, kind = selectedKind) => nums.map((num) => (
    <img
      key={num}
      className={`pk10-ball fp-img-ball ${winValue != null && num === winValue ? 'fp-ball-hit' : ''}`}
      src={ballSrc(kind, num)}
      alt={num}
    />
  ));

  const renderPrediction = (pred) => {
    if (!pred) return null;
    if (pred.kind === 'twoside') {
      const blue = pred.value === '大' || pred.value === '单';
      return <span className="fp-side-pill" style={{ backgroundColor: blue ? '#3b82f6' : '#f59e0b' }}>{pred.value}</span>;
    }
    return renderBalls(pred.value);
  };

  const renderSidePill = (side) => {
    const blue = side === '大' || side === '单';
    return <span className="fp-side-pill" style={{ backgroundColor: blue ? '#3b82f6' : '#f59e0b' }}>{side}</span>;
  };

  // A round's predicted numbers/side, with optional winning-ball highlight.
  const renderRoundPredict = (plan, roundEntry) => {
    if (!roundEntry) return null;
    if (roundEntry.predictKind === 'twoside') return renderSidePill(roundEntry.predicted[0]);
    const winValue = roundEntry.drawNumbers ? roundEntry.drawNumbers[POS_INDEX[plan.cond2]] : null;
    return renderBalls(roundEntry.predicted, winValue, plan.kind);
  };

  const currentRoundOf = (plan) => plan.rounds.find((r) => !r.settled) || plan.rounds[plan.rounds.length - 1];
  const winRateOf = (plan) => (plan.settledRounds > 0 ? Math.round((plan.winRounds / plan.settledRounds) * 100) : 0);

  // 某专家（当前游戏/计划/球号上下文）是否已有一笔进行中的自动跟投。
  // 一个专家只能有一笔自动跟投：已跟时卡片显示「编辑/停止跟投」而非「自动跟投」。
  const runningPlanFor = (expertName) => followPlans.find((p) =>
    p.expertName === expertName && p.gameId === selectedGameId
    && p.cond1 === cond1 && p.cond2 === cond2 && p.status === 'running'
  );

  // =========================== 专家计划 card ===========================
  const renderExpertCard = (expert, idx) => {
    const pred = predictions[idx];
    const followedPlan = runningPlanFor(expert.name);
    return (
      <div key={expert.name} className="fp-card">
        {/* 标题整行占满卡片宽度（延伸到右侧按钮上方），标签不再换行 */}
        <button type="button" className="fp-card-top" onClick={() => openExpertDetail(expert, idx)}>
          <span className="fp-expert-name">{expert.name}</span>
          {followedPlan && <span className="fp-followed-badge">已跟</span>}
          <span className="fp-tag">{selectedGameName}</span>
          <span className="fp-tag">{cond1}</span>
          <span className="fp-tag">{cond2}</span>
        </button>
        <div className="fp-card-row">
          <button type="button" className="fp-card-main" onClick={() => openExpertDetail(expert, idx)}>
            <div className="fp-stats">
              <div className="fp-stat"><span className="fp-stat-label">长龙</span><span className="fp-stat-val">{expert.dragon ? `${expert.dragon}期` : '--'}</span></div>
              <div className="fp-stat"><span className="fp-stat-label">总胜率</span><span className="fp-stat-val fp-rate">{expert.winRate.toFixed(2)}%</span></div>
              <div className="fp-stat"><span className="fp-stat-label">总输赢</span><span className="fp-stat-val">￥0.00</span></div>
            </div>
            <div className="fp-predict-label">本期预测</div>
            <div className="fp-predict">{renderPrediction(pred)}</div>
          </button>
          <div className="fp-card-actions">
            {followedPlan ? (
              <>
                <button type="button" className="fp-btn" onClick={() => openConfig({ ...followedPlan, editingPlanId: followedPlan.id, seed: followedPlan })}>编辑跟投</button>
                <button type="button" className="fp-btn fp-btn-cancel" onClick={() => setConfirmStopId(followedPlan.id)}>停止跟投</button>
              </>
            ) : (
              <>
                <button type="button" className="fp-btn" disabled={isSealed} onClick={() => handleFollow(expert, pred, 'follow')}>跟投</button>
                <button type="button" className="fp-btn" disabled={isSealed} onClick={() => handleFollow(expert, pred, 'reverse')}>反投</button>
                <button type="button" className="fp-btn" onClick={() => startAutoFollow(expert)}>自动跟投</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =========================== 已跟专家 plan card ===========================
  const renderPlanCard = (plan) => {
    const cur = currentRoundOf(plan);
    const stopped = plan.status !== 'running';
    return (
      <div key={plan.id} className="fp-plan-card">
        <button type="button" className="fp-plan-card-body" onClick={() => { setActivePlanId(plan.id); setView('detail'); }}>
          <div className="fp-card-top">
            <span className="fp-expert-name">{plan.expertName}</span>
            <span className="fp-tag">{plan.gameName}</span>
            <span className="fp-tag">{plan.cond1}</span>
            <span className="fp-tag">{plan.cond2}</span>
          </div>
          <div className="fp-stats">
            <div className="fp-stat"><span className="fp-stat-label">跟投期</span><span className="fp-stat-val">{plan.settledRounds}/{plan.roundsTotal}</span></div>
            <div className="fp-stat"><span className="fp-stat-label">总胜率</span><span className="fp-stat-val fp-rate">{winRateOf(plan)}%</span></div>
            <div className="fp-stat"><span className="fp-stat-label">总输赢</span><span className={`fp-stat-val ${plan.totalWinLoss > 0 ? 'win-text' : plan.totalWinLoss < 0 ? 'loss-text' : ''}`}>￥{plan.totalWinLoss.toFixed(2)}</span></div>
          </div>
          <div className="fp-predict-label">本期预测</div>
          <div className="fp-predict">{renderRoundPredict(plan, cur)}</div>
        </button>
        <div className="fp-card-actions">
          {stopped ? (
            <>
              <button type="button" className="fp-btn" onClick={() => openConfig({ ...plan, seed: plan })}>重新跟投</button>
              <button type="button" className="fp-btn" disabled>已取消</button>
            </>
          ) : (
            <>
              <button type="button" className="fp-btn" onClick={() => openConfig({ ...plan, editingPlanId: plan.id, seed: plan })}>编辑跟投</button>
              <button type="button" className="fp-btn fp-btn-cancel" onClick={() => setConfirmStopId(plan.id)}>停止跟投</button>
            </>
          )}
        </div>
      </div>
    );
  };

  // 已跟专家 respects the game / 计划 / 球号 dropdowns as well as the status tabs.
  const filteredPlans = followPlans.filter((p) => (
    p.gameId === selectedGameId && p.cond1 === cond1 && p.cond2 === cond2
    && (followedFilter === 'all' ? true : followedFilter === 'running' ? p.status === 'running' : p.status !== 'running')
  ));

  // =========================== config page (图一) ===========================
  const configRoundMode = (i) => cfg.perRoundOverrides.find((o) => o.idx === i)?.mode ?? cfg.globalMode;
  const configRoundAmount = (i) => cfg.perRoundOverrides.find((o) => o.idx === i)?.amount ?? cfg.amountPerBall;
  const configRoundCount = (mode) => (predictKindOf(cfg?.kind) === 'twoside' ? 1 : (mode === 'follow' ? cfg.ballCount : 10 - cfg.ballCount));

  const setRoundOverride = (i, patch) => setCfg((c) => {
    const rest = c.perRoundOverrides.filter((o) => o.idx !== i);
    const existing = c.perRoundOverrides.find((o) => o.idx === i) || { idx: i };
    return { ...c, perRoundOverrides: [...rest, { ...existing, ...patch }] };
  });
  const setGlobalMode = (m) => setCfg((c) => ({ ...c, globalMode: m, perRoundOverrides: c.perRoundOverrides.map((o) => ({ ...o, mode: undefined })).filter((o) => o.amount !== undefined) }));
  const setGlobalAmount = (a) => setCfg((c) => ({ ...c, amountPerBall: a, perRoundOverrides: c.perRoundOverrides.map((o) => ({ ...o, amount: undefined })).filter((o) => o.mode !== undefined) }));

  const configTotal = () => {
    let total = 0;
    for (let i = 0; i < cfg.roundsTotal; i++) total += configRoundCount(configRoundMode(i)) * configRoundAmount(i);
    return total;
  };

  const renderConfig = () => {
    const game = gamesState[cfg.gameId] || {};
    const startIssueNum = game.currentIssue ?? 0;
    const rows = Array.from({ length: cfg.roundsTotal }, (_, i) => i);
    const headCount = configRoundCount(cfg.globalMode);
    return (
      <>
        <div className="fp-config-body">
          <div className="fp-config-card">
            <div className="fp-config-row">
              <span className="fp-config-label">起始期号</span>
              <span className="fp-config-box readonly">{formatIssue(cfg.kind, startIssueNum)}</span>
            </div>
            <div className="fp-config-row">
              <span className="fp-config-label">全局投注金额</span>
              <span className="fp-config-box readonly">{cfg.amountPerBall} 元</span>
            </div>
            <div className="fp-config-row">
              <span className="fp-config-label">跟投期数</span>
              <span className="fp-config-box">
                <input
                  type="number" pattern="[0-9]*" className="fp-config-input" value={cfg.roundsTotal}
                  onChange={(e) => setCfg((c) => ({ ...c, roundsTotal: Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)) }))}
                />期
              </span>
            </div>
            <div className="fp-config-row">
              <span className="fp-config-label">全局正反投设置 <em>(*设置全部正反投，选中为正，反之为反)</em></span>
              <FpSwitch checked={cfg.globalMode === 'follow'} onChange={(v) => setGlobalMode(v ? 'follow' : 'reverse')} />
            </div>
            <div className="fp-config-hint">* 已开盘期数不被保存</div>
          </div>

          <div className="fp-config-section-title">跟投停止条件设置</div>
          <div className="fp-config-card">
            <label className="fp-config-stop-row">
              <input type="checkbox" checked={cfg.stop.profitAbove.on} onChange={(e) => setCfg((c) => ({ ...c, stop: { ...c.stop, profitAbove: { ...c.stop.profitAbove, on: e.target.checked } } }))} />
              <span>当盈利超过</span>
              <input type="number" className="fp-config-stop-input" value={cfg.stop.profitAbove.val} onChange={(e) => setCfg((c) => ({ ...c, stop: { ...c.stop, profitAbove: { ...c.stop.profitAbove, val: parseInt(e.target.value, 10) || 0 } } }))} />
              <span>停止跟投</span>
            </label>
            <label className="fp-config-stop-row">
              <input type="checkbox" checked={cfg.stop.profitBelow.on} onChange={(e) => setCfg((c) => ({ ...c, stop: { ...c.stop, profitBelow: { ...c.stop.profitBelow, on: e.target.checked } } }))} />
              <span>当盈利低于</span>
              <input type="number" className="fp-config-stop-input" value={cfg.stop.profitBelow.val} onChange={(e) => setCfg((c) => ({ ...c, stop: { ...c.stop, profitBelow: { ...c.stop.profitBelow, val: parseInt(e.target.value, 10) || 0 } } }))} />
              <span>停止跟投</span>
            </label>
            <div className="fp-config-stop-checks">
              <label className="fp-config-check"><input type="checkbox" checked={cfg.stop.stopOnWin} onChange={(e) => setCfg((c) => ({ ...c, stop: { ...c.stop, stopOnWin: e.target.checked } }))} /><span>中奖即停止跟投</span></label>
              <label className="fp-config-check"><input type="checkbox" checked={cfg.stop.stopOnLose} onChange={(e) => setCfg((c) => ({ ...c, stop: { ...c.stop, stopOnLose: e.target.checked } }))} /><span>不中奖即停止跟投</span></label>
            </div>
          </div>

          <button type="button" className="fp-config-toggle" onClick={() => setCfg((c) => ({ ...c, detailOpen: !c.detailOpen }))}>
            {cfg.detailOpen ? '收起跟投详情 ˄' : '展开跟投详情 ˅'}
          </button>

          {cfg.detailOpen && (
            <div className="fp-config-card">
              <div className="fp-detail-table-head">
                <span>期数</span><span>期号</span><span>正反投</span><span>金额(每球)</span>
              </div>
              {rows.map((i) => (
                <div key={i} className="fp-detail-table-row">
                  <span>{i + 1}期</span>
                  <span className="fp-mono">{formatIssue(cfg.kind, startIssueNum + i)}</span>
                  <span><FpSwitch checked={configRoundMode(i) === 'follow'} onChange={(v) => setRoundOverride(i, { mode: v ? 'follow' : 'reverse' })} /></span>
                  <span><input type="number" className="fp-detail-amt" value={configRoundAmount(i)} onChange={(e) => setRoundOverride(i, { amount: parseInt(e.target.value, 10) || 0 })} /></span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fp-config-footer">
          <div className="fp-config-footer-top">
            <span className="fp-config-balance">余额：￥{balance.toFixed(2)}</span>
            <span className="fp-config-summary"><b>{headCount}</b>个号码，<b>{cfg.roundsTotal}</b>期，共<b>{configTotal()}</b>元</span>
          </div>
          <div className="chips-row">
            {chipValues.map((v, i) => (
              <button key={i} type="button" className={`chip-btn ${cfg.amountPerBall === v ? 'active' : ''}`} onClick={() => setGlobalAmount(v)}>{v}</button>
            ))}
            <button type="button" className="edit-chip-btn" onClick={onOpenChipEdit} title="编辑快捷金额">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>
          <div className="fp-config-actions">
            <input type="number" className="fp-config-amt-input" value={cfg.amountPerBall} onChange={(e) => setGlobalAmount(parseInt(e.target.value, 10) || 0)} />
            <button type="button" className="fp-config-btn cancel" onClick={() => { setView('main'); setCfg(null); }}>取消</button>
            <button type="button" className="fp-config-btn ok" onClick={confirmConfig}>确认</button>
          </div>
        </div>
      </>
    );
  };

  const confirmConfig = () => {
    const { detailOpen, editingPlanId, ...planConfig } = cfg;
    void detailOpen;
    if (editingPlanId) onEditPlan?.(editingPlanId, planConfig);
    else onCreatePlan?.(planConfig);
    setView('main');
    // 确认后保持在原本的标签页（如「专家计划」），不强制跳到「已跟专家」
    setCfg(null);
  };

  // =========================== 专家计划详情 (expert track record) ===========================
  const renderHistoryBalls = (r) => {
    if (!r.isBalls) return renderSidePill(r.predicted[0]);
    return r.predicted.map((num) => (
      <span key={num} className="fp-hist-ball-wrap">
        <img className="pk10-ball fp-img-ball fp-hist-ball" src={ballSrc(selectedKind, num)} alt={num} />
        {num === r.winNumber && <span className="fp-hist-dot" />}
      </span>
    ));
  };

  const renderExpertDetail = () => {
    if (!expertView) { setView('main'); return null; }
    const { idx, expert, history } = expertView;
    const pred = predictions[idx];
    const followedPlan = runningPlanFor(expert.name);
    // 封盘状态与倒计时文案沿用组件级 isSealed / countdownText（见上方定义）。
    const cd = countdownText;
    return (
      <div className="fp-detail-body">
        <div className="fp-detail-band">
          <div className="fp-detail-band-top">
            <span className="fp-expert-name">{expert.name}</span>
            {followedPlan && <span className="fp-followed-badge">已跟</span>}
            <span className="fp-detail-band-tags">{cond1} | {selectedGameName} | {cond2}</span>
          </div>
          <div className="fp-detail-band-content">
            <div className="fp-stats">
              <div className="fp-stat"><span className="fp-stat-label">长龙</span><span className="fp-stat-val">{expert.dragon ? `${expert.dragon}期` : '--'}</span></div>
              <div className="fp-stat"><span className="fp-stat-label">总胜率</span><span className="fp-stat-val fp-rate">{expert.winRate.toFixed(2)}%</span></div>
              <div className="fp-stat"><span className="fp-stat-label">总输赢</span><span className="fp-stat-val">￥0</span></div>
            </div>
            <div className="fp-expert-predict-row">
              <div className="fp-ep-left">
                <div className="fp-predict-label">本期预测</div>
                <div className="fp-predict">{renderPrediction(pred)}</div>
              </div>
              <div className="fp-ep-right">
                <div className="fp-predict-label">倒计时</div>
                <div className={`fp-ep-timer ${isSealed ? 'sealed' : ''}`}>{cd}</div>
              </div>
            </div>
            <div className="fp-expert-detail-actions">
              {followedPlan ? (
                <>
                  <button type="button" className="fp-btn" onClick={() => openConfig({ ...followedPlan, editingPlanId: followedPlan.id, seed: followedPlan })}>编辑跟投</button>
                  <button type="button" className="fp-btn fp-btn-cancel" onClick={() => setConfirmStopId(followedPlan.id)}>停止跟投</button>
                </>
              ) : (
                <>
                  <button type="button" className="fp-btn" disabled={isSealed} onClick={() => handleFollow(expert, pred, 'follow')}>跟投</button>
                  <button type="button" className="fp-btn" disabled={isSealed} onClick={() => handleFollow(expert, pred, 'reverse')}>反投</button>
                  <button type="button" className="fp-btn" onClick={() => startAutoFollow(expert)}>自动跟投</button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="fp-detail-rounds">
          {history.map((r, j) => (
            <div key={j} className="fp-hist-row">
              <span className={`fp-round-pill ${r.win ? 'win' : 'lose'}`}>{r.win ? '中' : '挂'}</span>
              <div className="fp-hist-info">
                <div className="fp-hist-issue">{r.issue}期</div>
                <div className="fp-hist-stats">
                  <div className="fp-hist-col"><span className="fp-hist-lbl">输赢</span><span className="fp-hist-val">￥0</span></div>
                  <div className="fp-hist-col"><span className="fp-hist-lbl">胜率</span><span className="fp-hist-val fp-rate">{r.rate.toFixed(2)}%</span></div>
                </div>
              </div>
              <div className="fp-hist-balls">{renderHistoryBalls(r)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =========================== plan detail (图三/四) ===========================
  const renderDetail = () => {
    const plan = followPlans.find((p) => p.id === activePlanId);
    if (!plan) { setView('main'); return null; }
    const cur = currentRoundOf(plan);
    const running = plan.status === 'running';
    const game = gamesState[plan.gameId] || {};
    const curStake = cur && !cur.settled ? cur.betUids.length * cur.amount : 0;
    return (
      <div className="fp-detail-body">
        <div className="fp-detail-band">
          <div className="fp-detail-band-top">
            <span className="fp-expert-name">{plan.expertName}</span>
            <span className="fp-detail-band-tags">{plan.cond1} | {plan.gameName} | {plan.cond2}</span>
          </div>
          <div className="fp-detail-band-content">
            <div className="fp-stats fp-stats-inline">
              <div className="fp-stat"><span className="fp-stat-label">跟投期</span><span className="fp-stat-val">{plan.settledRounds}/{plan.roundsTotal}</span></div>
              <div className="fp-stat"><span className="fp-stat-label">总胜率</span><span className="fp-stat-val fp-rate">{winRateOf(plan)}%</span></div>
              <div className="fp-stat"><span className="fp-stat-label">总输赢</span><span className={`fp-stat-val ${plan.totalWinLoss > 0 ? 'win-text' : plan.totalWinLoss < 0 ? 'loss-text' : ''}`}>￥{plan.totalWinLoss.toFixed(2)}</span></div>
            </div>
            <div className="fp-detail-band-mid">
              {running
                ? <span>本期投注：<b>{curStake}</b></span>
                : <span>提前结束：<b>{plan.stopReason}</b></span>}
              {running && <span className="fp-timer">倒计时 <span className="fp-timer-val">{fmtCountdown(game.timeLeft)}</span></span>}
            </div>
            <div className="fp-detail-actions">
              {running ? (
                <>
                  <button type="button" className="fp-btn" onClick={() => openConfig({ ...plan, editingPlanId: plan.id, seed: plan })}>编辑计划</button>
                  <button type="button" className="fp-btn fp-btn-cancel" onClick={() => setConfirmStopId(plan.id)}>停止跟投</button>
                </>
              ) : (
                <>
                  <button type="button" className="fp-btn" onClick={() => openConfig({ ...plan, seed: plan })}>重新跟投</button>
                  <button type="button" className="fp-btn" disabled>已取消</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="fp-detail-rounds">
          {[...plan.rounds].reverse().map((r) => {
            const pill = !r.settled ? { cls: 'wait', label: '待' } : r.winLoss > 0 ? { cls: 'win', label: '中' } : { cls: 'lose', label: '挂' };
            return (
              <button key={r.idx} type="button" className="fp-round-item" onClick={() => { setRecordsRoundIdx(r.idx); setView('records'); }}>
                <span className={`fp-round-pill ${pill.cls}`}>{pill.label}</span>
                <div className="fp-round-mid">
                  <div className="fp-round-line">
                    <span className="fp-round-issue">{r.issue}期</span>
                    <span className="fp-tag-sm">已投</span>
                  </div>
                  <div className="fp-round-line sub">
                    <span className="fp-round-field">
                      <span className="fp-round-field-lbl">正反投</span>
                      <b className="fp-round-mode">{r.mode === 'follow' ? '正投' : '反投'}</b>
                    </span>
                    <span className="fp-round-field">
                      <span className="fp-round-field-lbl">输赢</span>
                      {r.settled ? <b className={r.winLoss > 0 ? 'win-text' : r.winLoss < 0 ? 'loss-text' : ''}>￥{r.winLoss.toFixed(2)}</b> : <span>--</span>}
                    </span>
                  </div>
                </div>
                <div className="fp-round-balls">{renderRoundPredict(plan, r)}</div>
                <svg className="fp-round-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================== 跟单记录 (图五) ===========================
  const handleCopy = (text) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => addToast?.('复制成功', 'success')).catch(() => {});
    }
  };

  const renderRecords = () => {
    const plan = followPlans.find((p) => p.id === activePlanId);
    const roundEntry = plan?.rounds.find((r) => r.idx === recordsRoundIdx);
    if (!plan || !roundEntry) { setView('detail'); return null; }
    const uids = new Set(roundEntry.betUids);
    const settledMap = new Map(settledBets.filter((b) => uids.has(b.uid)).map((b) => [b.uid, b]));
    const bets = roundEntry.betUids.map((uid) => {
      const s = settledMap.get(uid);
      if (s) return { ...s, settled: true };
      const p = placedBets.find((b) => b.uid === uid);
      return p ? { ...p, settled: false } : null;
    }).filter(Boolean);
    return (
      <div className="fp-records-body">
        {bets.length === 0 ? (
          <div className="fp-empty">暂无记录</div>
        ) : bets.map((bet) => (
          <div key={bet.uid} className="settled-bet-card">
            <div className="bet-card-header">
              <span>{bet.gameName} <span className="issue-text">（期号：{bet.issue}）</span></span>
            </div>
            <div className="bet-card-body">
              <div className="bet-detail-row full-width">
                <span className="detail-label">注单：</span>
                <span className="detail-value order-id-container">
                  {bet.orderId}
                  <button type="button" className="copy-btn" onClick={() => handleCopy(bet.orderId)} title="复制单号">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  </button>
                </span>
              </div>
              <div className="bet-detail-grid">
                <div className="bet-detail-column">
                  <div className="bet-detail-row"><span className="detail-label">时间：</span><span className="detail-value">{bet.timestamp}</span></div>
                  <div className="bet-detail-row"><span className="detail-label">金额：</span><span className="detail-value highlight-blue">{bet.amount}</span></div>
                  <div className="bet-detail-row"><span className="detail-label">投注：</span><span className="detail-value play-name-text">{bet.positionName} {bet.betName}@{bet.odds}</span></div>
                </div>
                <div className="bet-detail-column">
                  <div className="bet-detail-row"><span className="detail-label">退水：</span><span className="detail-value highlight-blue">0</span></div>
                  <div className="bet-detail-row"><span className="detail-label">输赢：</span><span className={`detail-value ${bet.settled ? (bet.winLoss > 0 ? 'win-text' : bet.winLoss < 0 ? 'loss-text' : '') : ''}`}>{bet.settled ? bet.winLoss.toFixed(2) : '--'}</span></div>
                  <div className="bet-detail-row"><span className="detail-label">状态：</span><span className="detail-value highlight-blue">{bet.settled ? '已结算' : '未结算'}</span></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // =========================== header ===========================
  const backHandler = () => {
    if (view === 'records') { setView('detail'); return; }
    if (view === 'detail') { setView('main'); setTab('followed'); return; }
    if (view === 'expertDetail') { setView('main'); setTab('experts'); return; }
    if (view === 'config') { setView('main'); setCfg(null); return; }
    onClose();
  };
  const headerTitle = view === 'config' ? '跟单计划'
    : view === 'detail' ? '跟单计划详情'
      : view === 'expertDetail' ? '专家计划详情'
        : view === 'records' ? '跟单记录' : '计划中心';

  return (
    <div className="fp-page">
      <div className="fp-modal">
        <div className="fp-header">
          <button type="button" className="fp-back" onClick={backHandler} aria-label="返回">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="fp-title">{headerTitle}</span>
          {view === 'expertDetail' || view === 'detail' ? (
            <span className="fp-header-balance">余额: {balance.toLocaleString()}</span>
          ) : view === 'main' ? (
            <button type="button" className="fp-menu-btn" onClick={() => onOpenMenu?.()} aria-label="菜单">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
          ) : <span className="fp-header-spacer" />}
        </div>

        {view === 'main' && (
          <>
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
                  <span className="fp-timer">倒计时 <span className="fp-timer-val">{countdownText}</span></span>
                </div>
                <div className="fp-list">
                  {EXPERTS.map((e, i) => renderExpertCard(e, i))}
                </div>
              </>
            )}

            {tab === 'followed' && (
              <>
                <div className="fp-filters">
                  {renderTrigger('game')}
                  {renderTrigger('cond1')}
                  {renderTrigger('cond2')}
                </div>
                <div className="history-tabs fp-status-tabs">
                  {[['all', '所有状态'], ['running', '进行中计划'], ['stopped', '已停止计划']].map(([v, label]) => (
                    <button key={v} type="button" className={`history-tab ${followedFilter === v ? 'active' : ''}`} onClick={() => setFollowedFilter(v)}>{label}</button>
                  ))}
                </div>
                <div className="fp-list">
                  {filteredPlans.length === 0 ? (
                    <div className="fp-empty">暂无已跟专家<br />在「专家计划」中点击「自动跟投」即可添加</div>
                  ) : filteredPlans.map((p) => renderPlanCard(p))}
                </div>
              </>
            )}
          </>
        )}

        {view === 'config' && cfg && renderConfig()}
        {view === 'expertDetail' && renderExpertDetail()}
        {view === 'detail' && renderDetail()}
        {view === 'records' && renderRecords()}

        {renderSheet()}

        {confirmStopId && (
          <>
            <div className="fp-confirm-backdrop" onClick={() => setConfirmStopId(null)} />
            <div className="fp-confirm-dialog">
              <div className="fp-confirm-title">确认停止</div>
              <div className="fp-confirm-msg">确定要停止这个跟单计划吗？</div>
              <div className="fp-confirm-actions">
                <button type="button" className="fp-confirm-btn cancel" onClick={() => setConfirmStopId(null)}>取消</button>
                <button type="button" className="fp-confirm-btn ok" onClick={() => { onStopPlan?.(confirmStopId); setConfirmStopId(null); }}>确认停止</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
