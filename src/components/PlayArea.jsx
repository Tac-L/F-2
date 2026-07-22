import { useState, useEffect, useRef } from 'react';
import {
  pk10BallSrc, POSITIONS, SHORTCUT_POSITIONS, ODDS,
  ffcBallSrc, FFC_POSITIONS, FFC_ODDS, FFC_TRIPLE_GROUPS, FFC_TRIPLE_OPTIONS,
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
  lhcNumbersForCategory, lhcBallSrc, lhcPankouFactor,
  ANIMAL_POSITIONS, ANIMAL_ODDS, animalBallSrc,
  FHC_SYMBOLS, FHC_ODDS, fhcSymbolSrc,
  BAC_ODDS,
} from '../constants/gameData';
import Dice from './Dice';

const LIANMA_SUB_TABS = [
  { id: 'si-quan-zhong', name: '四全中' },
  { id: 'san-quan-zhong', name: '三全中' },
  { id: 'san-zhong-er', name: '三中二' },
  { id: 'er-quan-zhong', name: '二全中' },
  { id: 'er-zhong-te', name: '二中特' },
  { id: 'te-chuan', name: '特串' },
];

const LIANMA_REQUIRED_COUNTS = {
  'si-quan-zhong': 4,
  'san-quan-zhong': 3,
  'san-zhong-er': 3,
  'er-quan-zhong': 2,
  'er-zhong-te': 2,
  'te-chuan': 2,
};

const LIANMA_ODDS = {
  'si-quan-zhong': 9000,
  'san-quan-zhong': 600,
  'san-zhong-er': 100,
  'er-quan-zhong': 65,
  'er-zhong-te': 50,
  'te-chuan': 150,
};

// 不中 (not-hit) — combination play like 连码: pick N numbers as one combo; win
// only when NONE of the drawn numbers appear in the chosen set. N ranges 4..12.
const BUZHONG_SUB_TABS = [
  { id: 'si-bu-zhong', name: '四不中', count: 4 },
  { id: 'wu-bu-zhong', name: '五不中', count: 5 },
  { id: 'liu-bu-zhong', name: '六不中', count: 6 },
  { id: 'qi-bu-zhong', name: '七不中', count: 7 },
  { id: 'ba-bu-zhong', name: '八不中', count: 8 },
  { id: 'jiu-bu-zhong', name: '九不中', count: 9 },
  { id: 'shi-bu-zhong', name: '十不中', count: 10 },
  { id: 'shiyi-bu-zhong', name: '十一不中', count: 11 },
  { id: 'shier-bu-zhong', name: '十二不中', count: 12 },
];

const BUZHONG_REQUIRED_COUNTS = Object.fromEntries(
  BUZHONG_SUB_TABS.map((t) => [t.id, t.count])
);

const BUZHONG_ODDS = {
  'si-bu-zhong': 1.19,
  'wu-bu-zhong': 1.41,
  'liu-bu-zhong': 1.68,
  'qi-bu-zhong': 2.0,
  'ba-bu-zhong': 2.4,
  'jiu-bu-zhong': 2.9,
  'shi-bu-zhong': 3.51,
  'shiyi-bu-zhong': 4.28,
  'shier-bu-zhong': 5.25,
};

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
  pankou = 'A',
  onSetQuickBets,
  clearNonce,
  addToast,
}) {
  // 六合彩 盘口 (A~D) scales every LHC odds. adj() rounds to 2 decimals.
  const pankouFactor = gameKind === 'lhc' ? lhcPankouFactor(pankou) : 1;
  const adj = (o) => Math.round(o * pankouFactor * 100) / 100;

  // 玩法说明 (play rules) modal — currently for PK10 (赛车). Keyed by activeTab;
  // 两面盘 has two sub-sections (大小单双 / 龙虎).
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSub, setHelpSub] = useState('ds'); // 'ds' (大小单双) | 'lh' (龙虎)
  const [lhcHelpTab, setLhcHelpTab] = useState('quick'); // 'quick' | 'number' | 'twoside' | 'color'
  const [ffcHelpTab, setFfcHelpTab] = useState('front'); // FFC 前中后: 'front' | 'mid' | 'back' | 'lh'
  const [k3SumHelpTab, setK3SumHelpTab] = useState('points'); // K3 和值: 'points' (点数) | 'twoside' (双面)
  const [xy28SumHelpTab, setXy28SumHelpTab] = useState('sum'); // XY28 总和: 'sum' (总和) | 'twoside' (两面) | 'combo' (两面组合)
  const [xy28TailHelpTab, setXy28TailHelpTab] = useState('num'); // XY28 尾球: 'num' (数字) | 'twoside' (两面) | 'combo' (两面组合)
  const [animalHelpTab, setAnimalHelpTab] = useState('guess'); // 动物: 'guess' (猜号码) | 'twoside' (两面盘) | 'dragon' (龙虎)
  const [selectedLhcCats, setSelectedLhcCats] = useState({});

  // Reset category selection when bets are cleared or page switches
  useEffect(() => {
    if (selectedBets.length === 0) {
      setSelectedLhcCats({});
    }
  }, [selectedBets]);

  // Close the modal whenever the user switches play tabs.
  useEffect(() => { setHelpOpen(false); }, [activeTab]);

  // Reset LHC help tab when modal opens
  useEffect(() => {
    if (helpOpen) {
      if (activeTab === 'banbo') {
        setLhcHelpTab('red');
      } else if (activeTab === 'lianma') {
        setLhcHelpTab('2');
      } else if (activeTab === 'buzhong') {
        setLhcHelpTab('4-8');
      } else {
        setLhcHelpTab('quick');
      }
      // FFC 前中后 defaults to the 前三 sub-tab.
      if (activeTab === 'front-mid-back') {
        setFfcHelpTab('front');
      }
      // K3 和值 defaults to the 点数 sub-tab.
      if (activeTab === 'sum') {
        setK3SumHelpTab('points');
      }
      // XY28 总和 defaults to the 总和 sub-tab.
      if (gameKind === 'xy28' && activeTab === 'sum') {
        setXy28SumHelpTab('sum');
      }
      // XY28 尾球 defaults to the 数字 sub-tab.
      if (gameKind === 'xy28' && activeTab === 'tail-ball') {
        setXy28TailHelpTab('num');
      }
    }
  }, [helpOpen, activeTab]);

  // A small "玩法说明 ?" button shown above the play content.
  // onQuickSelect (combination games only) adds a 快选 button that auto-picks the
  // number of 号码 needed for exactly one 注.
  const renderPlayHelpBar = (onQuickSelect) => (
    <div className="play-help-bar">
      <button type="button" className="play-help-btn" onClick={() => setHelpOpen(true)}>
        玩法说明
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
      {onQuickSelect && (
        <button
          type="button"
          className="play-quick-btn"
          onClick={onQuickSelect}
          disabled={isClosed}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          快选
        </button>
      )}
    </div>
  );

  // The 玩法说明 modal. Content depends on the active PK10 tab.
  const renderPlayHelpModal = () => {
    if (!helpOpen) return null;

    // 动物运动会: 前三名 (冠/亚/季) 才有龙虎；第四~六名只有「猜号码」「两面盘」。
    const animalPos = ANIMAL_POSITIONS.find((p) => p.id === activeTab);
    const animalHasDragon = animalPos ? animalPos.index < 3 : false;
    const animalTab = (animalHelpTab === 'dragon' && !animalHasDragon) ? 'guess' : animalHelpTab;

    // FFC 前中后 (三球) — 前三/中三/后三 differ only in which three digit
    // positions of the winning number are compared. `digits` names them.
    const ffcTripleInfo = {
      front: { digits: '百位千位万位' },
      mid: { digits: '十位百位千位' },
      back: { digits: '个位十位百位' },
    };
    const renderFfcTriple = (digits) => (
      <div className="play-help-box" style={{ whiteSpace: 'normal', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
        <div>
          <strong>豹子：</strong>中奖号码的{digits}数字都相同。
          {'\n'}如中奖号码为 000、111、999 等，中奖号码的{digits}数字相同，则投注豹子者视为中奖，其它视为不中奖。
        </div>
        <div>
          <strong>顺子：</strong>中奖号码的{digits}数字相连，不分顺序。（数字 9、0、1 相连）。
          {'\n'}如中奖号码为 123、901、321、546 等，中奖号码{digits}数字相连，则投注顺子者视为中奖，其余情况视为不中奖。
        </div>
        <div>
          <strong>对子：</strong>中奖号码的{digits}任意两位数字相同。（不包括豹子）。
          {'\n'}如中奖号码为 001、112、696，中奖号码有两位数字相同，则投注对子者为中奖，其余情况视为不中奖。如果开奖号码为豹子，则对子视为不中奖。
        </div>
        <div>
          <strong>半顺：</strong>中奖号码的{digits}任意两位数字相连，不分顺序。（不包括豹子，对子）。
          {'\n'}如中奖号码为 125、540、390、706，中奖号码有两位数字相连，则投注半顺者视为中奖，其它视为不中奖。如果开奖号码为顺子、对子，则半顺视为不中奖。如中奖号码为 123、901、556、233，视为不中奖。
        </div>
        <div>
          <strong>杂六：</strong>不包括豹子、对子、顺子、半顺的所有中奖号码。
          {'\n'}如中奖{digits}号码为 157，中奖号码位数之间无关联性，则投注杂六者视为中奖，其它视为不中奖。
        </div>
      </div>
    );

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
              <div className="play-help-box">
                冠亚和：冠军号码+亚军号码=冠亚和值
                {'\n\n'}“冠亚和值”可能出现的结果为 3—19，投中对应“冠亚和值”数字的视为中奖，其余视为不中奖。
              </div>
            </div>
          )}

          {gameKind !== 'ffc' && activeTab === 'two-sided' && (
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

          {gameKind === 'animal' && animalPos && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${animalTab === 'guess' ? 'active' : ''}`}
                  onClick={() => setAnimalHelpTab('guess')}
                >猜号码</button>
                <button
                  type="button"
                  className={`play-help-tab ${animalTab === 'twoside' ? 'active' : ''}`}
                  onClick={() => setAnimalHelpTab('twoside')}
                >两面盘</button>
                {animalHasDragon && (
                  <button
                    type="button"
                    className={`play-help-tab ${animalTab === 'dragon' ? 'active' : ''}`}
                    onClick={() => setAnimalHelpTab('dragon')}
                  >龙虎</button>
                )}
              </div>
              {animalTab === 'guess' && (
                <div className="play-help-box">
                  竞猜第一名～第六名的号码，猜中具体排名的号码视为中奖，其余情形视为不中奖。
                  {'\n\n'}例：竞猜冠军为1号，开奖结果冠军也是1号，即为中奖。
                </div>
              )}
              {animalTab === 'twoside' && (
                <div className="play-help-box">
                  <strong>大、小：</strong>竞猜具体排名上的号码数字大小，大于等于4为大，小于等于3为小。投注号码对应所投大小视为中奖，反之视为不中奖。
                  {'\n\n'}例：投注冠军位为大，开奖结果冠军位为4即为中奖。
                  {'\n\n'}<strong>单、双：</strong>竞猜具体排名上的号码数字单双，1、3、5为单，2、4、6为双。投注号码对应所投单双视为中奖，反之视为不中奖。
                  {'\n\n'}例：投注冠军位为双，开奖结果冠军位为2即为中奖。
                </div>
              )}
              {animalTab === 'dragon' && (
                <div className="play-help-box">
                  <strong>冠军龙/虎：</strong>“第一名”的号码大于“第六名”的号码视为【龙】中奖、反之小于视为【虎】中奖。
                  {'\n\n'}<strong>亚军龙/虎：</strong>“第二名”的号码大于“第五名”的号码视为【龙】中奖、反之小于视为【虎】中奖。
                  {'\n\n'}<strong>第三名龙/虎：</strong>“第三名”的号码大于“第四名”的号码视为【龙】中奖、反之小于视为【虎】中奖。
                </div>
              )}
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'tema' && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'quick' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('quick')}
                >快捷</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'number' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('number')}
                >数字</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'twoside' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('twoside')}
                >两面</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'color' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('color')}
                >色波</button>
              </div>
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>
                  特码：当期开奖的最后 1 个号码。
                </div>
                
                {lhcHelpTab === 'quick' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      1. <strong>快捷按钮：</strong>点选按钮会自动选中下方符合的数字，例如点击「红」，则会选中所有红色的球号，再次点击会取消选择
                    </div>
                    <div>
                      2. <strong>快捷投注：</strong>按号码=金额的格式，用多个空格分隔。例如：1=20 2=20
                    </div>
                  </div>
                )}

                {lhcHelpTab === 'number' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      1. 假如投注号码为开奖号码之「特码」，视为中奖，其余情形视为不中奖
                    </div>
                  </div>
                )}

                {lhcHelpTab === 'twoside' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <strong>大小：</strong>「特码」大于或等于25为大，小于或等于24为小，开出49为和。
                    </div>
                    <div>
                      <strong>单双：</strong>「特码」为单数或双数下注，开出49为和。
                    </div>
                    <div>
                      <strong>合大/合小：</strong>「特码」的个位和十位数字总和来判断胜负，和数大于或等于7为合大，小于或等于6为合小，开出49为和。
                    </div>
                    <div>
                      <strong>合单/合双：</strong>「特码」的个位和十位数字总和来判断单双，开出49为和。
                    </div>
                    <div>
                      <strong>大单/小单/大双/小双：</strong>「特码」的大小单双混合判断，开出49为和。
                    </div>
                    <div>
                      <strong>尾大/尾小：</strong>「特码」的尾数来判断大小，0尾~4尾为小、5尾~9尾为大，开出49为和。
                    </div>
                    <div>
                      <strong>家禽野兽：</strong>开出的「特码」属于十二生肖中的牛、马、羊、鸡、狗、猪号码为家禽，属于十二生肖中的鼠、虎、龙、蛇、兔、猴号码为野兽。(请注意：49亦算输赢，不为和)
                    </div>
                  </div>
                )}

                {lhcHelpTab === 'color' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <strong>红波：</strong>
                      <span style={{ color: '#e3342f', fontWeight: 'bold' }}>
                        01、02、07、08、12、13、18、19、23、24、29、30、34、35、40、45、46
                      </span>
                    </div>
                    <div>
                      <strong>绿波：</strong>
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                        05、06、11、16、17、21、22、27、28、32、33、38、39、43、44、49
                      </span>
                    </div>
                    <div>
                      <strong>蓝波：</strong>
                      <span style={{ color: '#2563eb', fontWeight: 'bold' }}>
                        03、04、09、10、14、15、20、25、26、31、36、37、41、42、47、48
                      </span>
                    </div>
                    <div>
                      <strong>数字范围：</strong>当期开出的「特码」落在投注的数字范围，视为中奖。(请注意：49亦算输赢，不为和)
                    </div>
                    <div>
                      <strong>范围包含：</strong>01-10、11-20、21-30、31-40、41-49
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'zhengma' && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'quick' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('quick')}
                >快捷</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'number' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('number')}
                >数字</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'twoside' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('twoside')}
                >两面</button>
              </div>
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>
                  六合彩当期开出之前6个号码叫「正码」。
                </div>
                
                {lhcHelpTab === 'quick' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      1. <strong>快捷按钮：</strong>点选按钮会自动选中下方符合的数字，例如点击「红」，则会选中所有红色的球号，再次点击会取消选择
                    </div>
                    <div>
                      2. <strong>快捷投注：</strong>按号码=金额的格式，用多个空格分隔。例如：1=20 2=20
                    </div>
                  </div>
                )}

                {lhcHelpTab === 'number' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <strong>数字：</strong>每一个号码为一投注组合，假如投注号码为开奖号码之「正码」，视为中奖，其余情形视为不中奖。
                    </div>
                  </div>
                )}

                {lhcHelpTab === 'twoside' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <strong>总和单双：</strong>根据「7个号码」的总和判断单双，总和是单数叫总和单，如分数总和是115、183；总和是双数叫总和双，如分数总和是108、162。
                    </div>
                    <div>
                      <strong>总和大小：</strong>根据「7个号码」的总和判断大小，总和大于或等于175为总和大；总和小于或等于174为总和小。
                    </div>
                    <div>
                      <strong>总尾大小：</strong>根据6个「正码」的总和数，尾数(总和数个位数字)若在0尾~4尾为小，5尾~9尾为大;如开奖号码为02,08,17,28,39,46，分数总和是140，则总尾小中奖。(请注意：49亦算输赢，不为和)
                    </div>
                    <div>
                      <strong>龙虎：</strong>第一球跟第六球比较大小，第一球号码大于第六球号码为龙，反之为虎。
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'zhengte' && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'quick' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('quick')}
                >快捷</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'number' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('number')}
                >数字</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'twoside' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('twoside')}
                >两面</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'color' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('color')}
                >色波</button>
              </div>
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  六合彩当期开出之前6个号码叫「正码」。
                  <br />
                  第一时间出来的叫「正码」特一，依次为「正码」特二、「正码」特三、「正码」特四、「正码」特五、「正码」特六(并不以号码大小排序)。
                </div>
                
                {lhcHelpTab === 'quick' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      1. 先选择开奖位置「特一」～「特六」
                    </div>
                    <div>
                      2. <strong>快捷按钮：</strong>点选按钮会自动选中下方符合的数字，例如选点击「红」，则会选中所有红色的球号，再次点击会取消选择
                    </div>
                    <div>
                      3. <strong>快捷投注：</strong>按号码=金额的格式，用多个空格分隔。例如：1=20 2=20
                    </div>
                  </div>
                )}

                {lhcHelpTab === 'number' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <strong>数字：</strong>其下注的「正码」特号与当期之「正码」开奖顺序及开奖号码相同，视为中奖，如开奖第一个「正码」为49号，下注「正码」特一为49，视为中奖，其它号码视为不中奖。
                    </div>
                  </div>
                )}

                {lhcHelpTab === 'twoside' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <strong>大小：</strong>以指定出现位置的号码大于或等于25为大，小于或等于24为小，开出49为和。
                    </div>
                    <div>
                      <strong>单双：</strong>以指定出现位置的号码为单数或双数下注，开出49为和。
                    </div>
                    <div>
                      <strong>合大/合小：</strong>以指定出现位置的号码个位和十位数字总和来判断胜负，总和数大于或等于7为合大，小于或等于6为合小，开出49为和。
                    </div>
                    <div>
                      <strong>合单/合双：</strong>以指定出现位置的号码个位和十位数字总和来判断单双，开出49为和。
                    </div>
                    <div>
                      <strong>尾大/尾小：</strong>以指定出现位置的号码末尾数来判断大小，0尾~4尾为小、5尾~9尾为大，开出49为和。
                    </div>
                  </div>
                )}

                {lhcHelpTab === 'color' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <strong>红波：</strong>
                      <span style={{ color: '#e3342f', fontWeight: 'bold' }}>
                        01、02、07、08、12、13、18、19、23、24、29、30、34、35、40、45、46
                      </span>
                    </div>
                    <div>
                      <strong>绿波：</strong>
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                        05、06、11、16、17、21、22、27、28、32、33、38、39、43、44、49
                      </span>
                    </div>
                    <div>
                      <strong>蓝波：</strong>
                      <span style={{ color: '#2563eb', fontWeight: 'bold' }}>
                        03、04、09、10、14、15、20、25、26、31、36、37、41、42、47、48
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'texiao' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  特肖：以生肖下注。只要当期「特码」落在下注生肖范围内，则视为中奖。(请注意：49亦算输赢，不为和)
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: '#1e293b' }}>
                  {(() => {
                    const sortedZodiacs = [...LHC_ZODIACS].sort((a, b) => {
                      const minA = LHC_TEXIAO_NUMBERS[a]?.[0] || 99;
                      const minB = LHC_TEXIAO_NUMBERS[b]?.[0] || 99;
                      return minA - minB;
                    });
                    return sortedZodiacs.map((zodiac) => {
                      const nums = LHC_TEXIAO_NUMBERS[zodiac] || [];
                      const formattedNums = nums.map((n) => n.toString().padStart(2, '0')).join('、');
                      return (
                        <li key={zodiac} style={{ listStyleType: 'disc' }}>
                          {zodiac}：{formattedNums}
                        </li>
                      );
                    });
                  })()}
                </ul>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'zhengxiao' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  正肖：以生肖下注。只要当期「正码」落在下注生肖范围内，则视为中奖。(请注意：49亦算输赢，不为和)
                  <br /><br />
                  若超过1个正码落在下注生肖范围内，盈利将随命中号码倍增。比如2024年龙年，龙赔率为1.4，投注龙100元，6个正码中开出01，则派彩140元；6个正码中开出01，13，则派彩180元。
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: '#1e293b' }}>
                  {(() => {
                    const sortedZodiacs = [...LHC_ZODIACS].sort((a, b) => {
                      const minA = LHC_TEXIAO_NUMBERS[a]?.[0] || 99;
                      const minB = LHC_TEXIAO_NUMBERS[b]?.[0] || 99;
                      return minA - minB;
                    });
                    return sortedZodiacs.map((zodiac) => {
                      const nums = LHC_TEXIAO_NUMBERS[zodiac] || [];
                      const formattedNums = nums.map((n) => n.toString().padStart(2, '0')).join('、');
                      return (
                        <li key={zodiac} style={{ listStyleType: 'disc' }}>
                          {zodiac}：{formattedNums}
                        </li>
                      );
                    });
                  })()}
                </ul>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'yixiao' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  一肖：以生肖下注。只要「当期号码」落在下注生肖范围内，则视为中奖。(请注意：49亦算输赢，不为和)
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: '#1e293b' }}>
                  {(() => {
                    const sortedZodiacs = [...LHC_ZODIACS].sort((a, b) => {
                      const minA = LHC_TEXIAO_NUMBERS[a]?.[0] || 99;
                      const minB = LHC_TEXIAO_NUMBERS[b]?.[0] || 99;
                      return minA - minB;
                    });
                    return sortedZodiacs.map((zodiac) => {
                      const nums = LHC_TEXIAO_NUMBERS[zodiac] || [];
                      const formattedNums = nums.map((n) => n.toString().padStart(2, '0')).join('、');
                      return (
                        <li key={zodiac} style={{ listStyleType: 'disc' }}>
                          {zodiac}：{formattedNums}
                        </li>
                      );
                    });
                  })()}
                </ul>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'yixiao-no' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  一肖不中：以生肖下注。只要「当期号码」不包含下注生肖，则视为中奖。(请注意：49亦算输赢，不为和)
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: '#1e293b' }}>
                  {(() => {
                    const sortedZodiacs = [...LHC_ZODIACS].sort((a, b) => {
                      const minA = LHC_TEXIAO_NUMBERS[a]?.[0] || 99;
                      const minB = LHC_TEXIAO_NUMBERS[b]?.[0] || 99;
                      return minA - minB;
                    });
                    return sortedZodiacs.map((zodiac) => {
                      const nums = LHC_TEXIAO_NUMBERS[zodiac] || [];
                      const formattedNums = nums.map((n) => n.toString().padStart(2, '0')).join('、');
                      return (
                        <li key={zodiac} style={{ listStyleType: 'disc' }}>
                          {zodiac}：{formattedNums}
                        </li>
                      );
                    });
                  })()}
                </ul>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'weishu' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  尾数：只要「当期号码」含有投注所属尾数的一个或多个号码，即视为中奖，不论同尾数的号码出现一个或多个，派彩只派一次。
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: '#1e293b' }}>
                  {LHC_TAIL_GROUPS.map((g) => {
                    const formattedNums = g.nums.map((n) => n.toString().padStart(2, '0')).join('、');
                    return (
                      <li key={g.tail} style={{ listStyleType: 'disc' }}>
                        {g.tail}尾：{formattedNums}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'weishu-no' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  尾数不中：只要「当期号码」不含有投注所属尾数，即视为中奖。
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: '#1e293b' }}>
                  {LHC_TAIL_GROUPS.map((g) => {
                    const formattedNums = g.nums.map((n) => n.toString().padStart(2, '0')).join('、');
                    return (
                      <li key={g.tail} style={{ listStyleType: 'disc' }}>
                        {g.tail}尾：{formattedNums}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'tetoushu' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  特码头数：「特码」为所属头数号码，即视为中奖。
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: '#1e293b' }}>
                  {LHC_HEAD_GROUPS.map((g) => {
                    const formattedNums = g.nums.map((n) => n.toString().padStart(2, '0')).join('、');
                    return (
                      <li key={g.head} style={{ listStyleType: 'disc' }}>
                        {g.head}头：{formattedNums}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'teweishu' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  特码尾数：「特码」为所属尾数号码，即视为中奖。
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: '#1e293b' }}>
                  {LHC_TAIL_GROUPS.map((g) => {
                    const formattedNums = g.nums.map((n) => n.toString().padStart(2, '0')).join('、');
                    return (
                      <li key={g.tail} style={{ listStyleType: 'disc' }}>
                        {g.tail}尾：{formattedNums}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'banbo' && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'red' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('red')}
                >红</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'green' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('green')}
                >绿</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === 'blue' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('blue')}
                >蓝</button>
              </div>
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  以「特码」色波和「特码」大小单双为一个投注组合，当期「特码」开出符合投注组合，即视为中奖；若当期「特码」开出49号则视为和局；其余情形视为不中奖。
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: '#1e293b' }}>
                  {(() => {
                    const hexColorMap = { red: '#e3342f', green: '#16a34a', blue: '#2563eb' };
                    const currentTargetColor = lhcHelpTab === 'red' ? 'red' : lhcHelpTab === 'green' ? 'green' : 'blue';
                    const filteredItems = LHC_BANBO_ITEMS.filter((item) => item.color === currentTargetColor);
                    
                    return filteredItems.map((item) => {
                      const formattedNums = item.nums.map((n) => n.toString().padStart(2, '0')).join('、');
                      return (
                        <li key={item.label} style={{ listStyleType: 'disc' }}>
                          {item.label}：
                          <span style={{ color: hexColorMap[currentTargetColor], fontWeight: 'bold' }}>
                            {formattedNums}
                          </span>
                        </li>
                      );
                    });
                  })()}
                </ul>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'wuxing' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  特码五行：「特码」为所属五行号码，即视为中奖。(调整时间为每年的农历初一)
                  <br /><br />
                  2026年五行如下
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: '#1e293b' }}>
                  {LHC_WUXING.map((w) => {
                    const formattedNums = w.nums.map((n) => n.toString().padStart(2, '0')).join('、');
                    return (
                      <li key={w.element} style={{ listStyleType: 'disc' }}>
                        {w.element}：{formattedNums}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'zongxiao' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  总肖：只要「当期号码」开出的不同生肖总数，与所投注之预计开出之生肖总数合（不用指定特定生肖），则视为中奖，其余情形视为不中奖。
                  <br /><br />
                  例如：如果当期开奖「正码」为19、24、12、34、40、39「特码」：49，总计六个生肖，若选总肖【6】则为中奖（请注意：49亦算输赢，不为和）。
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: '#1e293b' }}>
                  <li style={{ listStyleType: 'disc' }}>
                    总肖单：「当期号码」所属不同生肖总数是单数
                  </li>
                  <li style={{ listStyleType: 'disc' }}>
                    总肖双：「当期号码」所属不同生肖总数是双数
                  </li>
                </ul>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'qisebo' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', fontSize: '13.5px', lineHeight: '1.6', color: '#1e293b' }}>
                  <strong>七色波：</strong>以开出的7个色波，哪种颜色最多为中奖。「正码」各以1个色波计，「特码」以1.5个色波计。
                  <br />
                  以下3种结果视为和局：
                  <div style={{ paddingLeft: '12px', marginTop: '6px', marginBottom: '6px' }}>
                    1. 6个「正码」开出3蓝3绿，而「特码」是1.5红
                    <br />
                    2. 6个「正码」开出3红3绿，而「特码」是1.5蓝
                    <br />
                    3. 6个「正码」开出3红3蓝，而「特码」是1.5绿
                  </div>
                  如果出现和局，所有投注红，蓝，绿七色波的金额将全数退回，会员也可投注和局。
                </div>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'hexiao' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', fontSize: '13.5px', lineHeight: '1.6', color: '#1e293b' }}>
                  选2~11个生肖(排列如同生肖)为一组合，当期开出「特码」符合所选生肖及投注类别，即视为中奖；若当期「特码」开出49号，则视为和局；其余情形视为不中奖。
                </div>
              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'lianma' && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === '2' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('2')}
                >2</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === '3' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('3')}
                >3</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === '4' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('4')}
                >4</button>
              </div>
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  每个号码都有自己的赔率，下注组合的总赔率，取该组合号码的最低赔率为总赔率。
                </div>
                
                {lhcHelpTab === '2' && (
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#1e293b' }}>
                    <li style={{ listStyleType: 'disc' }}>
                      <strong>二全中：</strong>所投注的每二个号码为一组合，若二个号码都是开奖号码之「正码」，视为中奖，其余情形视为不中奖（含一个「正码」加一个「特码」之情形）。
                    </li>
                    <li style={{ listStyleType: 'disc' }}>
                      <strong>二中特：</strong>所投注的每二个号码为一组合，若二个号码都是开奖号码之「正码」，叫「二中特之中二」；若其中一个是「正码」一个是「特码」，叫「二中特之中特」；其余情形视为不中奖。
                    </li>
                    <li style={{ listStyleType: 'disc' }}>
                      <strong>特串：</strong>所投注的每二个号码为一组合，其中一个是「正码」，一个是「特码」，视为中奖，其余情形视为不中奖（含二个号码都是「正码」之情形）。
                    </li>
                  </ul>
                )}

                {lhcHelpTab === '3' && (
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#1e293b' }}>
                    <li style={{ listStyleType: 'disc' }}>
                      <strong>三全中：</strong>所投注的每三个号码为一组合，若三个号码都是开奖号码之「正码」，视为中奖，其余情形视为不中奖。例如06、07、08三个都是开奖号码之「正码」，视为中奖，如两个「正码」加上一个「特码」视为不中奖。
                    </li>
                    <li style={{ listStyleType: 'disc' }}>
                      <strong>三中二：</strong>所投注的每三个号码为一组合，若其中2个是开奖号码中的「正码」，即为「三中二」，视为中奖；若3个都是开奖号码中的「正码」，即为「三中二之中三」，其余情形视为不中奖；例如06、07、08、为一组合，开奖号码中有06、07两个「正码」，没有08，即为三中二，按三中二赔付；如开奖号码中有06、07、08三个「正码」，即为三中二之中三，按中三赔付；如出现1个或没有，视为不中奖。
                    </li>
                  </ul>
                )}

                {lhcHelpTab === '4' && (
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#1e293b' }}>
                    <li style={{ listStyleType: 'disc' }}>
                      <strong>四全中：</strong>所投注的每四个号码为一组合，若四个号码都是开奖号码之「正码」，视为中奖，其余情形视为不中奖。例如06、07、08、09四个都是开奖号码之「正码」，视为中奖，如三个「正码」加上一个「特码」视为不中奖。
                    </li>
                  </ul>
                )}

              </div>
            </div>
          )}

          {gameKind === 'lhc' && activeTab === 'buzhong' && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === '4-8' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('4-8')}
                >4~8不中</button>
                <button
                  type="button"
                  className={`play-help-tab ${lhcHelpTab === '9-12' ? 'active' : ''}`}
                  onClick={() => setLhcHelpTab('9-12')}
                >9~12不中</button>
              </div>
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <div style={{ fontWeight: 'normal', marginBottom: '12px' }}>
                  每个号码都有自己的赔率，下注组合的总赔率，取该组合号码的最低赔率为总赔率。
                </div>

                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#1e293b' }}>
                  {(lhcHelpTab === '9-12'
                    ? [['九', 9], ['十', 10], ['十一', 11], ['十二', 12]]
                    : [['四', 4], ['五', 5], ['六', 6], ['七', 7], ['八', 8]]
                  ).map(([cn, n]) => (
                    <li key={n} style={{ listStyleType: 'disc' }}>
                      <strong>{cn}不中：</strong>挑选{n}个号码为一投注组合进行下注。「当期号码」都没有在该下注组合中，即视为中奖；其余情形视为不中奖。
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ===================== FFC (分分彩) ===================== */}
          {gameKind === 'ffc' && activeTab === 'guess-ball' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <strong>第一球、第二球、第三球、第四球、第五球：</strong>指下注的每一球与开出之号码其开奖顺序及开奖号码相同，视为中奖，如第一球开出号码 8，下注第一球为 8 者视为中奖，其余情形视为不中奖。
              </div>
            </div>
          )}

          {gameKind === 'ffc' && activeTab === 'two-sided' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div>
                  <strong>大小：</strong>根据相应单项投注的第一球–第五球开出的球号大于或等于 5 为大，小于或等于 4 为小，以此判断胜负。
                </div>
                <div>
                  <strong>单双：</strong>根据相应单项投注的第一球–第五球开出的球号为双数为双，如 2、6；为单数为单，如 1、3，以此判断胜负。
                </div>
                <div>
                  <strong>总和大小：</strong>根据相应单项投注的第一球–第五球开出的球号数字总和值大于或等于 23 为总和大，小于或等于 22 为总和小，以此判断胜负。
                </div>
                <div>
                  <strong>总和单双：</strong>根据相应单项投注的第一球–第五球开出的球号数字总和值是双数为总和双，数字总和值是单数为总和单，以此判断胜负。
                </div>
              </div>
            </div>
          )}

          {gameKind === 'ffc' && activeTab === 'front-mid-back' && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${ffcHelpTab === 'front' ? 'active' : ''}`}
                  onClick={() => setFfcHelpTab('front')}
                >前三</button>
                <button
                  type="button"
                  className={`play-help-tab ${ffcHelpTab === 'mid' ? 'active' : ''}`}
                  onClick={() => setFfcHelpTab('mid')}
                >中三</button>
                <button
                  type="button"
                  className={`play-help-tab ${ffcHelpTab === 'back' ? 'active' : ''}`}
                  onClick={() => setFfcHelpTab('back')}
                >后三</button>
                <button
                  type="button"
                  className={`play-help-tab ${ffcHelpTab === 'lh' ? 'active' : ''}`}
                  onClick={() => setFfcHelpTab('lh')}
                >龙虎</button>
              </div>
              {ffcHelpTab === 'lh' ? (
                <div className="play-help-box" style={{ whiteSpace: 'normal', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <strong>龙：</strong>开奖第一球（万位）的号码大于第五球（个位）的号码。
                    {'\n'}如：第一球开出 6，第五球开出 2，开奖结果为龙，投注龙则视为中奖。
                  </div>
                  <div>
                    <strong>虎：</strong>开奖第一球（万位）的号码小于第五球（个位）的号码。
                    {'\n'}如：第一球开出 2，第五球开出 6，开奖结果为虎，投注虎则视为中奖。
                  </div>
                  <div>
                    <strong>和：</strong>开奖第一球（万位）的号码等于第五球（个位）的号码。
                    {'\n'}如：2XXX2、6XXX6、8XXX8…开奖为和，投注和则视为中奖，其余情况（比如投注龙/虎）视为输。
                  </div>
                </div>
              ) : (
                renderFfcTriple(ffcTripleInfo[ffcHelpTab].digits)
              )}
            </div>
          )}

          {/* ===================== 快三 (K3) ===================== */}
          {gameKind === 'k3' && activeTab === 'three-army' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <strong>三军：</strong>于 1-6 中至少选择 1 个或 1 个以上号码，所下注的号码符合开奖结果即视为中奖，其余情形即视为不中奖。
                {'\n'}　根据开奖的三个骰子点数来判断，只要开出一个选定的点数便中奖，开出的三个号码如果重复，中奖倍数以出现次数计算。
                {'\n\n'}举例：
                {'\n'}假设赔率为 2，投注三军 2 点股 100 元，开奖结果为：126，2 点股与投注号码相符，视为中奖，派彩 200 元。
                {'\n'}假设赔率为 2，投注三军 3 点股 100 元，开奖结果为：233，3 点股与投注号码相符，视为中奖，且开出两颗 3 点股，派彩 400 元。
              </div>
            </div>
          )}

          {gameKind === 'k3' && activeTab === 'short-pair' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <strong>短牌：</strong>于短牌（对子）组合中选择 1 组或 1 组以上投注，若开奖号码与所选择的短牌组合相同（不分顺序），即视为中奖，其余情形视为不中奖。
                {'\n\n'}举例：
                {'\n'}投注短牌 55 组合，开奖结果为：525，与投注组合相符，视为中奖。
                {'\n'}举例：
                {'\n'}投注短牌 66 组合，开奖结果为：666，与投注组合相符，视为中奖。
              </div>
            </div>
          )}

          {gameKind === 'k3' && activeTab === 'long-pair' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <strong>长牌：</strong>于长牌组合中选择 1 或 1 个以上投注，若开奖号码与所选择的长牌组合相符时（不分顺序），即视为中奖，其余情形即视为不中奖。
                {'\n'}如开奖结果为 126，则投注长牌：12、16、26 之组合都为中奖。
                {'\n\n'}举例：
                {'\n'}投注长牌 36 及 15 组合，开奖结果为：136，36 与投注组合相符，视为中奖。15 与投注组合不相符，视为不中。
              </div>
            </div>
          )}

          {gameKind === 'k3' && activeTab === 'all-triple' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <strong>全骰：</strong>投注全骰，开奖号码为豹子即算中奖，即开出 111、222、333、444、555、666，这六种结果相同即视为中奖，其余情形即视为不奖。
                {'\n'}举例：
                {'\n'}投注全骰，开奖结果为：444，与投注结果相符，视为中奖。
              </div>
            </div>
          )}

          {gameKind === 'k3' && activeTab === 'sum' && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${k3SumHelpTab === 'points' ? 'active' : ''}`}
                  onClick={() => setK3SumHelpTab('points')}
                >点数</button>
                <button
                  type="button"
                  className={`play-help-tab ${k3SumHelpTab === 'twoside' ? 'active' : ''}`}
                  onClick={() => setK3SumHelpTab('twoside')}
                >双面</button>
              </div>
              {k3SumHelpTab === 'points' ? (
                <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                  以开出的三个号码相加总和为开奖依据，投注点数与开奖号码之和相同即视为中奖（包括豹子），其余情形即视为不中奖。
                  {'\n\n'}举例：
                  {'\n'}投注和值 6 点，开奖结果为：123，与投注结果相符，视为中奖。
                  {'\n'}举例：
                  {'\n'}投注和值 6 点，开奖结果为：222，与投注结果相符，视为中奖。
                </div>
              ) : (
                <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                  以开出的三个号码相加总和为开奖依据，加总和若值为 4~10 为小；11~17 为大；4、6、8、16 为双；5、7、9、17 为单。如开出豹子不论投注大，小，单，双都视为不中奖。
                  {'\n\n'}举例：
                  {'\n'}投注和值双面–［大］，开奖结果为：456，与投注结果相符，视为中奖。
                  {'\n'}举例：
                  {'\n'}投注和值双面–［单］，开奖结果为：135，与投注结果是相符，视为中奖。
                </div>
              )}
            </div>
          )}

          {gameKind === 'k3' && activeTab === 'two-same' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <strong>二同号：</strong>于任选号码（二同号）组合中选择 1 组或 1 组以上投注，若开奖号码与所选择的二同号组合相符时（不分顺序），即视为中奖，其余情形即视为不中奖。
                {'\n'}举例：
                {'\n'}投注二同号 113 组合，开奖结果为：113，与投注结果相符，视为中奖，其余结果视为不中奖。
              </div>
            </div>
          )}

          {gameKind === 'k3' && activeTab === 'three-diff' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <strong>三不同：</strong>于任选号码（三不同）组合中选择 1 组或 1 组以上投注，若开奖号码与所选择的三不同组合相符时（不分顺序），即视为中奖，其余情形即视为不中奖。
                {'\n'}举例：
                {'\n'}投注三不同 123 组合，开奖结果为：123，与投注结果相符，视为中奖，其余结果视为不中奖。
              </div>
            </div>
          )}

          {/* ===================== 百家乐 (BAC) ===================== */}
          {gameKind === 'bac' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div>
                  <strong>游戏简介：</strong>
                  {'\n'}百家乐分为【闲家】和【庄家】，玩家可以下注闲家或庄家，点数总和最接近 9 点者获胜。双方各收到至少两至三张牌，第三张为补牌。如果需要补牌，将按照以下补牌规则多发一张牌。任何一家拿到「例牌」（两张牌合计共为 8 或 9 点）时，牌局即结束，不再补牌。
                </div>
                <div>
                  <strong>玩法规则和赔率：</strong>
                  {'\n'}庄 1.95、闲 2.0、和 9.0、庄幸运6 12.0；庄对 12.0、闲对 12.0、任意对子 6.0、完美对子 26.0；两面（闲单/闲双/庄单/庄双）1.96。
                </div>
                <div>
                  <strong>点数计算方法：</strong>
                  {'\n'}10、J、Q 及 K 的扑克牌算作零点，其他按牌面点数计算。当所有牌的点数总和超过 9 点时，仅算总数中的个位。例，最小点数为：0 点（4+6=10）；最大点数为：9 点（4+5=9）取个位数。
                </div>
                <div>
                  <strong>例牌：</strong>
                  {'\n'}庄闲任何一方两牌合计为 8 或 9 点（称为例牌），双方都不需补牌，即定胜负（双方同持 8 点或 9 点为和局）。
                </div>
                <div>
                  <strong>补牌规则：</strong>
                  {'\n'}若闲家不需补牌（即闲家首两张牌合计为「6 至 9 点」），庄家以「闲家补牌规则」补牌，即庄家首两张牌合计「0 至 5」点要补一张牌，6 点以上不许补牌。
                  {'\n'}若闲家补牌，庄家依其首两张点数与闲家补牌点数决定是否补牌。
                </div>
              </div>
            </div>
          )}

          {/* ===================== 鱼虾蟹 (FHC) ===================== */}
          {gameKind === 'fhc' && activeTab === 'single' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <strong>单殿：</strong>于 6 种图案（鱼、虾、蟹、葫芦、金钱、鸡）中选择 1 个或 1 个以上投注，所投图案出现在开奖的三颗骰子中即视为中奖，中奖赔率依图案出现次数累计。
                {'\n'}　图案出现一次，赔率 1.97；出现二次，赔率 2.94；出现三次，赔率 3.92。
                {'\n\n'}举例：
                {'\n'}投注单殿「鱼」100 元，开奖结果为「鱼·虾·蟹」，鱼出现一次，视为中奖，派彩 197 元。
                {'\n'}投注单殿「鱼」100 元，开奖结果为「鱼·鱼·蟹」，鱼出现二次，视为中奖，派彩 294 元。
              </div>
            </div>
          )}

          {gameKind === 'fhc' && activeTab === 'all-around' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <strong>全围：</strong>于 6 种图案中选择 1 个或 1 个以上投注，若开奖的三颗骰子图案全部相同，且与所投图案一致，即视为中奖，其余情形视为不中奖，赔率 180.0。
                {'\n\n'}举例：
                {'\n'}投注全围「鱼」，开奖结果为「鱼·鱼·鱼」，视为中奖，其余结果视为不中奖。
              </div>
            </div>
          )}

          {/* ===================== 幸运28 (XY28) ===================== */}
          {gameKind === 'xy28' && activeTab === 'sum' && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${xy28SumHelpTab === 'sum' ? 'active' : ''}`}
                  onClick={() => setXy28SumHelpTab('sum')}
                >总和</button>
                <button
                  type="button"
                  className={`play-help-tab ${xy28SumHelpTab === 'twoside' ? 'active' : ''}`}
                  onClick={() => setXy28SumHelpTab('twoside')}
                >两面</button>
                <button
                  type="button"
                  className={`play-help-tab ${xy28SumHelpTab === 'combo' ? 'active' : ''}`}
                  onClick={() => setXy28SumHelpTab('combo')}
                >两面组合</button>
              </div>
              {xy28SumHelpTab === 'sum' && (
                <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                  开出的三个号码的和值为游戏结果，投注数字对应开奖数字之和视为中奖，其余情况视为不中奖。
                  {'\n\n'}例：投注总和 10，开奖数字之和为 10，即为中奖。
                </div>
              )}
              {xy28SumHelpTab === 'twoside' && (
                <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                  <strong>单、双：</strong>号码为单数叫“单”，如：1、3、5、7、9；号码为双数叫“双”，如：2、4、6、8、10。投注总和单双对应所投单双视为中奖，反之视为不中奖。
                  {'\n\n'}例：投注总和为“双”，开奖结果总和为 18，即为中奖。
                  {'\n\n'}<strong>大、小：</strong>开出之号码大于等于 14 为“大”，小于等于 13 为“小”。投注总和大小对应所投大小视为中奖，反之视为不中奖。
                  {'\n\n'}例：投注总和为“大”，开奖结果总和为 20，即为中奖。
                </div>
              )}
              {xy28SumHelpTab === 'combo' && (
                <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                  <strong>大单、大双：</strong>和值为 15、17、19、21、23、25、27 为“大单”，和值为 14、16、18、20、22、24、26 为“大双”。
                  {'\n\n'}例：投注“大单”，开奖结果总和为 23，即为中奖。
                  {'\n\n'}<strong>小单、小双：</strong>和值为 1、3、5、7、9、11、13 为“小单”，和值为 0、2、4、6、8、10、12 为“小双”。
                  {'\n\n'}例：投注“小双”，开奖结果总和为 10，即为中奖。
                </div>
              )}
            </div>
          )}

          {gameKind === 'xy28' && activeTab === 'side-ball' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                <strong>边：</strong>总和在以下范围视为“边”：
                {'\n'}0、1、2、3、4、5、6、7、8、9、18、19、20、21、22、23、24、25、26、27
                {'\n\n'}<strong>大边：</strong>总和在 18 至 27 之间视为“大边”。
                {'\n\n'}<strong>小边：</strong>总和在 0 至 9 之间视为“小边”。
                {'\n\n'}<strong>中：</strong>总和在 10 至 17 之间视为“中”。
              </div>
            </div>
          )}

          {gameKind === 'xy28' && activeTab === 'tail-ball' && (
            <div className="play-help-body">
              <div className="play-help-tabs">
                <button
                  type="button"
                  className={`play-help-tab ${xy28TailHelpTab === 'num' ? 'active' : ''}`}
                  onClick={() => setXy28TailHelpTab('num')}
                >数字</button>
                <button
                  type="button"
                  className={`play-help-tab ${xy28TailHelpTab === 'twoside' ? 'active' : ''}`}
                  onClick={() => setXy28TailHelpTab('twoside')}
                >两面</button>
                <button
                  type="button"
                  className={`play-help-tab ${xy28TailHelpTab === 'combo' ? 'active' : ''}`}
                  onClick={() => setXy28TailHelpTab('combo')}
                >两面组合</button>
              </div>
              {xy28TailHelpTab === 'num' && (
                <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                  尾球数字的值为游戏结果，投注数字对应开奖数字之和的尾数即为中奖，其余视为不中奖。
                  {'\n'}例：投注尾球 8，开奖尾球为 8，即为中奖。
                  {'\n'}注：当开奖结果为 0 或 9 时，视为不中奖！
                </div>
              )}
              {xy28TailHelpTab === 'twoside' && (
                <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                  <strong>单、双：</strong>尾数为单数叫“单”，如：1、3、5、7；尾数为双数叫“双”，如：2、4、6、8。
                  {'\n\n'}例：投注尾球为“双”，开奖结果尾球为 8，即为中奖。
                  {'\n\n'}<strong>大、小：</strong>尾数为 5、6、7、8 为“大”；尾数为 1、2、3、4 为“小”。
                  {'\n\n'}例：投注尾球为“大”，开奖结果尾球为 7，即为中奖。
                </div>
              )}
              {xy28TailHelpTab === 'combo' && (
                <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                  <strong>大单、大双：</strong>尾球为 5、7 为“大单”，尾球为 6、8 为“大双”。
                  {'\n\n'}例：投注“大单”，开奖结果尾球为 7，即为中奖。
                  {'\n\n'}<strong>小单、小双：</strong>尾球为 1、3 为“小单”，尾球为 2、4 为“小双”。
                  {'\n\n'}例：投注“小双”，开奖结果尾球为 4，即为中奖。
                  {'\n'}注：当开奖结果为 0 或 9 时，视为不中奖！
                </div>
              )}
            </div>
          )}

          {gameKind === 'xy28' && activeTab === 'dragon-tiger-leopard' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                以下和值归类为：
                <ul style={{ margin: '6px 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li style={{ listStyleType: 'disc' }}><strong>龙：</strong>00、03、06、09、12、15、18、21、24、27</li>
                  <li style={{ listStyleType: 'disc' }}><strong>虎：</strong>01、04、07、10、13、16、19、22、25</li>
                  <li style={{ listStyleType: 'disc' }}><strong>豹：</strong>02、05、08、11、14、17、20、23、26</li>
                </ul>
                例：投注“龙”，开奖结果总和为 12，即为中奖。
              </div>
            </div>
          )}

          {gameKind === 'xy28' && activeTab === 'extreme' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal' }}>
                三个号码的和值 22–27 为“极大”，和值 0–5 为“极小”。
                {'\n\n'}例：投注“极大”，开奖结果总和为 25，即为中奖。
              </div>
            </div>
          )}

          {gameKind === 'xy28' && activeTab === 'three-ball' && (
            <div className="play-help-body">
              <div className="play-help-box" style={{ whiteSpace: 'normal', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>豹子：</strong>三个号码数字相同，称为“豹子”。</div>
                <div><strong>对子：</strong>三个号码中，有两个数字相同，称为“对子”。</div>
                <div><strong>顺子：</strong>三个号码为连续数字，不分顺序，如 123、231，称为“顺子”。</div>
              </div>
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

  // 重置 / 投注 / 封盘 / 切换游戏 clears all selections upstream; mirror that by
  // clearing the 快捷投注 textarea (skips the initial mount at nonce 0).
  const didMountClear = useRef(false);
  useEffect(() => {
    if (didMountClear.current) setQuickText('');
    else didMountClear.current = true;
  }, [clearNonce]);
  // 合肖: chosen 类别 (生肖个数) + currently selected 生肖.
  const [hexiaoCat, setHexiaoCat] = useState(2);
  const [hexiaoZodiacs, setHexiaoZodiacs] = useState([]);
  const [hexiaoDrawerOpen, setHexiaoDrawerOpen] = useState(true);

  // Clear the local 合肖 selection once its combo bets leave selectedBets
  // (after 投注 / 重置 / 封盘) so highlighted cards don't get out of sync.
  const hexiaoComboActive = selectedBets.some((b) => b.type === 'lhc-hexiao');
  const prevHexiaoCombo = useRef(false);
  useEffect(() => {
    if (prevHexiaoCombo.current && !hexiaoComboActive) setHexiaoZodiacs([]);
    prevHexiaoCombo.current = hexiaoComboActive;
  }, [hexiaoComboActive]);

  // 连码: chosen sub-tab + currently selected numbers
  const [lianmaSubTab, setLianmaSubTab] = useState('si-quan-zhong');
  const [lianmaNumbers, setLianmaNumbers] = useState([]);
  const [lianmaDrawerOpen, setLianmaDrawerOpen] = useState(true);

  // Clear the local 连码 selection once its combo bets leave selectedBets
  const lianmaComboActive = selectedBets.some((b) => b.type === 'lhc-lianma');
  const prevLianmaCombo = useRef(false);
  useEffect(() => {
    if (prevLianmaCombo.current && !lianmaComboActive) setLianmaNumbers([]);
    prevLianmaCombo.current = lianmaComboActive;
  }, [lianmaComboActive]);

  // 不中: chosen sub-tab + currently selected numbers (same structure as 连码)
  const [buzhongSubTab, setBuzhongSubTab] = useState('si-bu-zhong');
  const [buzhongNumbers, setBuzhongNumbers] = useState([]);
  const [buzhongDrawerOpen, setBuzhongDrawerOpen] = useState(true);

  // Clear the local 不中 selection once its combo bets leave selectedBets
  const buzhongComboActive = selectedBets.some((b) => b.type === 'lhc-buzhong');
  const prevBuzhongCombo = useRef(false);
  useEffect(() => {
    if (prevBuzhongCombo.current && !buzhongComboActive) setBuzhongNumbers([]);
    prevBuzhongCombo.current = buzhongComboActive;
  }, [buzhongComboActive]);

  // Blue side vs orange side for 两面 / 长龙 labels.
  const blueSide = (label) =>
    ['大', '单', '合单', '大单', '大双', '尾大', '野兽', '龙'].includes(label);

  const isBetSelected = (betId) => {
    return selectedBets.some(b => b.id === betId);
  };

  // Render Ball Item using the PK10 ball artwork
  const renderBall = (num) => (
    <img key={num} className="pk10-ball" src={pk10BallSrc(num)} alt={num} />
  );

  // Render FFC ball (digit 0-9) using the ball artwork
  const renderFfcBall = (num) => (
    <img key={num} className="pk10-ball" src={ffcBallSrc(num)} alt={num} />
  );

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
                  backgroundColor: opt === '大' || opt === '单' ? '#3b82f6' : '#f59e0b',
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
        <div className="accordion-list">
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
      </div>
    );
  };

  // ================= TAB 4: 两面盘 (Two Sided) =================
  const renderTwoSided = () => {
    return (
      <div className="play-area">
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
        <div className="accordion-list">
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
                            backgroundColor: opt === '大' || opt === '单' || opt === '龙' ? '#3b82f6' : '#f59e0b',
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
                            backgroundColor: opt === '大' || opt === '单' ? '#3b82f6' : '#f59e0b',
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
  // ===================== 百家乐 (BAC) Tabs ====================
  // ============================================================

  // A single centered bet card (label on top, odds below), tinted by `color`.
  const renderBacCard = (betObj, { label, color, className = '' }) => {
    const isSelected = isBetSelected(betObj.id);
    return (
      <button
        type="button"
        className={`bet-button bac-card-btn ${className} ${isSelected ? 'selected' : ''}`}
        onClick={() => onToggleBet(betObj)}
        disabled={isClosed}
      >
        <span className="bac-card-label" style={{ color }}>{label}</span>
        <span className="bac-card-odds" style={{ color }}>{betObj.odds.toFixed(betObj.odds >= 10 ? 1 : 2)}</span>
        {renderCheckmark(isSelected)}
      </button>
    );
  };

  const bacBet = (id, betName, type, odds) => ({
    id, tabId: activeTab, positionId: type, positionName: betName,
    betName, odds, displayTitle: betName, type,
  });

  // 庄闲: 庄 (tall left) | 和 + 庄幸运6 (stacked middle) | 闲 (tall right).
  const renderBacZhuangXian = () => (
    <div className="play-area">
      {renderPlayHelpBar()}
      {renderPlayHelpModal()}
      <div className="bac-zx-board">
        {renderBacCard(bacBet('bac-banker', '庄', 'bac-banker', BAC_ODDS.banker), { label: '庄', color: '#e3342f', className: 'bac-tall' })}
        <div className="bac-zx-mid">
          {renderBacCard(bacBet('bac-tie', '和', 'bac-tie', BAC_ODDS.tie), { label: '和', color: '#16a34a' })}
          {renderBacCard(bacBet('bac-lucky6', '庄幸运6', 'bac-lucky6', BAC_ODDS.lucky6), { label: '庄幸运6', color: '#f59e0b' })}
        </div>
        {renderBacCard(bacBet('bac-player', '闲', 'bac-player', BAC_ODDS.player), { label: '闲', color: '#2563eb', className: 'bac-tall' })}
      </div>
    </div>
  );

  // 对子: 2×2 grid.
  const renderBacDuizi = () => (
    <div className="play-area">
      {renderPlayHelpBar()}
      {renderPlayHelpModal()}
      <div className="betting-grid">
        {renderBacCard(bacBet('bac-banker-pair', '庄对', 'bac-banker-pair', BAC_ODDS.bankerPair), { label: '庄对', color: '#e3342f' })}
        {renderBacCard(bacBet('bac-player-pair', '闲对', 'bac-player-pair', BAC_ODDS.playerPair), { label: '闲对', color: '#2563eb' })}
        {renderBacCard(bacBet('bac-any-pair', '任意对子', 'bac-any-pair', BAC_ODDS.anyPair), { label: '任意对子', color: '#16a34a' })}
        {renderBacCard(bacBet('bac-perfect-pair', '完美对子', 'bac-perfect-pair', BAC_ODDS.perfectPair), { label: '完美对子', color: '#db2777' })}
      </div>
    </div>
  );

  // 两面: 闲单/闲双 · 庄单/庄双 (2×2 grid).
  const renderBacLiangMian = () => (
    <div className="play-area">
      {renderPlayHelpBar()}
      {renderPlayHelpModal()}
      <div className="betting-grid">
        {renderBacCard(bacBet('bac-player-odd', '闲单', 'bac-player-odd', BAC_ODDS.twoSided), { label: '闲单', color: '#2563eb' })}
        {renderBacCard(bacBet('bac-player-even', '闲双', 'bac-player-even', BAC_ODDS.twoSided), { label: '闲双', color: '#2563eb' })}
        {renderBacCard(bacBet('bac-banker-odd', '庄单', 'bac-banker-odd', BAC_ODDS.twoSided), { label: '庄单', color: '#e3342f' })}
        {renderBacCard(bacBet('bac-banker-even', '庄双', 'bac-banker-even', BAC_ODDS.twoSided), { label: '庄双', color: '#e3342f' })}
      </div>
    </div>
  );

  // ============================================================
  // ===================== 鱼虾蟹 (FHC) Tabs ====================
  // ============================================================

  // Shared 6-symbol board for 单殿 / 全围 (2 per row via .betting-grid).
  const renderFhcBoard = ({ tabId, type, positionName, odds, oddsLabel }) => (
    <div className="play-area">
      {renderPlayHelpBar()}
      {renderPlayHelpModal()}
      <div className="betting-grid">
        {FHC_SYMBOLS.map((sym) => {
          const betId = `${type}-${sym.name}`;
          const isSelected = isBetSelected(betId);
          const betObj = {
            id: betId,
            tabId,
            positionId: sym.id.toString(),
            positionName,
            betName: sym.name,
            odds,
            displayTitle: `${positionName}-${sym.name}`,
            type,
          };
          return (
            <button
              key={betId}
              type="button"
              className={`bet-button fhc-bet-button ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleBet(betObj)}
              disabled={isClosed}
            >
              <span className="fhc-symbol-wrap">
                <img className="fhc-symbol-img" src={fhcSymbolSrc(sym.name)} alt={sym.name} />
              </span>
              <span className="bet-button-odds" style={{ color: sym.color }}>{oddsLabel}</span>
              {renderCheckmark(isSelected)}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderFhcSingle = () =>
    renderFhcBoard({
      tabId: 'single',
      type: 'fhc-single',
      positionName: '单殿',
      odds: FHC_ODDS.single,
      oddsLabel: FHC_ODDS.single.toFixed(2),
    });

  const renderFhcAllAround = () =>
    renderFhcBoard({
      tabId: 'all-around',
      type: 'fhc-all-around',
      positionName: '全围',
      odds: FHC_ODDS.allAround,
      oddsLabel: FHC_ODDS.allAround.toFixed(1),
    });

  // ============================================================
  // ===================== 幸运28 (XY28) Tabs ===================
  // ============================================================

  // 大/大单/大双/单 render blue; 小/小单/小双/双 render orange.
  const twoSidedBg = (label) =>
    (label.includes('大') || label === '单') ? '#3b82f6' : '#f59e0b';

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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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

  // Select every number in a 快捷投注 category. Supports multi-selection of categories as unions.
  const handleQuickCategory = (market, cat) => {
    if (isClosed) return;
    leaveQuickMode(market);
    const catKey = market === 'zhengte' ? `zhengte-${zhengtePos}` : market;
    
    const prevCats = selectedLhcCats[catKey] || [];
    const isAlreadySelected = prevCats.includes(cat);
    const nextCats = isAlreadySelected
      ? prevCats.filter((c) => c !== cat)
      : [...prevCats, cat];

    setSelectedLhcCats((prev) => ({
      ...prev,
      [catKey]: nextCats,
    }));

    // Helper to get union of numbers matching selected categories
    const getNumbersForCats = (cats) => {
      const set = new Set();
      cats.forEach((c) => {
        lhcNumbersForCategory(c).forEach((num) => set.add(num));
      });
      return set;
    };

    const prevNums = getNumbersForCats(prevCats);
    const nextNums = getNumbersForCats(nextCats);

    // Newly added numbers: nextNums minus prevNums
    const toAdd = [...nextNums].filter((n) => !prevNums.has(n));
    // Newly removed numbers: prevNums minus nextNums
    const toRemove = [...prevNums].filter((n) => !nextNums.has(n));

    // Toggle newly added numbers on (if not already selected)
    toAdd.forEach((n) => {
      const bet = lhcNumberBet(market, n);
      if (!isBetSelected(bet.id)) {
        onToggleBet(bet);
      }
    });

    // Toggle newly removed numbers off (if currently selected)
    toRemove.forEach((n) => {
      const bet = lhcNumberBet(market, n);
      if (isBetSelected(bet.id)) {
        onToggleBet(bet);
      }
    });
  };

  // Parse the 快捷投注 textarea into bets. Accepts "号码=金额" tokens separated by
  // spaces/commas/semicolons (e.g. "1=10 2=20"). Each valid 号码 carries its own
  // amount so the 购物单 shows the exact number + stake. Later duplicates win.
  const parseQuickBets = (market, text) => {
    const tokens = text.split(/[\s,，;；]+/).filter(Boolean);
    const byNum = new Map();
    tokens.forEach((tok) => {
      const m = tok.match(/^(\d{1,2})=(\d+)$/);
      if (!m) return;
      const num = parseInt(m[1], 10);
      const amount = parseInt(m[2], 10);
      if (num < 1 || num > 49 || amount <= 0) return;
      byNum.set(num, { ...lhcNumberBet(market, num), amount, fromQuick: true });
    });
    return [...byNum.values()];
  };

  // Live 快捷投注 input: parse on every keystroke and make the parsed numbers the
  // sole selection for this market (mutually exclusive with manual number picks).
  const handleQuickTextChange = (market, text) => {
    setQuickText(text);
    if (onSetQuickBets) onSetQuickBets(market, parseQuickBets(market, text));
  };

  // Manual number/category pick: if a 快捷投注 draft is active, abandon it (clear
  // the textarea + its bets) so the two input modes never mix.
  const leaveQuickMode = (market) => {
    if (quickText) {
      setQuickText('');
      if (onSetQuickBets) onSetQuickBets(market, []);
    }
  };

  // The number-points grid (01-49) — colored 波色 ring + odds, selectable.
  const renderLhcNumberGrid = (market) => (
    <div className="lhc-num-grid">
      {Array.from({ length: 49 }, (_, i) => i + 1).map((num) => {
        const betObj = lhcNumberBet(market, num);
        const isSelected = isBetSelected(betObj.id);
        return (
          <button
            key={num}
            type="button"
            className={`bet-button lhc-num-btn ${isSelected ? 'selected' : ''}`}
            onClick={() => { leaveQuickMode(market); onToggleBet(betObj); }}
            disabled={isClosed}
          >
            <img className="lhc-ball" src={lhcBallSrc(num)} alt={num.toString().padStart(2, '0')} />
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
    const catKey = market === 'zhengte' ? `zhengte-${zhengtePos}` : market;
    const activeCats = selectedLhcCats[catKey] || [];

    return (
      <>
        <div className="lhc-quick-cats">
          {LHC_QUICK_CATEGORIES.map((cat) => {
            const catNums = lhcNumbersForCategory(cat);
            const isCatSelectedInState = activeCats.includes(cat);
            const isAllSelectedInGrid = catNums.length > 0 && catNums.every((n) => isBetSelected(lhcNumberBet(market, n).id));
            const isSelected = isCatSelectedInState && isAllSelectedInGrid;

            return (
              <button
                key={cat}
                type="button"
                className={`lhc-quick-cat ${isSelected ? 'active' : ''}`}
                style={waveColor[cat] ? { color: waveColor[cat], fontWeight: 700 } : undefined}
                onClick={() => handleQuickCategory(market, cat)}
                disabled={isClosed}
              >
                {cat}
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
        <div className="lhc-quick-input-row">
          <textarea
            className="lhc-quick-textarea"
            placeholder="快捷投注：按号码=金额的格式，多个用空格分隔。如1=10 2=20"
            value={quickText}
            onChange={(e) => handleQuickTextChange(market, e.target.value)}
            rows={3}
            disabled={isClosed}
          />
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
          const bg = orangeLabels.includes(label) ? '#f59e0b' : '#3b82f6';
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
          const bg = waveBg[label] || (orangeLabels.includes(label) ? '#f59e0b' : '#3b82f6');
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
          const bg = waveBg[opt] || (orangeLabels.includes(opt) ? '#f59e0b' : '#3b82f6');
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
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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

        <div className="accordion-list">
          {/* 快捷投注 抽屉: 分类快选 + 快捷输入 */}
          {renderLhcSection('lhc-quick', '快捷投注', renderLhcQuickContent('tema'))}

          {/* 数字 抽屉: 特码 01-49 点位 */}
          {renderLhcSection('lhc-num', '数字', renderLhcNumberGrid('tema'))}

          {/* 两面 抽屉 */}
          {renderLhcSection('lhc-two', '两面', renderLhcTwoSidedGrid())}
        </div>
      </div>
    );
  };

  // --------- LHC: 正码 tab (快捷投注 / 数字 / 两面 抽屉) ----------
  const renderLhcZhengma = () => {
    return (
      <div className="play-area">
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
        <div className="accordion-list">
          {/* 快捷投注 抽屉 */}
          {renderLhcSection('lhc-zm-quick', '快捷投注', renderLhcQuickContent('zhengma'))}

          {/* 数字 抽屉: 正码 01-49 点位 (赔率 7.46) */}
          {renderLhcSection('lhc-zm-num', '数字', renderLhcNumberGrid('zhengma'))}

          {/* 两面 抽屉: 总和大小/单双 · 总尾大小 · 龙虎 */}
          {renderLhcSection('lhc-zm-two', '两面', renderLhcZhengmaTwoSidedGrid())}
        </div>
      </div>
    );
  };

  // --------- LHC: 正特 tab (特一~特六 位置 + 快捷投注 / 数字 / 两面 抽屉) ----------
  const renderLhcZhengte = () => {
    return (
      <div className="play-area">
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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

        <div className="accordion-list">
          {/* 快捷投注 抽屉 */}
          {renderLhcSection('lhc-zt-quick', '快捷投注', renderLhcQuickContent('zhengte'))}

          {/* 数字 抽屉: 所选位置 01-49 点位 (赔率 47.3) */}
          {renderLhcSection('lhc-zt-num', '数字', renderLhcNumberGrid('zhengte'))}

          {/* 两面 抽屉 */}
          {renderLhcSection('lhc-zt-two', '两面', renderLhcZhengteTwoSidedGrid())}
        </div>
      </div>
    );
  };

  // --------- LHC: 七色波 (7 色波最多的颜色 / 和局) ----------
  const renderLhcQisebo = () => {
    const bgOf = { 红: '#e3342f', 绿: '#16a34a', 蓝: '#2563eb', 和: '#9ca3af' };
    return (
      <div className="play-area">
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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

  // 快选: 随机选出当前类别所需数量的生肖，组成 1 注
  const quickSelectHexiao = () => {
    if (isClosed) return;
    const pool = [...LHC_ZODIACS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picks = pool
      .slice(0, hexiaoCat)
      .sort((a, b) => LHC_ZODIACS.indexOf(a) - LHC_ZODIACS.indexOf(b));
    setHexiaoZodiacs(picks);
    syncHexiao(picks, hexiaoCat);
    addToast?.(`已快选生肖：${picks.join(', ')}`, 'success');
  };

  const renderLhcHexiao = () => {
    const odds = adj(lhcHexiaoOdds(hexiaoCat));
    const M = hexiaoZodiacs.length;
    const noteCount = M >= hexiaoCat ? combinations(hexiaoZodiacs, hexiaoCat).length : 0;
    return (
      <div className="play-area">
        {renderPlayHelpBar(quickSelectHexiao)}
        {renderPlayHelpModal()}
        {/* Collapsible Sub-tab Selection Drawer for Hexiao */}
        <div className="subtab-drawer">
          <div
            className={`accordion-header ${hexiaoDrawerOpen ? 'open' : ''}`}
            onClick={() => setHexiaoDrawerOpen(!hexiaoDrawerOpen)}
          >
            <span>{LHC_HEXIAO_CN[hexiaoCat]}肖</span>
            <i className={`accordion-arrow ${hexiaoDrawerOpen ? 'open' : ''}`} />
          </div>
          {hexiaoDrawerOpen && (
            <div className="accordion-content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
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
            </div>
          )}
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
                {nums.map((n) => (
                  <img key={n} className="lhc-ball" src={lhcBallSrc(n)} alt={n.toString().padStart(2, '0')} />
                ))}
              </div>
              {renderCheckmark(isSelected)}
            </button>
          );
        })}
      </div>
    );
  };

  // Pick `n` distinct 号码 (1-49) at random — used by 快选 for combination games.
  const pickRandomNumbers = (n) => {
    const pool = Array.from({ length: 49 }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, n).sort((a, b) => a - b);
  };

  // --------- LHC: 连码 (选类别 subTab, 再选号码, 自动组合成 C(M, N) 注) ----------
  const buildLianmaBet = (combo, subTabId) => {
    const nums = [...combo].sort((a, b) => a - b);
    const formattedNums = nums.map((n) => n.toString().padStart(2, '0'));
    const subTabName = LIANMA_SUB_TABS.find((t) => t.id === subTabId)?.name || '';
    const odds = LIANMA_ODDS[subTabId] || 9000;
    return {
      id: `lhc-lianma-${subTabId}-${nums.join('')}`,
      tabId: 'lianma',
      positionId: 'lianma',
      positionName: `连码-${subTabName}`,
      betName: formattedNums.join(','),
      nums,
      odds: adj(odds),
      displayTitle: `连码-${subTabName}-${formattedNums.join(' ')}`,
      type: 'lhc-lianma',
    };
  };

  const syncLianma = (selectedNums, subTabId) => {
    selectedBets.forEach((b) => { if (b.type === 'lhc-lianma') onToggleBet(b); });
    const requiredCount = LIANMA_REQUIRED_COUNTS[subTabId];
    if (selectedNums.length >= requiredCount) {
      combinations(selectedNums, requiredCount).forEach((combo) => {
        onToggleBet(buildLianmaBet(combo, subTabId));
      });
    }
  };

  const toggleLianmaNumber = (num) => {
    if (isClosed) return;
    const next = lianmaNumbers.includes(num)
      ? lianmaNumbers.filter((n) => n !== num)
      : [...lianmaNumbers, num];
    setLianmaNumbers(next);
    syncLianma(next, lianmaSubTab);
  };

  const changeLianmaSubTab = (subTabId) => {
    setLianmaSubTab(subTabId);
    syncLianma(lianmaNumbers, subTabId);
  };

  // 快选: randomly pick exactly the 号码 count for one 注 of the current sub-tab.
  const quickSelectLianma = () => {
    if (isClosed) return;
    const picks = pickRandomNumbers(LIANMA_REQUIRED_COUNTS[lianmaSubTab]);
    setLianmaNumbers(picks);
    syncLianma(picks, lianmaSubTab);
    const formatted = picks.map((n) => n.toString().padStart(2, '0')).join(', ');
    addToast?.(`已快选号码：${formatted}`, 'success');
  };

  const renderLhcLianma = () => {
    const requiredCount = LIANMA_REQUIRED_COUNTS[lianmaSubTab];
    const M = lianmaNumbers.length;
    const noteCount = M >= requiredCount ? combinations(lianmaNumbers, requiredCount).length : 0;
    
    // Numbers 01 to 49
    const allNums = Array.from({ length: 49 }, (_, i) => i + 1);

    return (
      <div className="play-area">
        {renderPlayHelpBar(quickSelectLianma)}
        {renderPlayHelpModal()}

        {/* Collapsible Sub-tab Selection Drawer */}
        <div className="subtab-drawer">
          <div
            className={`accordion-header ${lianmaDrawerOpen ? 'open' : ''}`}
            onClick={() => setLianmaDrawerOpen(!lianmaDrawerOpen)}
          >
            <span>{LIANMA_SUB_TABS.find((t) => t.id === lianmaSubTab)?.name}</span>
            <i className={`accordion-arrow ${lianmaDrawerOpen ? 'open' : ''}`} />
          </div>
          {lianmaDrawerOpen && (
            <div className="accordion-content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {LIANMA_SUB_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`lhc-pos-tab ${lianmaSubTab === t.id ? 'active' : ''}`}
                    onClick={() => changeLianmaSubTab(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lhc-hexiao-hint">
          已选 {M} 号码（{LIANMA_SUB_TABS.find((t) => t.id === lianmaSubTab)?.name}，共 {noteCount} 注）
        </div>

        {/* 2-column Grid of Numbers */}
        <div className="betting-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {allNums.map((num) => {
            const isSelected = lianmaNumbers.includes(num);
            const odds = adj(LIANMA_ODDS[lianmaSubTab] || 9000);
            return (
              <button
                key={num}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleLianmaNumber(num)}
                disabled={isClosed}
                style={{ padding: '10px 14px' }}
              >
                <img
                  className="lhc-ball"
                  src={lhcBallSrc(num)}
                  alt={num.toString().padStart(2, '0')}
                  style={{ width: '28px', height: '28px' }}
                />
                <span className="bet-button-odds" style={{ marginLeft: 'auto', fontWeight: '500' }}>
                  {odds}
                </span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --------- LHC: 不中 (选 N不中 subTab, 再选号码, 自动组合成 C(M, N) 注) ----------
  // Win when NONE of the combo's numbers appear in the draw. Mirrors 连码.
  const buildBuzhongBet = (combo, subTabId) => {
    const nums = [...combo].sort((a, b) => a - b);
    const formattedNums = nums.map((n) => n.toString().padStart(2, '0'));
    const subTabName = BUZHONG_SUB_TABS.find((t) => t.id === subTabId)?.name || '';
    const odds = BUZHONG_ODDS[subTabId] || 1;
    return {
      id: `lhc-buzhong-${subTabId}-${nums.join('')}`,
      tabId: 'buzhong',
      positionId: 'buzhong',
      positionName: `不中-${subTabName}`,
      betName: formattedNums.join(','),
      nums,
      odds: adj(odds),
      displayTitle: `不中-${subTabName}-${formattedNums.join(' ')}`,
      type: 'lhc-buzhong',
    };
  };

  const syncBuzhong = (selectedNums, subTabId) => {
    selectedBets.forEach((b) => { if (b.type === 'lhc-buzhong') onToggleBet(b); });
    const requiredCount = BUZHONG_REQUIRED_COUNTS[subTabId];
    if (selectedNums.length >= requiredCount) {
      combinations(selectedNums, requiredCount).forEach((combo) => {
        onToggleBet(buildBuzhongBet(combo, subTabId));
      });
    }
  };

  const toggleBuzhongNumber = (num) => {
    if (isClosed) return;
    const next = buzhongNumbers.includes(num)
      ? buzhongNumbers.filter((n) => n !== num)
      : [...buzhongNumbers, num];
    setBuzhongNumbers(next);
    syncBuzhong(next, buzhongSubTab);
  };

  const changeBuzhongSubTab = (subTabId) => {
    setBuzhongSubTab(subTabId);
    syncBuzhong(buzhongNumbers, subTabId);
  };

  // 快选: randomly pick exactly the 号码 count for one 注 of the current sub-tab.
  const quickSelectBuzhong = () => {
    if (isClosed) return;
    const picks = pickRandomNumbers(BUZHONG_REQUIRED_COUNTS[buzhongSubTab]);
    setBuzhongNumbers(picks);
    syncBuzhong(picks, buzhongSubTab);
    const formatted = picks.map((n) => n.toString().padStart(2, '0')).join(', ');
    addToast?.(`已快选号码：${formatted}`, 'success');
  };

  const renderLhcBuzhong = () => {
    const requiredCount = BUZHONG_REQUIRED_COUNTS[buzhongSubTab];
    const M = buzhongNumbers.length;
    const noteCount = M >= requiredCount ? combinations(buzhongNumbers, requiredCount).length : 0;
    const allNums = Array.from({ length: 49 }, (_, i) => i + 1);

    return (
      <div className="play-area">
        {renderPlayHelpBar(quickSelectBuzhong)}
        {renderPlayHelpModal()}

        {/* Collapsible Sub-tab Selection Drawer */}
        <div className="subtab-drawer">
          <div
            className={`accordion-header ${buzhongDrawerOpen ? 'open' : ''}`}
            onClick={() => setBuzhongDrawerOpen(!buzhongDrawerOpen)}
          >
            <span>{BUZHONG_SUB_TABS.find((t) => t.id === buzhongSubTab)?.name}</span>
            <i className={`accordion-arrow ${buzhongDrawerOpen ? 'open' : ''}`} />
          </div>
          {buzhongDrawerOpen && (
            <div className="accordion-content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {BUZHONG_SUB_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`lhc-pos-tab ${buzhongSubTab === t.id ? 'active' : ''}`}
                    onClick={() => changeBuzhongSubTab(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lhc-hexiao-hint">
          已选 {M} 号码（{BUZHONG_SUB_TABS.find((t) => t.id === buzhongSubTab)?.name}，共 {noteCount} 注）
        </div>

        {/* 2-column Grid of Numbers */}
        <div className="betting-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {allNums.map((num) => {
            const isSelected = buzhongNumbers.includes(num);
            const odds = adj(BUZHONG_ODDS[buzhongSubTab] || 1);
            return (
              <button
                key={num}
                type="button"
                className={`bet-button ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleBuzhongNumber(num)}
                disabled={isClosed}
                style={{ padding: '10px 14px' }}
              >
                <img
                  className="lhc-ball"
                  src={lhcBallSrc(num)}
                  alt={num.toString().padStart(2, '0')}
                  style={{ width: '28px', height: '28px' }}
                />
                <span className="bet-button-odds" style={{ marginLeft: 'auto', fontWeight: '500' }}>
                  {odds}
                </span>
                {renderCheckmark(isSelected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --------- LHC: 生肖/尾数/头数 卡片玩法 (label + odds 头 + 波色号码) ----------
  // Each item = { label, betName, odds, nums }. Win logic lives in settlement.
  const renderLhcCardList = ({ tabId, betType, positionName, items }) => {
    const hasHelp = ['texiao', 'zhengxiao', 'yixiao', 'yixiao-no', 'weishu', 'weishu-no', 'tetoushu', 'teweishu', 'banbo', 'wuxing'].includes(tabId);
    return (
      <div className="play-area">
        {hasHelp && renderPlayHelpBar()}
        {hasHelp && renderPlayHelpModal()}
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
                {nums.map((n) => (
                  <img key={n} className="lhc-ball" src={lhcBallSrc(n)} alt={n.toString().padStart(2, '0')} />
                ))}
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
  const renderLhcZongxiao = () => {
    return (
      <div className="play-area">
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
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
          const bg = betName === '双' ? '#f59e0b' : '#3b82f6';
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
  };

  // Placeholder for LHC play types not yet implemented.
  const renderLhcPlaceholder = (name) => (
    <div className="play-area">
      <div className="lhc-placeholder">「{name}」玩法敬请期待</div>
    </div>
  );

  // ================= 动物运动会 (Animal Olympics) =================
  // One tab per 名次 (冠军…第六名). Top row: pick the animal (1-6) that finishes at
  // this 名次; bottom row: 大小单双 (+ 龙虎 for 冠/亚/季). 长龙 / 游戏玩法 are TBD.
  const renderAnimalPosition = (pos) => {
    const hasDragonTiger = pos.index < 3; // 冠军vs第六名, 亚军vs第五名, 季军vs第四名
    const dsOptions = hasDragonTiger
      ? ['大', '小', '单', '双', '龙', '虎']
      : ['大', '小', '单', '双'];

    return (
      <div className="play-area animal-play">
        {renderPlayHelpBar()}
        {renderPlayHelpModal()}
        <div className="animal-board">
          {/* 猜名次: the 6 animals */}
          <div className="animal-row animal-num-row">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const betId = `animal-${pos.id}-number-${num}`;
              const isSelected = isBetSelected(betId);
              const betObj = {
                id: betId,
                tabId: pos.id,
                positionId: pos.id,
                positionName: pos.name,
                betName: num.toString(),
                odds: ANIMAL_ODDS.number,
                displayTitle: `${pos.name}-${num}`,
                type: 'animal-number',
              };
              return (
                <button
                  key={num}
                  type="button"
                  className={`bet-button animal-cell ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggleBet(betObj)}
                  disabled={isClosed}
                >
                  <span className="animal-ball-wrap">
                    <img className="animal-ball-img" src={animalBallSrc(num)} alt={num} />
                  </span>
                  <span className="animal-cell-odds">{ANIMAL_ODDS.number}</span>
                  {renderCheckmark(isSelected)}
                </button>
              );
            })}
          </div>

          {/* 两面: 大小单双 (+ 龙虎) */}
          <div className="animal-row animal-ds-row">
            {dsOptions.map((opt) => {
              const type = (opt === '龙' || opt === '虎') ? 'animal-dragontiger' : 'animal-twosided';
              const betId = `animal-${pos.id}-${type}-${opt}`;
              const isSelected = isBetSelected(betId);
              const betObj = {
                id: betId,
                tabId: pos.id,
                positionId: pos.id,
                positionName: pos.name,
                betName: opt,
                odds: ANIMAL_ODDS.twoSided,
                displayTitle: `${pos.name}-${opt}`,
                type,
              };
              return (
                <button
                  key={opt}
                  type="button"
                  className={`bet-button animal-cell animal-ds-cell ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggleBet(betObj)}
                  disabled={isClosed}
                >
                  <span className={`animal-ds-pill ${blueSide(opt) ? 'blue' : 'orange'}`}>{opt}</span>
                  <span className="animal-cell-odds">{ANIMAL_ODDS.twoSided}</span>
                  {renderCheckmark(isSelected)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render active content area
  if (gameKind === 'animal') {
    const pos = ANIMAL_POSITIONS.find((p) => p.id === activeTab);
    if (pos) return renderAnimalPosition(pos);
    if (activeTab === 'long-dragon') return renderLongDragon();
    return <div className="play-area">Tab Content Not Found</div>;
  }

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
      case 'lianma':
        return renderLhcLianma();
      case 'buzhong':
        return renderLhcBuzhong();
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

  if (gameKind === 'bac') {
    switch (activeTab) {
      case 'zhuangxian':
        return renderBacZhuangXian();
      case 'duizi':
        return renderBacDuizi();
      case 'liangmian':
        return renderBacLiangMian();
      default:
        return <div className="play-area">Tab Content Not Found</div>;
    }
  }

  if (gameKind === 'fhc') {
    switch (activeTab) {
      case 'single':
        return renderFhcSingle();
      case 'all-around':
        return renderFhcAllAround();
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
