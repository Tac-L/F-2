import { useState, useEffect, useRef } from 'react';
import {
  PK10_COLORS, POSITIONS, SHORTCUT_POSITIONS, ODDS,
  FFC_COLORS, FFC_POSITIONS, FFC_ODDS, FFC_TRIPLE_GROUPS, FFC_TRIPLE_OPTIONS,
  K3_ODDS, K3_SHORT_PAIRS, K3_LONG_PAIRS, K3_TRIPLES,
  K3_SUM_ODDS, K3_TWO_SAME, K3_THREE_DIFF,
  xy28SumOdds, XY28_SUM_TWO_SIDED, XY28_SIDE_OPTIONS, XY28_TAIL_TWO_SIDED,
  XY28_DTL_OPTIONS, XY28_EXTREME_OPTIONS, XY28_THREE_BALL_OPTIONS,
  LHC_TEMA_ODDS, LHC_TEMA_TWO_SIDED, LHC_QUICK_CATEGORIES,
  LHC_ZHENGMA_ODDS, LHC_ZHENGMA_TWO_SIDED,
  LHC_ZHENGTE_POS, LHC_ZHENGTE_ODDS, LHC_ZHENGTE_TWO_SIDED,
  LHC_ZODIACS, LHC_TEXIAO_NUMBERS, lhcTexiaoOdds, lhcXiaoOdds,
  LHC_TAIL_GROUPS, LHC_HEAD_GROUPS,
  lhcWeishuOdds, lhcWeishuNoOdds, lhcTeweishuOdds, lhcTetoushuOdds,
  LHC_BANBO_ITEMS, LHC_WUXING, LHC_ZONGXIAO,
  LHC_QISEBO, LHC_HEXIAO_CATEGORIES, LHC_HEXIAO_CN, lhcHexiaoOdds, combinations,
  lhcNumbersForCategory, lhcColorOf, LHC_WAVE_HEX, lhcPankouFactor,
} from '../constants/gameData';
import Dice from './Dice';

export default function PlayArea({
  activeTab,
  selectedBets,
  onToggleBet,
  longDragonStats,
  isClosed,
  selectedShortcutPositions,
  setSelectedShortcutPositions,
  selectedShortcutOptions,
  gameKind = 'pk10',
  pankou = 'A'
}) {
  // 六合彩 盘口 (A~D) scales every LHC odds. adj() rounds to 2 decimals.
  const pankouFactor = gameKind === 'lhc' ? lhcPankouFactor(pankou) : 1;
  const adj = (o) => Math.round(o * pankouFactor * 100) / 100;

  // 玩法说明 (play rules) modal — currently for PK10 (赛车). Keyed by activeTab;
  // 两面盘 has two sub-sections (大小单双 / 龙虎).
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSub, setHelpSub] = useState('ds'); // 'ds' (大小单双) | 'lh' (龙虎)
  // Close the modal whenever the user switches play tabs.
  useEffect(() => { setHelpOpen(false); }, [activeTab]);

  // A small "玩法说明 ?" button shown above the play content.
  const renderPlayHelpBar = () => (
    <div className="play-help-bar">
      <button type="button" className="play-help-btn" onClick={() => setHelpOpen(true)}>
        玩法说明
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
    </div>
  );

  // The 玩法说明 modal. Content depends on the active PK10 tab.
  const renderPlayHelpModal = () => {
    if (!helpOpen) return null;
    return (
      <div className="play-help-overlay" onClick={() => setHelpOpen(false)}>
        <div className="play-help-modal" onClick={(e) => e.stopPropagation()}>
          <div className="play-help-header">
            <span className="play-help-title">玩法说明</span>
            <button type="button" className="play-help-close" onClick={() => setHelpOpen(false)}>&times;</button>
          </div>

          {activeTab === 'guess-number' && (
            <div className="play-help-body">
              <div className="play-help-box">
                每一个号码为一投注组合，投注号码对应所投名次视为中奖，其余情况视为不中奖。
                {'\n\n'}例：投注号码1为冠军，开奖结果号码1为冠军，即为中奖。
              </div>
            </div>
          )}

          {activeTab === 'sum-combination' && (
            <div className="play-help-body">
              <div className="play-help-box">冠亚和：冠军号码+亚军号码=冠亚和值</div>
              <p className="play-help-text">“冠亚和值”可能出现的结果为 3—19，投中对应“冠亚和值”数字的视为中奖，其余视为不中奖。</p>
            </div>
          )}

          {activeTab === 'two-sided' && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${helpSub === 'ds' ? 'active' : ''}`}
                  onClick={() => setHelpSub('ds')}
                >大小单双</button>
                <button
                  type="button"
                  className={`play-help-tab ${helpSub === 'lh' ? 'active' : ''}`}
                  onClick={() => setHelpSub('lh')}
                >龙虎</button>
              </div>
              {helpSub === 'ds' ? (
                <div className="play-help-box">
                  单双：号码为单数叫单，如：1、3、5、7、9，号码为双数叫双，如：2、4、6、8、10。投注号码对应所投单双视为中奖，反之视为不中奖。
                  {'\n\n'}例：投注冠军位为双，开奖结果冠军位为号码 2 即为中奖。
                  {'\n\n'}大小：开出之号码大于等于 6 为大，小于等于 5 为小。投注号码对应所投大小视为中奖，反之视为不中奖。
                  {'\n\n'}例：投注冠军位为大，开奖结果冠军位为号码 6 即为中奖。
                </div>
              ) : (
                <div className="play-help-box">
                  龙虎：
                  {'\n'}·冠军龙/虎
                  {'\n'}“第一名”号码大于“第十名”号码视为【龙】中奖、反之小于视为【虎】中奖。
                  {'\n\n'}·亚军龙/虎
                  {'\n'}“第二名”号码大于“第九名”号码视为【龙】中奖、反之小于视为【虎】中奖。
                  {'\n\n'}·第三名龙/虎
                  {'\n'}“第三名”号码大于“第八名”号码视为【龙】中奖、反之小于视为【虎】中奖。
                  {'\n\n'}·第四名龙/虎
                  {'\n'}“第四名”号码大于“第七名”号码视为【龙】中奖、反之小于视为【虎】中奖。
                  {'\n\n'}·第五名龙/虎
                  {'\n'}“第五名”号码大于“第六名”号码视为【龙】中奖、反之小于视为【虎】中奖。
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  // Accordion state for "猜号码" (Guess Numbers) and "两面盘" (Two-sided)
  // Default to open first two positions (Champion and Runner-up)
  const [openAccordions, setOpenAccordions] = useState({
    p1: true,
    b1: true,
    'dragon-tiger': true,
    front: true,
    'xy28-sum': true,
    'xy28-sum-two': true,
    'xy28-tail-num': true,
    'xy28-tail-two': true,
    'lhc-quick': true,
    'lhc-num': true,
    'lhc-two': true,
    'lhc-zm-quick': true,
    'lhc-zm-num': true,
    'lhc-zm-two': true,
    'lhc-zt-quick': true,
    'lhc-zt-num': true,
    'lhc-zt-two': true,
  });

  const toggleAccordion = (posId) => {
    setOpenAccordions(prev => ({
      ...prev,
      [posId]: !prev[posId]
    }));
  };

  // 特码 (LHC) local UI state: 盘口 panel (A/B), 玩法 mode, and 快捷投注 textarea.
  const [temaPanel, setTemaPanel] = useState('A');
  const [zhengtePos, setZhengtePos] = useState(0); // 正特 开奖位置 0..5 (特一..特六)
  const [quickText, setQuickText] = useState('');
  // 合肖: chosen 类别 (生肖个数) + currently selected 生肖.
  const [hexiaoCat, setHexiaoCat] = useState(2);
  const [hexiaoZodiacs, setHexiaoZodiacs] = useState([]);

  // Clear the local 合肖 selection once its combo bets leave selectedBets
  // (after 投注 / 重置 / 封盘) so highlighted cards don't get out of sync.
  const hexiaoComboActive = selectedBets.some((b) => b.type === 'lhc-hexiao');
  const prevHexiaoCombo = useRef(false);
  useEffect(() => {
    if (prevHexiaoCombo.current && !hexiaoComboActive) setHexiaoZodiacs([]);
    prevHexiaoCombo.current = hexiaoComboActive;
  }, [hexiaoComboActive]);

  // Blue side vs orange side for 两面 / 长龙 labels.
  const blueSide = (label) =>
    ['大', '单', '合单', '大单', '大双', '尾大', '野兽', '龙'].includes(label);

  const isBetSelected = (betId) => {
    return selectedBets.some(b => b.id === betId);
  };

  // Render Ball Item (number box with standard PK10 colors)
  const renderBall = (num) => {
    const color = PK10_COLORS[num] || { bg: '#9ca3af', text: '#ffffff' };
    return (
      <span
        key={num}
        className="pk10-ball"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {num}
      </span>
    );
  };

  // Render FFC ball (digit 0-9 with FFC colors)
  const renderFfcBall = (num) => {
    const color = FFC_COLORS[num] || { bg: '#9ca3af', text: '#ffffff' };
    return (
      <span
        key={num}
        className="pk10-ball"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {num}
      </span>
    );
  };

  // Render checkmark badge if selected
  const renderCheckmark = (isSelected) => {
    if (!isSelected) return null;
    return <div className="selected-checkmark" />;
  };

  // ================= TAB 1: 长龙 (Long Dragon) =================
  const renderLongDragon = () => {
    return (
      <div className="play-area">
        <div className="sub-header-desc">当前长龙数据统计到：上期开奖</div>
        {longDragonStats.map((stat, index) => {
          // Find standard bet configuration based on stat type
          // stat.id format e.g. "p8-twosided-单"
          const isSelOpt1 = isBetSelected(stat.opt1Id);
          const isSelOpt2 = isBetSelected(stat.opt2Id);

          return (
            <div key={index} className="dragon-card">
              <div className="dragon-header">
                <span className="dragon-title">{stat.title}</span>
                <span className="dragon-count">{stat.consecutive} 期</span>
              </div>
              <div className="dragon-bet-grid">
                <button
                  type="button"
                  className={`bet-button ${isSelOpt1 ? 'selected' : ''}`}
                  onClick={() => onToggleBet(stat.opt1BetObj)}
                  disabled={isClosed}
                >
                  <span className="bet-button-text" style={{
                    backgroundColor: blueSide(stat.opt1Label) ? '#3b82f6' : '#f59e0b',
                    color: '#fff'
                  }}>{stat.opt1Label}</span>
                  <span className="bet-button-odds">{stat.odds1}</span>
                  {renderCheckmark(isSelOpt1)}
                </button>
                <button
                  type="button"
                  className={`bet-button ${isSelOpt2 ? 'selected' : ''}`}
                  onClick={() => onToggleBet(stat.opt2BetObj)}
                  disabled={isClosed}
                >
                  <span className="bet-button-text" style={{
                    backgroundColor: blueSide(stat.opt2Label) ? '#3b82f6' : '#f59e0b',
                    color: '#fff'
                  }}>{stat.opt2Label}</span>
                  <span className="bet-button-odds">{stat.odds2}</span>
                  {renderCheckmark(isSelOpt2)}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ================= TAB 2: 快捷 (Shortcut) =================
  const renderShortcut = () => {
    const toggleShortcutPosition = (posId) => {
      setSelectedShortcutPositions(prev => {
        const exists = prev.includes(posId);
        if (exists) {
          return prev.filter(id => id !== posId);
        } else {
          return [...prev, posId];
        }
      });
    };

    return (
      <div className="play-area">
        {/* Positions sub-navigation */}
        <div className="shortcut-positions-wrapper">
          {SHORTCUT_POSITIONS.map((pos) => {
            const isSelected = selectedShortcutPositions.includes(pos.id);
            return (
              <button
                key={pos.id}
                type="button"
                className={`shortcut-pos-tab ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleShortcutPosition(pos.id)}
              >
                {pos.name}
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>

        {/* Betting options grid */}
        <div className="betting-grid">
          {/* Numbers 1-10 */}
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
            const optId = `number-${num}`;
            const isSelected = selectedShortcutOptions.includes(optId);
            const betObj = {
              tabId: 'shortcut',
              type: 'number',
              betName: num.toString()
            };

            return (
              <button
                key={num}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                {renderBall(num)}
                <span className="bet-button-odds">{ODDS.number}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}

          {/* Two-sided: Big, Small, Odd, Even */}
          {['大', '小', '单', '双'].map((opt) => {
            const optId = `twosided-${opt}`;
            const isSelected = selectedShortcutOptions.includes(optId);
            const betObj = {
              tabId: 'shortcut',
              type: 'twosided',
              betName: opt
            };

            return (
              <button
                key={opt}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="bet-button-text" style={{
                  backgroundColor: opt === '大' || opt === '单' ? '#3b82f6' : '#f97316',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>{opt}</span>
                <span className="bet-button-odds">{ODDS.twoSided}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ================= TAB 3: 猜号码 (Guess Number) =================
  const renderGuessNumber = () => {
    return (
      <div className="play-area">
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
        {POSITIONS.map((pos) => {
          const isOpen = !!openAccordions[pos.id];
          return (
            <div key={pos.id} className="accordion-section">
              <div 
                className={`accordion-header ${isOpen ? 'open' : ''}`}
                onClick={() => toggleAccordion(pos.id)}
              >
                <span>{pos.name}</span>
                <i className={`accordion-arrow ${isOpen ? 'open' : ''}`} />
              </div>
              {isOpen && (
                <div className="accordion-content">
                  <div className="betting-grid">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                      const betId = `position-${pos.id}-number-${num}`;
                      const isSelected = isBetSelected(betId);
                      const betObj = {
                        id: betId,
                        tabId: 'guess-number',
                        positionId: pos.id,
                        positionName: pos.name,
                        betName: num.toString(),
                        odds: ODDS.number,
                        displayTitle: `${pos.name}-${num}`,
                        type: 'number'
                      };

                      return (
                        <button
                          key={num}
                          type="button"
                          className={`bet-button ${isSelected ? 'selected' : ''}`}
                          onClick={() => onToggleBet(betObj)}
                          disabled={isClosed}
                        >
                          {renderBall(num)}
                          <span className="bet-button-odds">{ODDS.number}</span>
                          {renderCheckmark(isSelected)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ================= TAB 4: 两面盘 (Two Sided) =================
  const renderTwoSided = () => {
    return (
      <div className="play-area">
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
        {POSITIONS.map((pos, idx) => {
          const isOpen = !!openAccordions[pos.id];
          // E.g. Champion vs 10th. Index 0 vs 9.
          // Dragon/Tiger is applicable to first 5 positions (1st vs 10th, 2nd vs 9th, 3rd vs 8th, 4th vs 7th, 5th vs 6th)
          const hasDragonTiger = idx < 5;
          const options = hasDragonTiger 
            ? ['大', '小', '单', '双', '龙', '虎'] 
            : ['大', '小', '单', '双'];

          return (
            <div key={pos.id} className="accordion-section">
              <div 
                className={`accordion-header ${isOpen ? 'open' : ''}`}
                onClick={() => toggleAccordion(pos.id)}
              >
                <span>{pos.name}</span>
                <i className={`accordion-arrow ${isOpen ? 'open' : ''}`} />
              </div>
              {isOpen && (
                <div className="accordion-content">
                  <div className="betting-grid">
                    {options.map((opt) => {
                      const type = (opt === '龙' || opt === '虎') ? 'dragontiger' : 'twosided';
                      const betId = `position-${pos.id}-${type}-${opt}`;
                      const isSelected = isBetSelected(betId);
                      const betObj = {
                        id: betId,
                        tabId: 'two-sided',
                        positionId: pos.id,
                        positionName: pos.name,
                        betName: opt,
                        odds: ODDS.twoSided,
                        displayTitle: `${pos.name}-${opt}`,
                        type: type
                      };

                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`bet-button ${isSelected ? 'selected' : ''}`}
                          onClick={() => onToggleBet(betObj)}
                          disabled={isClosed}
                        >
                          <span className="bet-button-text" style={{
                            backgroundColor: opt === '大' || opt === '单' || opt === '龙' ? '#3b82f6' : '#f97316',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>{opt}</span>
                          <span className="bet-button-odds">{ODDS.twoSided}</span>
                          {renderCheckmark(isSelected)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ================= TAB 5: 冠亚和 (Sum Combination) =================
  const renderSumCombination = () => {
    const sumOptions = Array.from({ length: 17 }, (_, i) => i + 3); // 3 to 19

    return (
      <div className="play-area">
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
        {/* Render Specific Sum Numbers 3-19 */}
        <div className="sum-grid">
          {sumOptions.map((sum) => {
            const betId = `sum-number-${sum}`;
            const isSelected = isBetSelected(betId);
            const odds = ODDS.sumNumbers[sum];
            const betObj = {
              id: betId,
              tabId: 'sum-combination',
              positionId: 'sum',
              positionName: '冠亚和',
              betName: sum.toString(),
              odds: odds,
              displayTitle: `冠亚和-${sum}`,
              type: 'sum-number'
            };

            return (
              <button
                key={sum}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="bet-button-text" style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>{sum}</span>
                <span className="bet-button-odds">{odds}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================================
  // ===================== 分分彩 (FFC) Tabs =====================
  // ============================================================

  // --------- FFC: 猜球号 (Guess Ball Number) ----------
  const renderFfcGuessBall = () => {
    return (
      <div className="play-area">
        {FFC_POSITIONS.map((pos) => {
          const isOpen = !!openAccordions[pos.id];
          return (
            <div key={pos.id} className="accordion-section">
              <div
                className={`accordion-header ${isOpen ? 'open' : ''}`}
                onClick={() => toggleAccordion(pos.id)}
              >
                <span>{pos.name}</span>
                <i className={`accordion-arrow ${isOpen ? 'open' : ''}`} />
              </div>
              {isOpen && (
                <div className="accordion-content">
                  <div className="betting-grid">
                    {Array.from({ length: 10 }, (_, i) => i).map((num) => {
                      const betId = `ffc-${pos.id}-number-${num}`;
                      const isSelected = isBetSelected(betId);
                      const betObj = {
                        id: betId,
                        tabId: 'guess-ball',
                        positionId: pos.id,
                        positionName: pos.name,
                        betName: num.toString(),
                        odds: FFC_ODDS.number,
                        displayTitle: `${pos.name}-${num}`,
                        type: 'ffc-number'
                      };
                      return (
                        <button
                          key={num}
                          type="button"
                          className={`bet-button ${isSelected ? 'selected' : ''}`}
                          onClick={() => onToggleBet(betObj)}
                          disabled={isClosed}
                        >
                          {renderFfcBall(num)}
                          <span className="bet-button-odds">{FFC_ODDS.number}</span>
                          {renderCheckmark(isSelected)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // --------- FFC: 两面盘 (Two-sided: 大小单双 for each ball + 总和) ----------
  const renderFfcTwoSided = () => {
    const sections = [
      ...FFC_POSITIONS,
      { id: 'sum', name: '总和', index: -1 },
    ];
    return (
      <div className="play-area">
        {sections.map((pos) => {
          const isOpen = !!openAccordions[pos.id];
          return (
            <div key={pos.id} className="accordion-section">
              <div
                className={`accordion-header ${isOpen ? 'open' : ''}`}
                onClick={() => toggleAccordion(pos.id)}
              >
                <span>{pos.name}</span>
                <i className={`accordion-arrow ${isOpen ? 'open' : ''}`} />
              </div>
              {isOpen && (
                <div className="accordion-content">
                  <div className="betting-grid">
                    {['大', '小', '单', '双'].map((opt) => {
                      const betId = `ffc-${pos.id}-twosided-${opt}`;
                      const isSelected = isBetSelected(betId);
                      const betObj = {
                        id: betId,
                        tabId: 'two-sided',
                        positionId: pos.id,
                        positionName: pos.name,
                        betName: opt,
                        odds: FFC_ODDS.twoSided,
                        displayTitle: `${pos.name}-${opt}`,
                        type: 'ffc-twosided'
                      };
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`bet-button ${isSelected ? 'selected' : ''}`}
                          onClick={() => onToggleBet(betObj)}
                          disabled={isClosed}
                        >
                          <span className="bet-button-text" style={{
                            backgroundColor: opt === '大' || opt === '单' ? '#3b82f6' : '#f97316',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>{opt}</span>
                          <span className="bet-button-odds">{FFC_ODDS.twoSided}</span>
                          {renderCheckmark(isSelected)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // --------- FFC: 前中后 (龙虎和 + 前/中/后三球) ----------
  const renderFfcFrontMidBack = () => {
    // Dragon/Tiger/He betting options
    const dtOptions = [
      { label: '龙', odds: FFC_ODDS.dragon },
      { label: '虎', odds: FFC_ODDS.tiger },
      { label: '和', odds: FFC_ODDS.he },
    ];
    const dtOpen = !!openAccordions['dragon-tiger'];

    return (
      <div className="play-area">
        {/* 龙虎和 */}
        <div className="accordion-section">
          <div
            className={`accordion-header ${dtOpen ? 'open' : ''}`}
            onClick={() => toggleAccordion('dragon-tiger')}
          >
            <span>龙虎和</span>
            <i className={`accordion-arrow ${dtOpen ? 'open' : ''}`} />
          </div>
          {dtOpen && (
            <div className="accordion-content">
              <div className="betting-grid">
                {dtOptions.map(({ label, odds }) => {
                  const betId = `ffc-dt-${label}`;
                  const isSelected = isBetSelected(betId);
                  const betObj = {
                    id: betId,
                    tabId: 'front-mid-back',
                    positionId: 'dragon-tiger',
                    positionName: '龙虎和',
                    betName: label,
                    odds: odds,
                    displayTitle: `龙虎和-${label}`,
                    type: 'ffc-dt'
                  };
                  return (
                    <button
                      key={label}
                      type="button"
                      className={`bet-button ${isSelected ? 'selected' : ''}`}
                      onClick={() => onToggleBet(betObj)}
                      disabled={isClosed}
                    >
                      <span className="bet-button-text" style={{
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>{label}</span>
                      <span className="bet-button-odds">{odds}</span>
                      {renderCheckmark(isSelected)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 前三球 / 中三球 / 后三球 */}
        {FFC_TRIPLE_GROUPS.map((group) => {
          const isOpen = !!openAccordions[group.id];
          return (
            <div key={group.id} className="accordion-section">
              <div
                className={`accordion-header ${isOpen ? 'open' : ''}`}
                onClick={() => toggleAccordion(group.id)}
              >
                <span>{group.name}</span>
                <i className={`accordion-arrow ${isOpen ? 'open' : ''}`} />
              </div>
              {isOpen && (
                <div className="accordion-content">
                  <div className="betting-grid">
                    {FFC_TRIPLE_OPTIONS.map(({ key, odds }) => {
                      const betId = `ffc-${group.id}-${key}`;
                      const isSelected = isBetSelected(betId);
                      const betObj = {
                        id: betId,
                        tabId: 'front-mid-back',
                        positionId: group.id,
                        positionName: group.name,
                        betName: key,
                        odds: odds,
                        displayTitle: `${group.name}-${key}`,
                        type: 'ffc-triple'
                      };
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`bet-button ${isSelected ? 'selected' : ''}`}
                          onClick={() => onToggleBet(betObj)}
                          disabled={isClosed}
                        >
                          <span className="bet-button-text" style={{
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>{key}</span>
                          <span className="bet-button-odds">{odds}</span>
                          {renderCheckmark(isSelected)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // ====================== 快三 (K3) Tabs ======================
  // ============================================================

  // --------- K3: 三军 (a chosen die number 1-6) ----------
  const renderK3ThreeArmy = () => {
    return (
      <div className="play-area">
        <div className="betting-grid">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const betId = `k3-army-${num}`;
            const isSelected = isBetSelected(betId);
            const betObj = {
              id: betId,
              tabId: 'three-army',
              positionId: 'army',
              positionName: '三军',
              betName: num.toString(),
              odds: K3_ODDS.threeArmy,
              displayTitle: `三军-${num}`,
              type: 'k3-army',
            };
            return (
              <button
                key={num}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="k3-dice-group">
                  <Dice value={num} size={30} />
                </span>
                <span className="bet-button-odds">{K3_ODDS.threeArmy}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --------- K3: 短牌 (二同号, e.g. 1-1) ----------
  const renderK3ShortPair = () => {
    return (
      <div className="play-area">
        <div className="betting-grid">
          {K3_SHORT_PAIRS.map((num) => {
            const betId = `k3-short-${num}`;
            const isSelected = isBetSelected(betId);
            const betObj = {
              id: betId,
              tabId: 'short-pair',
              positionId: 'short',
              positionName: '短牌',
              betName: num.toString(),
              odds: K3_ODDS.shortPair,
              displayTitle: `短牌-${num}${num}`,
              type: 'k3-short',
            };
            return (
              <button
                key={num}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="k3-dice-group">
                  <Dice value={num} size={30} />
                  <Dice value={num} size={30} />
                </span>
                <span className="bet-button-odds">{K3_ODDS.shortPair}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --------- K3: 长牌 (二不同号, e.g. 1-2) ----------
  const renderK3LongPair = () => {
    return (
      <div className="play-area">
        <div className="betting-grid">
          {K3_LONG_PAIRS.map(([a, b]) => {
            const betId = `k3-long-${a}${b}`;
            const isSelected = isBetSelected(betId);
            const betObj = {
              id: betId,
              tabId: 'long-pair',
              positionId: 'long',
              positionName: '长牌',
              betName: `${a}${b}`,
              odds: K3_ODDS.longPair,
              displayTitle: `长牌-${a}${b}`,
              type: 'k3-long',
            };
            return (
              <button
                key={betId}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="k3-dice-group">
                  <Dice value={a} size={30} />
                  <Dice value={b} size={30} />
                </span>
                <span className="bet-button-odds">{K3_ODDS.longPair}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --------- K3: 全骰 (specific triples + any triple) ----------
  const renderK3AllTriple = () => {
    return (
      <div className="play-area">
        <div className="betting-grid">
          {K3_TRIPLES.map((num) => {
            const betId = `k3-triple-${num}`;
            const isSelected = isBetSelected(betId);
            const betObj = {
              id: betId,
              tabId: 'all-triple',
              positionId: 'triple',
              positionName: '全骰',
              betName: num.toString(),
              odds: K3_ODDS.specificTriple,
              displayTitle: `全骰-${num}${num}${num}`,
              type: 'k3-triple',
            };
            return (
              <button
                key={betId}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="k3-dice-group k3-dice-group-triple">
                  <Dice value={num} size={20} />
                  <Dice value={num} size={20} />
                  <Dice value={num} size={20} />
                </span>
                <span className="bet-button-odds">{K3_ODDS.specificTriple}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}

          {/* 全骰: any triple */}
          {(() => {
            const betId = 'k3-anytriple';
            const isSelected = isBetSelected(betId);
            const betObj = {
              id: betId,
              tabId: 'all-triple',
              positionId: 'anytriple',
              positionName: '全骰',
              betName: '全骰',
              odds: K3_ODDS.anyTriple,
              displayTitle: '全骰',
              type: 'k3-anytriple',
            };
            return (
              <button
                key={betId}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="bet-button-text" style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>全骰</span>
                <span className="bet-button-odds">{K3_ODDS.anyTriple}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })()}
        </div>
      </div>
    );
  };

  // --------- K3: 和值 (sum 3-18 + 大/小/单/双) ----------
  const renderK3Sum = () => {
    const sums = Array.from({ length: 16 }, (_, i) => i + 3); // 3..18
    const twoSided = ['大', '小', '单', '双'];
    return (
      <div className="play-area">
        <div className="betting-grid">
          {sums.map((sum) => {
            const betId = `k3-sum-number-${sum}`;
            const isSelected = isBetSelected(betId);
            const odds = K3_SUM_ODDS[sum];
            const betObj = {
              id: betId,
              tabId: 'sum',
              positionId: 'sum',
              positionName: '和值',
              betName: sum.toString(),
              odds,
              displayTitle: `和值-${sum}`,
              type: 'k3-sum-number',
            };
            return (
              <button
                key={sum}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="bet-button-text" style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>{sum}</span>
                <span className="bet-button-odds">{odds}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}

          {twoSided.map((opt) => {
            const betId = `k3-sum-twosided-${opt}`;
            const isSelected = isBetSelected(betId);
            const betObj = {
              id: betId,
              tabId: 'sum',
              positionId: 'sum',
              positionName: '和值',
              betName: opt,
              odds: K3_ODDS.sumTwoSided,
              displayTitle: `和值-${opt}`,
              type: 'k3-sum-twosided',
            };
            return (
              <button
                key={opt}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="bet-button-text" style={{
                  backgroundColor: opt === '大' || opt === '单' ? '#3b82f6' : '#f59e0b',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>{opt}</span>
                <span className="bet-button-odds">{K3_ODDS.sumTwoSided}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --------- K3: 二同号 (two identical + one different, e.g. 1-1-2) ----------
  const renderK3TwoSame = () => {
    return (
      <div className="play-area">
        <div className="betting-grid">
          {K3_TWO_SAME.map(([pair, single]) => {
            const betId = `k3-twosame-${pair}${single}`;
            const isSelected = isBetSelected(betId);
            const betObj = {
              id: betId,
              tabId: 'two-same',
              positionId: 'twosame',
              positionName: '二同号',
              betName: `${pair}${single}`,
              odds: K3_ODDS.twoSame,
              displayTitle: `二同号-${pair}${pair}${single}`,
              type: 'k3-two-same',
            };
            return (
              <button
                key={betId}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="k3-dice-group k3-dice-group-triple">
                  <Dice value={pair} size={20} />
                  <Dice value={pair} size={20} />
                  <Dice value={single} size={20} />
                </span>
                <span className="bet-button-odds">{K3_ODDS.twoSame}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --------- K3: 三不同 (three distinct numbers, e.g. 1-2-3) ----------
  const renderK3ThreeDiff = () => {
    return (
      <div className="play-area">
        <div className="betting-grid">
          {K3_THREE_DIFF.map(([a, b, c]) => {
            const betId = `k3-threediff-${a}${b}${c}`;
            const isSelected = isBetSelected(betId);
            const betObj = {
              id: betId,
              tabId: 'three-diff',
              positionId: 'threediff',
              positionName: '三不同',
              betName: `${a}${b}${c}`,
              odds: K3_ODDS.threeDiff,
              displayTitle: `三不同-${a}${b}${c}`,
              type: 'k3-three-diff',
            };
            return (
              <button
                key={betId}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="k3-dice-group k3-dice-group-triple">
                  <Dice value={a} size={20} />
                  <Dice value={b} size={20} />
                  <Dice value={c} size={20} />
                </span>
                <span className="bet-button-odds">{K3_ODDS.threeDiff}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================================
  // ===================== 幸运28 (XY28) Tabs ===================
  // ============================================================

  // 大/大单/大双/单 render blue; 小/小单/小双/双 render orange.
  const twoSidedBg = (label) =>
    (label.includes('大') || label === '单') ? '#3b82f6' : '#f97316';

  // A collapsible section header styled like a dropdown selector.
  const renderXy28Section = (id, label, content) => {
    const isOpen = !!openAccordions[id];
    return (
      <div className="accordion-section">
        <div
          className={`accordion-header ${isOpen ? 'open' : ''}`}
          onClick={() => toggleAccordion(id)}
        >
          <span>{label}</span>
          <i className={`accordion-arrow ${isOpen ? 'open' : ''}`} />
        </div>
        {isOpen && <div className="accordion-content">{content}</div>}
      </div>
    );
  };

  // --------- XY28: 总和 (specific sums 0-27 + 两面) ----------
  const renderXy28Sum = () => {
    // 2-column layout: ascending left (0..13), descending right (27..14).
    const sumOrder = [];
    for (let i = 0; i <= 13; i++) {
      sumOrder.push(i, 27 - i);
    }

    return (
      <div className="play-area">
        {renderXy28Section('xy28-sum', '总和', (
          <div className="betting-grid">
            {sumOrder.map((sum) => {
              const betId = `xy28-sum-number-${sum}`;
              const isSelected = isBetSelected(betId);
              const odds = xy28SumOdds(sum);
              const betObj = {
                id: betId,
                tabId: 'sum',
                positionId: 'sum',
                positionName: '总和',
                betName: sum.toString(),
                odds,
                displayTitle: `总和-${sum}`,
                type: 'xy28-sum-number',
              };
              return (
                <button
                  key={sum}
                  type="button"
                  className={`bet-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggleBet(betObj)}
                  disabled={isClosed}
                >
                  <span className="bet-button-text" style={{
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>{sum}</span>
                  <span className="bet-button-odds">{odds}</span>
                  {renderCheckmark(isSelected)}
                </button>
              );
            })}
          </div>
        ))}

        {renderXy28Section('xy28-sum-two', '两面', (
          <div className="betting-grid">
            {XY28_SUM_TWO_SIDED.map(({ label, odds }) => {
              const betId = `xy28-sum-twosided-${label}`;
              const isSelected = isBetSelected(betId);
              const betObj = {
                id: betId,
                tabId: 'sum',
                positionId: 'sum',
                positionName: '总和',
                betName: label,
                odds,
                displayTitle: `总和-${label}`,
                type: 'xy28-sum-twosided',
              };
              return (
                <button
                  key={label}
                  type="button"
                  className={`bet-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggleBet(betObj)}
                  disabled={isClosed}
                >
                  <span className="bet-button-text" style={{
                    backgroundColor: twoSidedBg(label),
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>{label}</span>
                  <span className="bet-button-odds">{odds}</span>
                  {renderCheckmark(isSelected)}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // --------- XY28: 边球 (边/中/大边/小边 based on 总和 range) ----------
  const renderXy28SideBall = () => {
    return (
      <div className="play-area">
        <div className="betting-grid">
          {XY28_SIDE_OPTIONS.map(({ label, odds }) => {
            const betId = `xy28-side-${label}`;
            const isSelected = isBetSelected(betId);
            const betObj = {
              id: betId,
              tabId: 'side-ball',
              positionId: 'side',
              positionName: '边球',
              betName: label,
              odds,
              displayTitle: `边球-${label}`,
              type: 'xy28-side',
            };
            return (
              <button
                key={label}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="bet-button-text" style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>{label}</span>
                <span className="bet-button-odds">{odds}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --------- XY28: 尾球 (last digit of 总和: 数字 0-9 + 两面) ----------
  const renderXy28TailBall = () => {
    return (
      <div className="play-area">
        {renderXy28Section('xy28-tail-num', '数字', (
          <div className="betting-grid">
            {Array.from({ length: 10 }, (_, i) => i).map((num) => {
              const betId = `xy28-tail-number-${num}`;
              const isSelected = isBetSelected(betId);
              const betObj = {
                id: betId,
                tabId: 'tail-ball',
                positionId: 'tail',
                positionName: '尾球',
                betName: num.toString(),
                odds: 10,
                displayTitle: `尾球-${num}`,
                type: 'xy28-tail-number',
              };
              return (
                <button
                  key={num}
                  type="button"
                  className={`bet-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggleBet(betObj)}
                  disabled={isClosed}
                >
                  <span className="bet-button-text" style={{
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>{num}</span>
                  <span className="bet-button-odds">10</span>
                  {renderCheckmark(isSelected)}
                </button>
              );
            })}
          </div>
        ))}

        {renderXy28Section('xy28-tail-two', '两面', (
          <div className="betting-grid">
            {XY28_TAIL_TWO_SIDED.map(({ label, odds }) => {
              const betId = `xy28-tail-twosided-${label}`;
              const isSelected = isBetSelected(betId);
              const betObj = {
                id: betId,
                tabId: 'tail-ball',
                positionId: 'tail',
                positionName: '尾球',
                betName: label,
                odds,
                displayTitle: `尾球-${label}`,
                type: 'xy28-tail-twosided',
              };
              return (
                <button
                  key={label}
                  type="button"
                  className={`bet-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggleBet(betObj)}
                  disabled={isClosed}
                >
                  <span className="bet-button-text" style={{
                    backgroundColor: twoSidedBg(label),
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>{label}</span>
                  <span className="bet-button-odds">{odds}</span>
                  {renderCheckmark(isSelected)}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // A group card: a colored label + odds header above a grid of 总和 number badges.
  // The whole card is one selectable bet (龙虎豹 / 极值).
  const renderXy28GroupCard = (betId, betObj, label, odds, nums) => {
    const isSelected = isBetSelected(betId);
    return (
      <button
        key={betId}
        type="button"
        className={`xy28-group-card ${isSelected ? 'selected' : ''}`}
        onClick={() => onToggleBet(betObj)}
        disabled={isClosed}
      >
        <div className="xy28-group-head">
          <span className="xy28-group-label">{label}</span>
          <span className="xy28-group-odds">{odds}</span>
        </div>
        <div className="xy28-group-nums">
          {nums.map((n) => (
            <span key={n} className="xy28-group-num">{n}</span>
          ))}
        </div>
        {renderCheckmark(isSelected)}
      </button>
    );
  };

  // --------- XY28: 龙虎豹 (总和 mod 3) ----------
  const renderXy28DragonTigerLeopard = () => {
    return (
      <div className="play-area">
        {XY28_DTL_OPTIONS.map(({ label, odds, mod }) => {
          const nums = Array.from({ length: 28 }, (_, i) => i).filter((n) => n % 3 === mod);
          const betId = `xy28-dtl-${label}`;
          const betObj = {
            id: betId,
            tabId: 'dragon-tiger-leopard',
            positionId: 'dtl',
            positionName: '龙虎豹',
            betName: label,
            odds,
            displayTitle: `龙虎豹-${label}`,
            type: 'xy28-dtl',
          };
          return renderXy28GroupCard(betId, betObj, label, odds, nums);
        })}
      </div>
    );
  };

  // --------- XY28: 极值 (极大 总和22-27 / 极小 总和0-5) ----------
  const renderXy28Extreme = () => {
    return (
      <div className="play-area">
        {XY28_EXTREME_OPTIONS.map(({ label, odds, nums }) => {
          const betId = `xy28-extreme-${label}`;
          const betObj = {
            id: betId,
            tabId: 'extreme',
            positionId: 'extreme',
            positionName: '极值',
            betName: label,
            odds,
            displayTitle: `极值-${label}`,
            type: 'xy28-extreme',
          };
          return renderXy28GroupCard(betId, betObj, label, odds, nums);
        })}
      </div>
    );
  };

  // --------- XY28: 三球 (顺子 / 豹子 / 对子) ----------
  const renderXy28ThreeBall = () => {
    return (
      <div className="play-area">
        <div className="betting-grid">
          {XY28_THREE_BALL_OPTIONS.map(({ label, odds }) => {
            const betId = `xy28-threeball-${label}`;
            const isSelected = isBetSelected(betId);
            const betObj = {
              id: betId,
              tabId: 'three-ball',
              positionId: 'threeball',
              positionName: '三球',
              betName: label,
              odds,
              displayTitle: `三球-${label}`,
              type: 'xy28-threeball',
            };
            return (
              <button
                key={betId}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="bet-button-text" style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>{label}</span>
                <span className="bet-button-odds">{odds}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================================
  // ================== 澳门六合彩 (LHC) Tabs ===================
  // ============================================================

  // A single-number bet object, market-aware ('tema' 盘口 A/B · 'zhengma' 正码 · 'zhengte' 正特位置).
  const lhcNumberBet = (market, num) => {
    if (market === 'zhengma') {
      return {
        id: `lhc-zhengma-number-${num}`,
        tabId: 'zhengma',
        positionId: 'zhengma',
        positionName: '正码',
        betName: num.toString(),
        odds: adj(LHC_ZHENGMA_ODDS.number),
        displayTitle: `正码-${num.toString().padStart(2, '0')}`,
        type: 'lhc-zhengma-number',
      };
    }
    if (market === 'zhengte') {
      const label = LHC_ZHENGTE_POS[zhengtePos]; // 特一..特六
      return {
        id: `lhc-zhengte-${zhengtePos}-number-${num}`,
        tabId: 'zhengte',
        positionId: String(zhengtePos),
        positionName: `正${label}`, // 正特一..正特六
        betName: num.toString(),
        odds: adj(LHC_ZHENGTE_ODDS.number),
        displayTitle: `正${label}-${num.toString().padStart(2, '0')}`,
        type: 'lhc-zhengte-number',
      };
    }
    return {
      id: `lhc-tema-${temaPanel}-number-${num}`,
      tabId: 'tema',
      positionId: 'tema',
      positionName: `特码${temaPanel}`,
      betName: num.toString(),
      odds: adj(LHC_TEMA_ODDS[temaPanel].number),
      displayTitle: `特码${temaPanel}-${num.toString().padStart(2, '0')}`,
      type: 'lhc-tema-number',
    };
  };

  // Select every number in a 快捷投注 category. If all are already selected, clear them.
  const handleQuickCategory = (market, cat) => {
    if (isClosed) return;
    const nums = lhcNumbersForCategory(cat);
    const allSelected = nums.every((n) => isBetSelected(lhcNumberBet(market, n).id));
    nums.forEach((n) => {
      const bet = lhcNumberBet(market, n);
      const selected = isBetSelected(bet.id);
      if (allSelected ? selected : !selected) onToggleBet(bet);
    });
  };

  // Apply the 快捷投注 textarea: parse "号码=金额" tokens (e.g. "1=10 2=20"), select
  // each referenced 号码. The per-号码 amount is set later in the confirm step.
  const applyQuickText = (market) => {
    if (isClosed) return;
    const tokens = quickText.split(/[\s,，;；]+/).filter(Boolean);
    tokens.forEach((tok) => {
      const num = parseInt(tok.split('=')[0], 10);
      if (num >= 1 && num <= 49) {
        const bet = lhcNumberBet(market, num);
        if (!isBetSelected(bet.id)) onToggleBet(bet);
      }
    });
  };

  // The number-points grid (01-49) — colored 波色 ring + odds, selectable.
  const renderLhcNumberGrid = (market) => (
    <div className="lhc-num-grid">
      {Array.from({ length: 49 }, (_, i) => i + 1).map((num) => {
        const betObj = lhcNumberBet(market, num);
        const isSelected = isBetSelected(betObj.id);
        const hex = LHC_WAVE_HEX[lhcColorOf(num)];
        return (
          <button
            key={num}
            type="button"
            className={`bet-button lhc-num-btn ${isSelected ? 'selected' : ''}`}
            onClick={() => onToggleBet(betObj)}
            disabled={isClosed}
          >
            <span className="lhc-ball" style={{ borderColor: hex, color: hex }}>
              {num.toString().padStart(2, '0')}
            </span>
            <span className="bet-button-odds">{betObj.odds}</span>
            {renderCheckmark(isSelected)}
          </button>
        );
      })}
    </div>
  );

  // The 快捷投注 抽屉 content (分类快选 + 快捷输入), market-aware.
  const renderLhcQuickContent = (market) => {
    const waveColor = { 红: '#e3342f', 绿: '#16a34a', 蓝: '#2563eb' };
    return (
      <>
        <div className="lhc-quick-cats">
          {LHC_QUICK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className="lhc-quick-cat"
              style={waveColor[cat] ? { color: waveColor[cat], fontWeight: 700 } : undefined}
              onClick={() => handleQuickCategory(market, cat)}
              disabled={isClosed}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="lhc-quick-input-row">
          <textarea
            className="lhc-quick-textarea"
            placeholder="快捷投注：按号码=金额的格式，多个用空格分隔。如1=10 2=20"
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            rows={3}
          />
          <button
            type="button"
            className="lhc-quick-apply"
            onClick={() => applyQuickText(market)}
            disabled={isClosed}
          >
            选号
          </button>
        </div>
      </>
    );
  };

  // The 正码 两面 grid (总和大小/单双 / 总尾大小 / 龙虎).
  const renderLhcZhengmaTwoSidedGrid = () => {
    const orangeLabels = ['总和小', '总和双', '总尾小', '虎'];
    const twoSidedOdds = adj(LHC_ZHENGMA_ODDS.twoSided);
    return (
      <div className="betting-grid">
        {LHC_ZHENGMA_TWO_SIDED.map((label) => {
          const betId = `lhc-zhengma-twosided-${label}`;
          const isSelected = isBetSelected(betId);
          const betObj = {
            id: betId,
            tabId: 'zhengma',
            positionId: 'zhengma',
            positionName: '正码',
            betName: label,
            odds: twoSidedOdds,
            displayTitle: `正码-${label}`,
            type: 'lhc-zhengma-twosided',
          };
          const bg = orangeLabels.includes(label) ? '#f97316' : '#3b82f6';
          return (
            <button
              key={label}
              type="button"
              className={`bet-button ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleBet(betObj)}
              disabled={isClosed}
            >
              <span className="bet-button-text" style={{ backgroundColor: bg, color: '#fff' }}>{label}</span>
              <span className="bet-button-odds">{twoSidedOdds}</span>
              {renderCheckmark(isSelected)}
            </button>
          );
        })}
      </div>
    );
  };

  // The 特码 两面 grid (大小单双 / 合 / 尾 / 家禽野兽 / 波色 / 范围).
  const renderLhcTwoSidedGrid = () => {
    const base = LHC_TEMA_ODDS[temaPanel];
    const o = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, adj(v)]));
    const waveBg = { 红波: '#e3342f', 绿波: '#16a34a', 蓝波: '#2563eb' };
    // Explicit blue/orange split matching the reference 两面 grid (left=blue, right=orange;
    // 家禽 blue / 野兽 orange; 数字范围 blue).
    const orangeLabels = ['小', '双', '合双', '小单', '小双', '尾小', '野兽'];
    return (
      <div className="betting-grid">
        {LHC_TEMA_TWO_SIDED.map(({ label, oddsKey, disabled }) => {
          if (disabled) {
            return (
              <button key={label} type="button" className="bet-button" disabled>
                <span className="bet-button-text" style={{ backgroundColor: '#cbd5e1', color: '#fff' }}>{label}</span>
                <span className="bet-button-odds">--</span>
              </button>
            );
          }
          const betId = `lhc-tema-${temaPanel}-twosided-${label}`;
          const isSelected = isBetSelected(betId);
          const betObj = {
            id: betId,
            tabId: 'tema',
            positionId: 'tema',
            positionName: `特码${temaPanel}`,
            betName: label,
            odds: o[oddsKey],
            displayTitle: `特码${temaPanel}-${label}`,
            type: 'lhc-tema-twosided',
          };
          const bg = waveBg[label] || (orangeLabels.includes(label) ? '#f97316' : '#3b82f6');
          return (
            <button
              key={label}
              type="button"
              className={`bet-button ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleBet(betObj)}
              disabled={isClosed}
            >
              <span className="bet-button-text" style={{ backgroundColor: bg, color: '#fff' }}>{label}</span>
              <span className="bet-button-odds">{o[oddsKey]}</span>
              {renderCheckmark(isSelected)}
            </button>
          );
        })}
      </div>
    );
  };

  // The 正特 两面 grid (作用于所选位置 特一..特六): 大小/单双/合大合小/合单合双/尾大尾小/波色.
  const renderLhcZhengteTwoSidedGrid = () => {
    const label = LHC_ZHENGTE_POS[zhengtePos];
    const waveBg = { 红波: '#e3342f', 绿波: '#16a34a', 蓝波: '#2563eb' };
    const orangeLabels = ['小', '双', '合小', '合双', '尾小'];
    return (
      <div className="betting-grid">
        {LHC_ZHENGTE_TWO_SIDED.map(({ label: opt, oddsKey }) => {
          const betId = `lhc-zhengte-${zhengtePos}-twosided-${opt}`;
          const isSelected = isBetSelected(betId);
          const optOdds = adj(LHC_ZHENGTE_ODDS[oddsKey]);
          const betObj = {
            id: betId,
            tabId: 'zhengte',
            positionId: String(zhengtePos),
            positionName: `正${label}`,
            betName: opt,
            odds: optOdds,
            displayTitle: `正${label}-${opt}`,
            type: 'lhc-zhengte-twosided',
          };
          const bg = waveBg[opt] || (orangeLabels.includes(opt) ? '#f97316' : '#3b82f6');
          return (
            <button
              key={opt}
              type="button"
              className={`bet-button ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleBet(betObj)}
              disabled={isClosed}
            >
              <span className="bet-button-text" style={{ backgroundColor: bg, color: '#fff' }}>{opt}</span>
              <span className="bet-button-odds">{optOdds}</span>
              {renderCheckmark(isSelected)}
            </button>
          );
        })}
      </div>
    );
  };

  // Collapsible accordion section (FFC-style 抽屉) used by the 特码 tab.
  const renderLhcSection = (id, label, content) => {
    const isOpen = !!openAccordions[id];
    return (
      <div className="accordion-section">
        <div
          className={`accordion-header ${isOpen ? 'open' : ''}`}
          onClick={() => toggleAccordion(id)}
        >
          <span>{label}</span>
          <i className={`accordion-arrow ${isOpen ? 'open' : ''}`} />
        </div>
        {isOpen && <div className="accordion-content">{content}</div>}
      </div>
    );
  };

  // --------- LHC: 特码 tab (特码A/特码B + 快捷投注 / 数字 / 两面 抽屉) ----------
  const renderLhcTema = () => {
    return (
      <div className="play-area">
        {/* 特码A / 特码B 盘口切换 */}
        <div className="lhc-panel-tabs">
          {['A', 'B'].map((p) => (
            <button
              key={p}
              type="button"
              className={`lhc-panel-tab ${temaPanel === p ? 'active' : ''}`}
              onClick={() => setTemaPanel(p)}
            >
              特码{p}
            </button>
          ))}
        </div>

        {/* 快捷投注 抽屉: 分类快选 + 快捷输入 */}
        {renderLhcSection('lhc-quick', '快捷投注', renderLhcQuickContent('tema'))}

        {/* 数字 抽屉: 特码 01-49 点位 */}
        {renderLhcSection('lhc-num', '数字', renderLhcNumberGrid('tema'))}

        {/* 两面 抽屉 */}
        {renderLhcSection('lhc-two', '两面', renderLhcTwoSidedGrid())}
      </div>
    );
  };

  // --------- LHC: 正码 tab (快捷投注 / 数字 / 两面 抽屉) ----------
  const renderLhcZhengma = () => {
    return (
      <div className="play-area">
        {/* 快捷投注 抽屉 */}
        {renderLhcSection('lhc-zm-quick', '快捷投注', renderLhcQuickContent('zhengma'))}

        {/* 数字 抽屉: 正码 01-49 点位 (赔率 7.46) */}
        {renderLhcSection('lhc-zm-num', '数字', renderLhcNumberGrid('zhengma'))}

        {/* 两面 抽屉: 总和大小/单双 · 总尾大小 · 龙虎 */}
        {renderLhcSection('lhc-zm-two', '两面', renderLhcZhengmaTwoSidedGrid())}
      </div>
    );
  };

  // --------- LHC: 正特 tab (特一~特六 位置 + 快捷投注 / 数字 / 两面 抽屉) ----------
  const renderLhcZhengte = () => {
    return (
      <div className="play-area">
        {/* 特一 ~ 特六 开奖位置选择 */}
        <div className="lhc-pos-tabs">
          {LHC_ZHENGTE_POS.map((label, idx) => (
            <button
              key={label}
              type="button"
              className={`lhc-pos-tab ${zhengtePos === idx ? 'active' : ''}`}
              onClick={() => setZhengtePos(idx)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 快捷投注 抽屉 */}
        {renderLhcSection('lhc-zt-quick', '快捷投注', renderLhcQuickContent('zhengte'))}

        {/* 数字 抽屉: 所选位置 01-49 点位 (赔率 47.3) */}
        {renderLhcSection('lhc-zt-num', '数字', renderLhcNumberGrid('zhengte'))}

        {/* 两面 抽屉 */}
        {renderLhcSection('lhc-zt-two', '两面', renderLhcZhengteTwoSidedGrid())}
      </div>
    );
  };

  // --------- LHC: 七色波 (7 色波最多的颜色 / 和局) ----------
  const renderLhcQisebo = () => {
    const bgOf = { 红: '#e3342f', 绿: '#16a34a', 蓝: '#2563eb', 和: '#9ca3af' };
    return (
      <div className="play-area">
        <div className="betting-grid">
          {LHC_QISEBO.map(({ label, betName, odds: rawOdds }) => {
            const betId = `lhc-qisebo-${betName}`;
            const isSelected = isBetSelected(betId);
            const odds = adj(rawOdds);
            const betObj = {
              id: betId,
              tabId: 'qisebo',
              positionId: 'qisebo',
              positionName: '七色波',
              betName,
              odds,
              displayTitle: `七色波-${label}`,
              type: 'lhc-qisebo',
            };
            return (
              <button
                key={betId}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBet(betObj)}
                disabled={isClosed}
              >
                <span className="bet-button-text" style={{ backgroundColor: bgOf[betName], color: '#fff' }}>{label}</span>
                <span className="bet-button-odds">{odds}</span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --------- LHC: 合肖 (选类别 N, 再选 ≥N 个生肖, 自动组合成 C(M,N) 注) ----------
  // 特码 落在某组合内即中; 特码 49 为和局。每个组合是一注。
  const buildHexiaoBet = (combo, cat) => {
    const zodiacs = [...combo].sort((a, b) => LHC_ZODIACS.indexOf(a) - LHC_ZODIACS.indexOf(b));
    return {
      id: `lhc-hexiao-${cat}-${zodiacs.join('')}`,
      tabId: 'hexiao',
      positionId: 'hexiao',
      positionName: `合肖${cat}肖`,
      betName: zodiacs.join(','),
      zodiacs,
      odds: adj(lhcHexiaoOdds(cat)),
      displayTitle: `合肖-${cat}肖-${zodiacs.join('  ')}`,
      type: 'lhc-hexiao',
    };
  };

  // Replace all 合肖 combo bets in the parent selection with C(zodiacs, cat).
  const syncHexiao = (zodiacs, cat) => {
    selectedBets.forEach((b) => { if (b.type === 'lhc-hexiao') onToggleBet(b); }); // remove existing
    if (zodiacs.length >= cat) {
      combinations(zodiacs, cat).forEach((combo) => onToggleBet(buildHexiaoBet(combo, cat)));
    }
  };

  const toggleHexiaoZodiac = (zodiac) => {
    if (isClosed) return;
    const next = hexiaoZodiacs.includes(zodiac)
      ? hexiaoZodiacs.filter((z) => z !== zodiac)
      : [...hexiaoZodiacs, zodiac];
    setHexiaoZodiacs(next);
    syncHexiao(next, hexiaoCat);
  };

  const changeHexiaoCat = (cat) => {
    setHexiaoCat(cat);
    syncHexiao(hexiaoZodiacs, cat); // recompute combos for the new category
  };

  const renderLhcHexiao = () => {
    const odds = adj(lhcHexiaoOdds(hexiaoCat));
    const M = hexiaoZodiacs.length;
    const noteCount = M >= hexiaoCat ? combinations(hexiaoZodiacs, hexiaoCat).length : 0;
    return (
      <div className="play-area">
        {/* 类别选择: 二肖 ~ 十一肖 */}
        <div className="lhc-hexiao-cats">
          {LHC_HEXIAO_CATEGORIES.map((n) => (
            <button
              key={n}
              type="button"
              className={`lhc-pos-tab ${hexiaoCat === n ? 'active' : ''}`}
              onClick={() => changeHexiaoCat(n)}
            >
              {LHC_HEXIAO_CN[n]}肖
            </button>
          ))}
        </div>
        <div className="lhc-hexiao-hint">
          已选 {M} 生肖（{hexiaoCat}肖组合，共 {noteCount} 注）
        </div>

        {/* 生肖卡片 (多选) */}
        {LHC_ZODIACS.map((zodiac) => {
          const nums = LHC_TEXIAO_NUMBERS[zodiac];
          const isSelected = hexiaoZodiacs.includes(zodiac);
          return (
            <button
              key={zodiac}
              type="button"
              className={`lhc-xiao-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleHexiaoZodiac(zodiac)}
              disabled={isClosed}
            >
              <div className="lhc-xiao-head">
                <span className="lhc-xiao-label">{zodiac}</span>
                <span className="lhc-xiao-odds">{odds}</span>
              </div>
              <div className="lhc-xiao-balls">
                {nums.map((n) => {
                  const hex = LHC_WAVE_HEX[lhcColorOf(n)];
                  return (
                    <span key={n} className="lhc-ball" style={{ borderColor: hex, color: hex }}>
                      {n.toString().padStart(2, '0')}
                    </span>
                  );
                })}
              </div>
              {renderCheckmark(isSelected)}
            </button>
          );
        })}
      </div>
    );
  };

  // --------- LHC: 生肖/尾数/头数 卡片玩法 (label + odds 头 + 波色号码) ----------
  // Each item = { label, betName, odds, nums }. Win logic lives in settlement.
  const renderLhcCardList = ({ tabId, betType, positionName, items }) => {
    return (
      <div className="play-area">
        {items.map(({ label, betName, odds: rawOdds, nums }) => {
          const betId = `${betType}-${betName}`;
          const isSelected = isBetSelected(betId);
          const odds = adj(rawOdds);
          const betObj = {
            id: betId,
            tabId,
            positionId: tabId,
            positionName,
            betName: String(betName),
            odds,
            displayTitle: `${positionName}-${label}`,
            type: betType,
          };
          return (
            <button
              key={betId}
              type="button"
              className={`lhc-xiao-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleBet(betObj)}
              disabled={isClosed}
            >
              <div className="lhc-xiao-head">
                <span className="lhc-xiao-label">{label}</span>
                <span className="lhc-xiao-odds">{odds}</span>
              </div>
              <div className="lhc-xiao-balls">
                {nums.map((n) => {
                  const hex = LHC_WAVE_HEX[lhcColorOf(n)];
                  return (
                    <span key={n} className="lhc-ball" style={{ borderColor: hex, color: hex }}>
                      {n.toString().padStart(2, '0')}
                    </span>
                  );
                })}
              </div>
              {renderCheckmark(isSelected)}
            </button>
          );
        })}
      </div>
    );
  };

  // 生肖玩法 helper: build items from the 12 生肖.
  const lhcXiaoItems = (oddsFn) =>
    LHC_ZODIACS.map((z) => ({ label: z, betName: z, odds: oddsFn(z), nums: LHC_TEXIAO_NUMBERS[z] }));

  // --------- LHC: 总肖 tab (当期不同生肖总数 2-7 / 单 / 双) ----------
  const renderLhcZongxiao = () => (
    <div className="play-area">
      <div className="betting-grid">
        {LHC_ZONGXIAO.map(({ label, betName, odds: rawOdds }) => {
          const betId = `lhc-zongxiao-${betName}`;
          const isSelected = isBetSelected(betId);
          const odds = adj(rawOdds);
          const betObj = {
            id: betId,
            tabId: 'zongxiao',
            positionId: 'zongxiao',
            positionName: '总肖',
            betName,
            odds,
            displayTitle: `总肖-${label}`,
            type: 'lhc-zongxiao',
          };
          const bg = betName === '双' ? '#f97316' : '#3b82f6';
          return (
            <button
              key={betId}
              type="button"
              className={`bet-button ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleBet(betObj)}
              disabled={isClosed}
            >
              <span className="bet-button-text" style={{ backgroundColor: bg, color: '#fff' }}>{label}</span>
              <span className="bet-button-odds">{odds}</span>
              {renderCheckmark(isSelected)}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Placeholder for LHC play types not yet implemented.
  const renderLhcPlaceholder = (name) => (
    <div className="play-area">
      <div className="lhc-placeholder">「{name}」玩法敬请期待</div>
    </div>
  );

  // Render active content area
  if (gameKind === 'lhc') {
    switch (activeTab) {
      case 'long-dragon':
        return renderLongDragon();
      case 'tema':
        return renderLhcTema();
      case 'zhengma':
        return renderLhcZhengma();
      case 'zhengte':
        return renderLhcZhengte();
      case 'texiao':
        return renderLhcCardList({ tabId: 'texiao', betType: 'lhc-texiao', positionName: '特肖', items: lhcXiaoItems(lhcTexiaoOdds) });
      case 'zhengxiao':
        return renderLhcCardList({ tabId: 'zhengxiao', betType: 'lhc-zhengxiao', positionName: '正肖', items: lhcXiaoItems((z) => lhcXiaoOdds('zhengxiao', z)) });
      case 'yixiao':
        return renderLhcCardList({ tabId: 'yixiao', betType: 'lhc-yixiao', positionName: '一肖', items: lhcXiaoItems((z) => lhcXiaoOdds('yixiao', z)) });
      case 'yixiao-no':
        return renderLhcCardList({ tabId: 'yixiao-no', betType: 'lhc-yixiao-no', positionName: '一肖不中', items: lhcXiaoItems((z) => lhcXiaoOdds('yixiao-no', z)) });
      case 'weishu':
        return renderLhcCardList({ tabId: 'weishu', betType: 'lhc-weishu', positionName: '尾数', items: LHC_TAIL_GROUPS.map((g) => ({ label: `${g.tail}尾`, betName: g.tail, odds: lhcWeishuOdds(g.tail), nums: g.nums })) });
      case 'weishu-no':
        return renderLhcCardList({ tabId: 'weishu-no', betType: 'lhc-weishu-no', positionName: '尾数不中', items: LHC_TAIL_GROUPS.map((g) => ({ label: `${g.tail}尾`, betName: g.tail, odds: lhcWeishuNoOdds(g.tail), nums: g.nums })) });
      case 'tetoushu':
        return renderLhcCardList({ tabId: 'tetoushu', betType: 'lhc-tetoushu', positionName: '特头数', items: LHC_HEAD_GROUPS.map((g) => ({ label: `${g.head}头`, betName: g.head, odds: lhcTetoushuOdds(g.head), nums: g.nums })) });
      case 'teweishu':
        return renderLhcCardList({ tabId: 'teweishu', betType: 'lhc-teweishu', positionName: '特尾数', items: LHC_TAIL_GROUPS.map((g) => ({ label: `${g.tail}尾`, betName: g.tail, odds: lhcTeweishuOdds(g.tail), nums: g.nums })) });
      case 'banbo':
        return renderLhcCardList({ tabId: 'banbo', betType: 'lhc-banbo', positionName: '半波', items: LHC_BANBO_ITEMS });
      case 'wuxing':
        return renderLhcCardList({ tabId: 'wuxing', betType: 'lhc-wuxing', positionName: '五行', items: LHC_WUXING.map((w) => ({ label: w.element, betName: w.element, odds: w.odds, nums: w.nums })) });
      case 'zongxiao':
        return renderLhcZongxiao();
      case 'qisebo':
        return renderLhcQisebo();
      case 'hexiao':
        return renderLhcHexiao();
      default: {
        const tab = [].find((t) => t.id === activeTab);
        return renderLhcPlaceholder(tab ? tab.name : '该');
      }
    }
  }

  if (gameKind === 'xy28') {
    switch (activeTab) {
      case 'long-dragon':
        return renderLongDragon();
      case 'sum':
        return renderXy28Sum();
      case 'side-ball':
        return renderXy28SideBall();
      case 'tail-ball':
        return renderXy28TailBall();
      case 'dragon-tiger-leopard':
        return renderXy28DragonTigerLeopard();
      case 'extreme':
        return renderXy28Extreme();
      case 'three-ball':
        return renderXy28ThreeBall();
      default:
        return <div className="play-area">Tab Content Not Found</div>;
    }
  }

  if (gameKind === 'k3') {
    switch (activeTab) {
      case 'long-dragon':
        return renderLongDragon();
      case 'three-army':
        return renderK3ThreeArmy();
      case 'short-pair':
        return renderK3ShortPair();
      case 'long-pair':
        return renderK3LongPair();
      case 'all-triple':
        return renderK3AllTriple();
      case 'sum':
        return renderK3Sum();
      case 'two-same':
        return renderK3TwoSame();
      case 'three-diff':
        return renderK3ThreeDiff();
      default:
        return <div className="play-area">Tab Content Not Found</div>;
    }
  }

  if (gameKind === 'ffc') {
    switch (activeTab) {
      case 'long-dragon':
        return renderLongDragon();
      case 'guess-ball':
        return renderFfcGuessBall();
      case 'two-sided':
        return renderFfcTwoSided();
      case 'front-mid-back':
        return renderFfcFrontMidBack();
      default:
        return <div className="play-area">Tab Content Not Found</div>;
    }
  }

  switch (activeTab) {
    case 'long-dragon':
      return renderLongDragon();
    case 'shortcut':
      return renderShortcut();
    case 'guess-number':
      return renderGuessNumber();
    case 'two-sided':
      return renderTwoSided();
    case 'sum-combination':
      return renderSumCombination();
    default:
      return <div className="play-area">Tab Content Not Found</div>;
  }
}
