import React, { useState, useEffect, useRef } from 'react';
import {
  SIDEBAR_TABS, PK10_COLORS, ODDS, POSITIONS,
  FFC_SIDEBAR_TABS, FFC_COLORS, FFC_ODDS, FFC_POSITIONS,
  FFC_TRIPLE_GROUPS, classifyFfcTriple,
  K3_SIDEBAR_TABS, K3_ODDS, k3SumBig,
  XY28_SIDEBAR_TABS, XY28_COLORS, XY28_ODDS, xy28SumBig,
  LHC_SIDEBAR_TABS, LHC_TEMA_ODDS, LHC_CN_NUM,
  lhcZodiacOf, lhcIsDomestic, lhcTwoSidedWin, lhcBallSrc, ffcBallSrc, pk10BallSrc,
  lhcZhengmaTwoSidedWin, lhcBanboWin, LHC_WUXING_NUMBERS, lhcZongxiaoWin,
  lhcQiseboResult, LHC_PANKOU, lhcPankouFactor,
  ANIMAL_SIDEBAR_TABS, ANIMAL_POSITIONS, ANIMAL_ODDS, animalBallSrc,
} from './constants/gameData';
import Dice from './components/Dice';
import PlayArea from './components/PlayArea';
import FollowPlanModal from './components/FollowPlanModal';
import Footer from './components/Footer';
import ChipEditModal from './components/ChipEditModal';
import GameDrawer from './components/GameDrawer';
import RightMenuDrawer from './components/RightMenuDrawer';
import UnsettledDetails from './components/UnsettledDetails';
import SettledDetails from './components/SettledDetails';
import DrawHistory from './components/DrawHistory';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import { getLang, setLang, startTraditional } from './i18n';
import RaceAnimation from './components/RaceAnimation';
import FfcAnimation from './components/FfcAnimation';
import K3Animation from './components/K3Animation';
import Xy28Animation from './components/Xy28Animation';
import LhcAnimation from './components/LhcAnimation';
import AnimalAnimation from './components/AnimalAnimation';

// ===== 嵌入参数 (供父项目通过 URL query 传入) =====
// 用法示例: /?embed=1&skin=3
//   embed = 1 / true / yes  -> 嵌入模式: 跳过登录页, 隐藏「退出登录」按钮
//   skin  = 1 / 2 / 3 / 4    -> 进入时的皮肤 (也接受主题 id 本身)
//     1 = light-blue(浅蓝)  2 = deep-blue(深蓝)
//     3 = midnight-blue(午夜蓝)  4 = midnight-purple(午夜紫)
const SKIN_CODE_MAP = {
  '1': 'light-blue',
  '2': 'deep-blue',
  '3': 'midnight-blue',
  '4': 'midnight-purple',
};
const VALID_THEMES = ['light-blue', 'deep-blue', 'midnight-blue', 'midnight-purple'];

// roomid -> 内部游戏 id。父项目可用 /?roomid=1062010 直接打开对应游戏投注页。
const ROOM_ID_MAP = {
  '1062010': 'pk10_1m',   // 一分极速赛车
  '1062020': 'pk10_5m',   // 五分极速赛车
  '1062030': 'pk10_10m',  // 十分极速赛车
  '1070110': 'ap_lhc_1m', // 一分澳门六合彩
  '1070120': 'ap_lhc_5m', // 五分澳门六合彩
  '1070130': 'ap_lhc_10m',// 十分澳门六合彩
  '601010': 'ffc_1m',     // 一分分分彩
  '601020': 'ffc_5m',     // 五分分分彩
  '601030': 'ffc_10m',    // 十分分分彩
  '701010': 'k3_1m',      // 一分快三
  '701020': 'k3_5m',      // 五分快三
  '701030': 'k3_10m',     // 十分快三
  '1069010': 'xy28_1m',   // 一分幸运28
  '1069020': 'xy28_5m',   // 五分幸运28
  '1069030': 'xy28_10m',  // 十分幸运28
  '1001010': 'animal_1m', // 一分动物运动会
  '1001020': 'animal_5m', // 五分动物运动会
  '1001030': 'animal_10m',// 十分动物运动会
};

const getEmbedParams = () => {
  try {
    const p = new URLSearchParams(window.location.search);
    const embedRaw = (p.get('embed') || '').toLowerCase();
    const embedded = embedRaw === '1' || embedRaw === 'true' || embedRaw === 'yes';
    const skinRaw = (p.get('skin') || '').toLowerCase();
    const skin = SKIN_CODE_MAP[skinRaw] || (VALID_THEMES.includes(skinRaw) ? skinRaw : null);
    const gameId = ROOM_ID_MAP[(p.get('roomid') || '').trim()] || null;
    return { embedded, skin, gameId };
  } catch {
    return { embedded: false, skin: null, gameId: null };
  }
};

// Parsed once at load; the query string doesn't change during a session.
const EMBED = getEmbedParams();

// Helper to generate a random PK10 draw (permutation of 1-10)
const generateRandomDraw = () => {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
};

// ===== 计划中心 自动跟投 (auto-follow) helpers =====
// Per-kind prediction shape. balls kinds pick N distinct 号码 from a pool;
// twoside kinds pick a single 大小/单双 side.
const PLAN_KIND_META = {
  pk10: { predictKind: 'balls', min: 1, max: 10 },
  ffc: { predictKind: 'balls', min: 0, max: 9 },
  k3: { predictKind: 'twoside' },
  lhc: { predictKind: 'twoside' },
  xy28: { predictKind: 'twoside' },
};
const FOLLOW_OPPOSITE = { 大: '小', 小: '大', 单: '双', 双: '单' };

// Pick `count` distinct numbers in [min,max], ascending.
const genFollowBalls = (count, min, max) => {
  const pool = [];
  for (let n = min; n <= max; n++) pool.push(n);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
};

// Fresh prediction for one round. Returns { predictKind, predicted } where
// predicted is a number[] (balls) or a single-side string[] (twoside).
const genFollowPrediction = (kind, cond1, ballCount, cond2 = '') => {
  const meta = PLAN_KIND_META[kind] || PLAN_KIND_META.pk10;
  if (meta.predictKind === 'balls') {
    return { predictKind: 'balls', predicted: genFollowBalls(ballCount, meta.min, meta.max) };
  }
  // 大小/单双：xy28 由 cond1 决定；lhc/k3 由 cond2（特码单双/和值单双）决定
  const isOddEven = cond1 === '单双计划' || (cond2 || '').includes('单双');
  const opts = isOddEven ? ['单', '双'] : ['大', '小'];
  return { predictKind: 'twoside', predicted: [opts[Math.floor(Math.random() * opts.length)]] };
};

// Resolve the actual bet targets for 正投('follow') / 反投('reverse').
const resolveFollowTargets = (kind, predicted, mode) => {
  const meta = PLAN_KIND_META[kind] || PLAN_KIND_META.pk10;
  if (meta.predictKind === 'balls') {
    if (mode === 'follow') return predicted.map(String);
    const pool = [];
    for (let n = meta.min; n <= meta.max; n++) pool.push(n);
    return pool.filter((n) => !predicted.includes(n)).map(String);
  }
  const side = predicted[0];
  return [mode === 'follow' ? side : (FOLLOW_OPPOSITE[side] || side)];
};

// Generates mock draw history (20 rounds)
// Seeding the latest two draws to match Screenshot 1 and Screenshot 4
const generateMockHistory = (startIssue) => {
  const history = [];
  
  // Seed the last two draws specifically
  // 00957: 4, 7, 2, 5, 6, 8, 10, 1, 3, 9
  // 00956: 5, 8, 9, 3, 10, 6, 7, 1, 4, 2
  history.push({
    issue: (startIssue - 1).toString().padStart(5, '0'),
    numbers: [4, 7, 2, 5, 6, 8, 10, 1, 3, 9],
    winLoss: 21450.12
  });
  
  history.push({
    issue: (startIssue - 2).toString().padStart(5, '0'),
    numbers: [5, 8, 9, 3, 10, 6, 7, 1, 4, 2],
    winLoss: -391568.00
  });

  // Generate the rest randomly
  for (let i = 3; i <= 20; i++) {
    const issueNum = (startIssue - i).toString().padStart(5, '0');
    // Generate some interesting mock win/loss results
    const isWin = Math.random() > 0.4;
    const amount = isWin 
      ? parseFloat((Math.random() * 100000).toFixed(2)) 
      : -parseFloat((Math.random() * 200000).toFixed(2));
    const winLoss = Math.random() > 0.8 ? 0.00 : amount;
    
    history.push({
      issue: issueNum,
      numbers: generateRandomDraw(),
      winLoss: winLoss
    });
  }

  return history;
};

// Helper to generate a random FFC draw (5 digits, each 0-9)
const generateFfcDraw = () => Array.from({ length: 5 }, () => Math.floor(Math.random() * 10));

// Generates mock FFC draw history. Seeds the latest draw to match the screenshots.
const generateFfcMockHistory = (startIssue) => {
  const history = [];

  // Seed latest draw: 60572期 -> 7,0,2,3,5
  history.push({
    issue: (startIssue - 1).toString(),
    numbers: [7, 0, 2, 3, 5],
    winLoss: 0
  });

  for (let i = 2; i <= 20; i++) {
    history.push({
      issue: (startIssue - i).toString(),
      numbers: generateFfcDraw(),
      winLoss: 0
    });
  }
  return history;
};

// Helper to generate a random K3 draw (3 dice, each 1-6)
const generateK3Draw = () => Array.from({ length: 3 }, () => Math.floor(Math.random() * 6) + 1);

// Generates mock K3 draw history. Seeds the latest draw to match the screenshots.
const generateK3MockHistory = (startIssue) => {
  const history = [];

  // Seed latest draw: 60833期 -> 1,3,3
  history.push({
    issue: (startIssue - 1).toString(),
    numbers: [1, 3, 3],
    winLoss: 0
  });

  for (let i = 2; i <= 20; i++) {
    history.push({
      issue: (startIssue - i).toString(),
      numbers: generateK3Draw(),
      winLoss: 0
    });
  }
  return history;
};

// Helper to generate a random XY28 draw (3 balls, each 0-9)
const generateXy28Draw = () => Array.from({ length: 3 }, () => Math.floor(Math.random() * 10));

// Generates mock XY28 draw history. Seeds the latest draw to match the screenshots.
const generateXy28MockHistory = (startIssue) => {
  const history = [];

  // Seed latest draw: 60935期 -> 3,8,8 (总和 19)
  history.push({
    issue: (startIssue - 1).toString(),
    numbers: [3, 8, 8],
    winLoss: 0
  });

  for (let i = 2; i <= 20; i++) {
    history.push({
      issue: (startIssue - i).toString(),
      numbers: generateXy28Draw(),
      winLoss: 0
    });
  }
  return history;
};

// Helper to generate a random LHC draw: 6 正码 + 1 特码 (index 6), all unique from 1-49.
const generateLhcDraw = () => {
  const pool = Array.from({ length: 49 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 7); // [0..5] = 正码 (draw order), [6] = 特码
};

// Generates mock LHC draw history. Seeds the latest draw to match the screenshots.
const generateLhcMockHistory = (startIssue) => {
  const history = [];

  // Seed latest draw: 26175期 -> 07 19 30 29 28 25 + 26 (特码)
  history.push({
    issue: (startIssue - 1).toString(),
    numbers: [7, 19, 30, 29, 28, 25, 26],
    winLoss: 0
  });

  for (let i = 2; i <= 20; i++) {
    history.push({
      issue: (startIssue - i).toString(),
      numbers: generateLhcDraw(),
      winLoss: 0
    });
  }
  return history;
};

// Helper to generate a random 动物运动会 draw (permutation of 1-6).
const generateAnimalDraw = () => {
  const nums = [1, 2, 3, 4, 5, 6];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
};

// Generates mock 动物运动会 draw history. Seeds the latest draw to a fixed order.
const generateAnimalMockHistory = (startIssue) => {
  const history = [];
  history.push({
    issue: (startIssue - 1).toString(),
    numbers: [3, 1, 5, 2, 6, 4],
    winLoss: 0
  });
  for (let i = 2; i <= 20; i++) {
    history.push({
      issue: (startIssue - i).toString(),
      numbers: generateAnimalDraw(),
      winLoss: 0
    });
  }
  return history;
};

export default function App() {
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('pk10_balance');
    return saved ? parseInt(saved) : 110000;
  });

  // roomid URL param picks the entry game (used when embedded in a parent site).
  const [activeGameId, setActiveGameId] = useState(EMBED.gameId || 'ap_lhc_1m');
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  // 六合彩 盘口 (A~D): scales all LHC odds. The play content is identical.
  const [lhcPankou, setLhcPankou] = useState('A');
  const [isPankouOpen, setIsPankouOpen] = useState(false);
  const [gamesState, setGamesState] = useState({
    pk10_1m: {
      kind: 'pk10',
      timeLeft: 48,
      maxTime: 60,
      currentIssue: 958,
      history: generateMockHistory(958)
    },
    pk10_5m: {
      kind: 'pk10',
      timeLeft: 248,
      maxTime: 300,
      currentIssue: 192,
      history: generateMockHistory(192)
    },
    pk10_10m: {
      kind: 'pk10',
      timeLeft: 548,
      maxTime: 600,
      currentIssue: 96,
      history: generateMockHistory(96)
    },
    animal_1m: {
      kind: 'animal',
      timeLeft: 48,
      maxTime: 60,
      currentIssue: 60421,
      history: generateAnimalMockHistory(60421)
    },
    animal_5m: {
      kind: 'animal',
      timeLeft: 248,
      maxTime: 300,
      currentIssue: 12088,
      history: generateAnimalMockHistory(12088)
    },
    animal_10m: {
      kind: 'animal',
      timeLeft: 548,
      maxTime: 600,
      currentIssue: 6044,
      history: generateAnimalMockHistory(6044)
    },
    ffc_1m: {
      kind: 'ffc',
      timeLeft: 29,
      maxTime: 60,
      currentIssue: 60573,
      history: generateFfcMockHistory(60573)
    },
    ffc_5m: {
      kind: 'ffc',
      timeLeft: 248,
      maxTime: 300,
      currentIssue: 12114,
      history: generateFfcMockHistory(12114)
    },
    ffc_10m: {
      kind: 'ffc',
      timeLeft: 548,
      maxTime: 600,
      currentIssue: 6057,
      history: generateFfcMockHistory(6057)
    },
    k3_1m: {
      kind: 'k3',
      timeLeft: 34,
      maxTime: 60,
      currentIssue: 60834,
      history: generateK3MockHistory(60834)
    },
    k3_5m: {
      kind: 'k3',
      timeLeft: 248,
      maxTime: 300,
      currentIssue: 12166,
      history: generateK3MockHistory(12166)
    },
    k3_10m: {
      kind: 'k3',
      timeLeft: 548,
      maxTime: 600,
      currentIssue: 6083,
      history: generateK3MockHistory(6083)
    },
    xy28_1m: {
      kind: 'xy28',
      timeLeft: 48,
      maxTime: 60,
      currentIssue: 60936,
      history: generateXy28MockHistory(60936)
    },
    xy28_5m: {
      kind: 'xy28',
      timeLeft: 248,
      maxTime: 300,
      currentIssue: 12190,
      history: generateXy28MockHistory(12190)
    },
    xy28_10m: {
      kind: 'xy28',
      timeLeft: 548,
      maxTime: 600,
      currentIssue: 6096,
      history: generateXy28MockHistory(6096)
    },
    ap_lhc_1m: {
      kind: 'lhc',
      timeLeft: 45,
      maxTime: 60,
      currentIssue: 26176,
      history: generateLhcMockHistory(26176)
    },
    ap_lhc_5m: {
      kind: 'lhc',
      timeLeft: 248,
      maxTime: 300,
      currentIssue: 5235,
      history: generateLhcMockHistory(5235)
    },
    ap_lhc_10m: {
      kind: 'lhc',
      timeLeft: 548,
      maxTime: 600,
      currentIssue: 2617,
      history: generateLhcMockHistory(2617)
    }
  });

  const activeGame = gamesState[activeGameId] || gamesState['pk10_1m'];
  const gameKind = activeGame.kind || 'pk10';
  const timeLeft = activeGame.timeLeft;
  const currentIssue = activeGame.currentIssue;
  const history = activeGame.history;

  // Per-kind helpers
  const COLORS = gameKind === 'ffc'
    ? FFC_COLORS
    : gameKind === 'xy28'
      ? XY28_COLORS
      : PK10_COLORS;
  const sidebarTabs = gameKind === 'ffc'
    ? FFC_SIDEBAR_TABS
    : gameKind === 'k3'
      ? K3_SIDEBAR_TABS
      : gameKind === 'xy28'
        ? XY28_SIDEBAR_TABS
        : gameKind === 'lhc'
          ? LHC_SIDEBAR_TABS
          : gameKind === 'animal'
            ? ANIMAL_SIDEBAR_TABS
            : SIDEBAR_TABS;
  const gameName = (id) => {
    switch (id) {
      case 'pk10_1m': return '一分极速赛车';
      case 'pk10_5m': return '五分极速赛车';
      case 'pk10_10m': return '十分极速赛车';
      case 'animal_1m': return '一分动物运动会';
      case 'animal_5m': return '五分动物运动会';
      case 'animal_10m': return '十分动物运动会';
      case 'ffc_1m': return '一分分分彩';
      case 'ffc_5m': return '五分分分彩';
      case 'ffc_10m': return '十分分分彩';
      case 'k3_1m': return '一分快三';
      case 'k3_5m': return '五分快三';
      case 'k3_10m': return '十分快三';
      case 'xy28_1m': return '一分幸运28';
      case 'xy28_5m': return '五分幸运28';
      case 'xy28_10m': return '十分幸运28';
      case 'ap_lhc_1m': return '一分澳门六合彩';
      case 'ap_lhc_5m': return '五分澳门六合彩';
      case 'ap_lhc_10m': return '十分澳门六合彩';
      default: return '极速赛车';
    }
  };

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('betting'); // 'betting', 'unsettled', 'settled', 'history', 'settings'
  // 跟单计划 (follow-plan) modal, opened from the 长龙 rail.
  const [isFollowPlanOpen, setIsFollowPlanOpen] = useState(false);
  // Embedded mode enters straight into the betting page (no login screen).
  const [loggedIn, setLoggedIn] = useState(EMBED.embedded);

  const handleLogout = () => {
    setIsRightDrawerOpen(false);
    setIsDrawerOpen(false);
    setCurrentPage('betting');
    setLoggedIn(false);
  };
  const [theme, setTheme] = useState(() => {
    // URL skin param wins on entry (used when embedded in a parent site).
    if (EMBED.skin) return EMBED.skin;
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('appTheme') : null;
    // 新用户默认浅蓝皮肤
    return saved === 'light-blue' || saved === 'deep-blue' || saved === 'midnight-blue' || saved === 'midnight-purple' ? saved : 'light-blue';
  });

  // Apply the selected theme to the document root and persist it
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('appTheme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  // 跟单计划 feature toggle (设置里可开关，默认关闭)。关闭时隐藏左侧「跟单计划」
  // tab 与右侧菜单的「计划中心」入口。
  const [followPlanEnabled, setFollowPlanEnabled] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('followPlanEnabled') : null;
    return saved === 'true';
  });
  useEffect(() => {
    try {
      localStorage.setItem('followPlanEnabled', String(followPlanEnabled));
    } catch {
      // ignore storage errors
    }
    // 关闭功能时顺手收起可能已打开的跟单计划弹窗
    if (!followPlanEnabled) setIsFollowPlanOpen(false);
  }, [followPlanEnabled]);

  // Language: app is authored in Simplified; convert to Traditional at runtime
  // when 繁体中文 is selected. Switching language reloads to apply cleanly.
  const [lang] = useState(getLang);
  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === 'zh-TW') {
      return startTraditional(document.body);
    }
  }, [lang]);

  const handleChangeLang = (nextLang) => {
    if (nextLang === lang) return;
    setLang(nextLang);
    window.location.reload();
  };
  // Match the entry game's default tab: 快捷 only exists for PK10, 动物运动会 opens
  // on 冠军(p1), everything else on 长龙. Keeps a roomid deep-link on a valid tab.
  const [activeTab, setActiveTab] = useState(() => {
    const g = EMBED.gameId || 'ap_lhc_1m';
    if (g.startsWith('pk10')) return 'shortcut';
    if (g.startsWith('animal')) return 'p1';
    return 'long-dragon';
  });
  const [selectedShortcutPositions, setSelectedShortcutPositions] = useState([]);
  const [selectedShortcutOptions, setSelectedShortcutOptions] = useState([]);
  const [nonShortcutSelectedBets, setNonShortcutSelectedBets] = useState([]);
  // Bumped whenever selections are cleared (重置 / 投注 / 封盘 / 切换游戏) so children
  // (e.g. PlayArea's 快捷投注 textarea) can reset their own local input state.
  const [clearNonce, setClearNonce] = useState(0);
  const [placedBets, setPlacedBets] = useState([]);
  const [settledBets, setSettledBets] = useState([]);
  // 计划中心 自动跟投 plans. Each auto-bets one round per real draw of its game;
  // its bets live in placedBets/settledBets (tagged planId) so they stay
  // consistent with the betting page, 未结/已结 and 报表.
  const [followPlans, setFollowPlans] = useState([]);
  
  // Custom chip options (can be edited by the user)
  const [chipValues, setChipValues] = useState([10, 20, 40, 60, 100]);
  // 编辑快捷金额弹窗（投注页 footer 与 自动跟投 共用）
  const [isChipEditOpen, setIsChipEditOpen] = useState(false);
  const [betAmount, setBetAmount] = useState('10'); // Default bet amount is 10

  // Derived selected bets in Shortcut tab dynamically
  const shortcutBets = React.useMemo(() => {
    const bets = [];
    selectedShortcutPositions.forEach(posId => {
      const posObj = POSITIONS.find(p => p.id === posId);
      const positionName = posObj ? posObj.name : '';
      
      selectedShortcutOptions.forEach(opt => {
        const dashIdx = opt.indexOf('-');
        const type = opt.substring(0, dashIdx);
        const val = opt.substring(dashIdx + 1);
        const odds = type === 'number' ? ODDS.number : ODDS.twoSided;
        bets.push({
          id: `position-${posId}-${type}-${val}`,
          tabId: 'shortcut',
          positionId: posId,
          positionName: positionName,
          betName: val,
          odds: odds,
          displayTitle: `${positionName}-${val}`,
          type: type
        });
      });
    });
    return bets;
  }, [selectedShortcutPositions, selectedShortcutOptions]);

  // Combined selected bets
  const selectedBets = React.useMemo(() => {
    if (activeTab === 'shortcut') {
      return shortcutBets;
    }
    return nonShortcutSelectedBets.filter(b => b.tabId === activeTab);
  }, [nonShortcutSelectedBets, shortcutBets, activeTab]);

  // Footer 下注金额 total: 快捷投注 bets carry their own amount; everything else
  // uses the shared 投注金额 from the footer input.
  const selectedBetsTotal = React.useMemo(() => {
    const amt = parseInt(betAmount) || 0;
    return selectedBets.reduce((sum, b) => sum + (b.amount != null ? b.amount : amt), 0);
  }, [selectedBets, betAmount]);

  // Confirmation modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmBets, setConfirmBets] = useState([]);
  // The game the confirmation modal is placing bets on. Normally the active game,
  // but 计划中心 跟投/反投 can target a *different* game (independent game center);
  // those bets still settle on that game's own draw via placedBets[].gameId.
  const [confirmGameId, setConfirmGameId] = useState(null);
  const [bulkAmount, setBulkAmount] = useState('10');
  // 设置项「投注确认金额」：投注确认弹窗批量修改行的默认模式（默认「修改倍数」）
  const [confirmBulkDefault, setConfirmBulkDefault] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('confirmBulkDefault') : null;
    return saved === 'amount' || saved === 'multiplier' ? saved : 'multiplier';
  });
  useEffect(() => {
    localStorage.setItem('confirmBulkDefault', confirmBulkDefault);
  }, [confirmBulkDefault]);
  // 批量修改行的模式：'amount' 修改金额（绝对值）/ 'multiplier' 修改倍数（基础额×倍数）
  const [bulkMode, setBulkMode] = useState('amount');
  // 快捷倍数（可编辑，样式复用编辑快捷金额弹窗）
  const [multiplierValues, setMultiplierValues] = useState([1, 2, 5, 10, 20]);
  const [activeMultiplier, setActiveMultiplier] = useState(null);
  const [isMultiplierEditOpen, setIsMultiplierEditOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Ref for timer interval
  const timerRef = useRef(null);

  // Ref to keep placedBets fresh for the background timer
  const placedBetsRef = useRef(placedBets);
  useEffect(() => {
    placedBetsRef.current = placedBets;
  }, [placedBets]);

  // Ref mirror of gamesState so the timer can read the latest state without
  // generating draws inside a setState updater (StrictMode double-invokes
  // updaters, which would otherwise produce two different draws per round).
  const gamesStateRef = useRef(gamesState);
  useEffect(() => {
    gamesStateRef.current = gamesState;
  }, [gamesState]);

  // Refs so the background draw timer can read the latest plans / balance
  // without stale closures when it auto-settles and re-places follow rounds.
  const followPlansRef = useRef(followPlans);
  useEffect(() => {
    followPlansRef.current = followPlans;
  }, [followPlans]);
  const balanceRef = useRef(balance);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);
  // settleFollowPlans is defined further down but called by processGameDraw
  // (also above). Bridge them through a ref to avoid a forward reference.
  const settleFollowPlansRef = useRef(null);

  // Sync balance to localStorage
  useEffect(() => {
    localStorage.setItem('pk10_balance', balance.toString());
  }, [balance]);

  // Toast trigger helper
  const addToast = (message, type = 'info') => {
    // Combine the timestamp with a random suffix so toasts fired in the same
    // millisecond (e.g. on game switch) don't collide on their React key.
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Circular badge icon shown at the left of a toast (check / cross / info).
  const renderToastIcon = (type) => {
    if (type === 'success') {
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="currentColor" />
          <path d="M7 12.5l3.2 3.2L17 8.8" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (type === 'error') {
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="currentColor" />
          <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <path d="M12 11v5.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="7.6" r="1.3" fill="#ffffff" />
      </svg>
    );
  };

  const handleSelectGame = (game) => {
    if (gamesState[game.id]) {
      setActiveGameId(game.id);
      clearSelections();
      setActiveTab(defaultTabFor(game.id));
      setIsHistoryDropdownOpen(false);
    } else {
      addToast(`您已成功切换到: ${game.name} (暂未开放投注，仅展示玩法)`, 'info');
    }
    setIsDrawerOpen(false);
  };

  // Check if betting is closed. PK10 locks 15s before draw; FFC locks 10s
  // before the draw — that 封盘 window is when the draw animation spins.
  const lockSeconds = gameKind === 'ffc' ? 10 : gameKind === 'k3' ? 10 : gameKind === 'xy28' ? 10 : gameKind === 'lhc' ? 10 : 15;
  // 动物运动会 opens on 冠军 (长龙 / 游戏玩法 are placeholders for now); everything
  // else opens on 长龙.
  const defaultTabFor = (id) => (gamesState[id]?.kind === 'animal' ? 'p1' : 'long-dragon');
  const isClosed = timeLeft <= lockSeconds;

  const clearSelections = () => {
    setNonShortcutSelectedBets([]);
    setSelectedShortcutOptions([]);
    setClearNonce(n => n + 1);
  };

  // Replace all bets belonging to a single tab (used by 快捷投注 live input, which
  // owns its tab's selection and is mutually exclusive with manual number picks).
  const handleSetQuickBets = (tabId, bets) => {
    if (isClosed) return;
    setNonShortcutSelectedBets(prev => [
      ...prev.filter(b => b.tabId !== tabId),
      ...bets,
    ]);
  };

  // Reset selection when the *active* game's closed period starts. A confirmation
  // modal targeting another game (计划中心 跟投/反投) is left alone — its cutoff is
  // that game's, not the active one's.
  useEffect(() => {
    if (!isClosed) return;
    const confirmForActive = isConfirmModalOpen && (confirmGameId ?? activeGameId) === activeGameId;
    if (selectedBets.length > 0 || confirmForActive) {
      setTimeout(() => {
        clearSelections();
        if (confirmForActive) {
          setIsConfirmModalOpen(false);
          setConfirmBets([]);
          setConfirmGameId(null);
        }
        addToast('本期投注已截止，进入封盘时间', 'error');
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClosed, selectedBets, isConfirmModalOpen]);

  const processGameDraw = (gameId, gameName, drawNumbers, drawIssueStr) => {
    // Check placed bets for this game
    const currentBets = placedBetsRef.current.filter(b => b.gameId === gameId);
    
    let totalWinnings = 0;
    let totalBetAmount = 0;
    let winLoss = 0;
    let winningDetails = [];

    if (currentBets.length > 0) {
      const processedSettled = [];
      currentBets.forEach(bet => {
        totalBetAmount += bet.amount;
        let isWin = false;
        // 正肖 pays per matching 正码 — captured here, applied to winAmt below.
        let zhengxiaoHits = 0;
        // 和局 (七色波 平手 / 合肖 49): the stake is refunded (push, net 0).
        let isPush = false;

        if (bet.type && bet.type.startsWith('ffc-')) {
          // ===== 分分彩 settlement =====
          if (bet.type === 'ffc-number') {
            const pos = FFC_POSITIONS.find(p => p.id === bet.positionId);
            if (pos) isWin = drawNumbers[pos.index].toString() === bet.betName;
          } else if (bet.type === 'ffc-twosided') {
            let value;
            if (bet.positionId === 'sum') {
              value = drawNumbers.reduce((a, b) => a + b, 0); // 0-45
              if (bet.betName === '大') isWin = value >= 23;
              else if (bet.betName === '小') isWin = value <= 22;
              else if (bet.betName === '单') isWin = value % 2 !== 0;
              else if (bet.betName === '双') isWin = value % 2 === 0;
            } else {
              const pos = FFC_POSITIONS.find(p => p.id === bet.positionId);
              if (pos) {
                value = drawNumbers[pos.index]; // 0-9
                if (bet.betName === '大') isWin = value >= 5;
                else if (bet.betName === '小') isWin = value <= 4;
                else if (bet.betName === '单') isWin = value % 2 !== 0;
                else if (bet.betName === '双') isWin = value % 2 === 0;
              }
            }
          } else if (bet.type === 'ffc-dt') {
            // 龙虎和: compare 第1球 vs 第5球
            const first = drawNumbers[0];
            const last = drawNumbers[4];
            if (bet.betName === '龙') isWin = first > last;
            else if (bet.betName === '虎') isWin = first < last;
            else if (bet.betName === '和') isWin = first === last;
          } else if (bet.type === 'ffc-triple') {
            const group = FFC_TRIPLE_GROUPS.find(g => g.id === bet.positionId);
            if (group) {
              const [i, j, k] = group.indices;
              const category = classifyFfcTriple(drawNumbers[i], drawNumbers[j], drawNumbers[k]);
              isWin = category === bet.betName;
            }
          }
        } else if (bet.type && bet.type.startsWith('k3-')) {
          // ===== 快三 settlement (drawNumbers = 3 dice) =====
          const counts = {};
          drawNumbers.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
          const sum = drawNumbers.reduce((a, b) => a + b, 0);

          if (bet.type === 'k3-army') {
            // 三军: chosen number appears on at least one die
            isWin = (counts[parseInt(bet.betName)] || 0) >= 1;
          } else if (bet.type === 'k3-short') {
            // 短牌 (二同号): chosen number appears on at least two dice
            isWin = (counts[parseInt(bet.betName)] || 0) >= 2;
          } else if (bet.type === 'k3-long') {
            // 长牌 (二不同号): both chosen distinct numbers appear
            const a = parseInt(bet.betName[0]);
            const b = parseInt(bet.betName[1]);
            isWin = (counts[a] || 0) >= 1 && (counts[b] || 0) >= 1;
          } else if (bet.type === 'k3-triple') {
            // 全骰: specific triple
            const n = parseInt(bet.betName);
            isWin = (counts[n] || 0) === 3;
          } else if (bet.type === 'k3-anytriple') {
            // 全骰: any triple
            isWin = Object.keys(counts).length === 1;
          } else if (bet.type === 'k3-sum-twosided') {
            // 和值 大/小/单/双
            if (bet.betName === '大') isWin = k3SumBig(sum);
            else if (bet.betName === '小') isWin = !k3SumBig(sum);
            else if (bet.betName === '单') isWin = sum % 2 !== 0;
            else if (bet.betName === '双') isWin = sum % 2 === 0;
          } else if (bet.type === 'k3-sum-number') {
            // 和值: specific sum value
            isWin = sum === parseInt(bet.betName);
          } else if (bet.type === 'k3-two-same') {
            // 二同号: exactly two dice = pair value, one die = single value
            const pair = parseInt(bet.betName[0]);
            const single = parseInt(bet.betName[1]);
            isWin = (counts[pair] || 0) === 2 && (counts[single] || 0) === 1;
          } else if (bet.type === 'k3-three-diff') {
            // 三不同: the three dice are exactly these three distinct values
            const want = bet.betName.split('').map(Number).sort((x, y) => x - y);
            const got = [...drawNumbers].sort((x, y) => x - y);
            isWin = want[0] === got[0] && want[1] === got[1] && want[2] === got[2];
          }
        } else if (bet.type && bet.type.startsWith('xy28-')) {
          // ===== 幸运28 settlement (drawNumbers = 3 balls, each 0-9) =====
          const sum = drawNumbers.reduce((a, b) => a + b, 0); // 0-27
          const isBig = xy28SumBig(sum);                       // 大: sum>=14
          const isOdd = sum % 2 !== 0;

          if (bet.type === 'xy28-sum-number') {
            isWin = sum === parseInt(bet.betName);
          } else if (bet.type === 'xy28-sum-twosided') {
            switch (bet.betName) {
              case '大': isWin = isBig; break;
              case '小': isWin = !isBig; break;
              case '单': isWin = isOdd; break;
              case '双': isWin = !isOdd; break;
              case '大单': isWin = isBig && isOdd; break;
              case '小单': isWin = !isBig && isOdd; break;
              case '大双': isWin = isBig && !isOdd; break;
              case '小双': isWin = !isBig && !isOdd; break;
              default: break;
            }
          } else if (bet.type === 'xy28-side') {
            // 边: 总和 0-9 或 18-27; 中: 10-17; 大边: 18-27; 小边: 0-9
            switch (bet.betName) {
              case '边': isWin = sum <= 9 || sum >= 18; break;
              case '中': isWin = sum >= 10 && sum <= 17; break;
              case '大边': isWin = sum >= 18; break;
              case '小边': isWin = sum <= 9; break;
              default: break;
            }
          } else if (bet.type === 'xy28-dtl') {
            // 龙虎豹: 总和 mod 3 (龙=0, 虎=1, 豹=2)
            const r = sum % 3;
            if (bet.betName === '龙') isWin = r === 0;
            else if (bet.betName === '虎') isWin = r === 1;
            else if (bet.betName === '豹') isWin = r === 2;
          } else if (bet.type === 'xy28-extreme') {
            // 极值: 极大 (22-27) / 极小 (0-5)
            if (bet.betName === '极大') isWin = sum >= 22;
            else if (bet.betName === '极小') isWin = sum <= 5;
          } else if (bet.type === 'xy28-threeball') {
            // 三球: 顺子 / 豹子 / 对子 (classifyFfcTriple handles wrap-around straights)
            const category = classifyFfcTriple(drawNumbers[0], drawNumbers[1], drawNumbers[2]);
            isWin = category === bet.betName;
          } else if (bet.type === 'xy28-tail-number') {
            isWin = (sum % 10) === parseInt(bet.betName);
          } else if (bet.type === 'xy28-tail-twosided') {
            const tail = sum % 10;
            const tailBig = tail >= 5;
            const tailOdd = tail % 2 !== 0;
            switch (bet.betName) {
              case '大': isWin = tailBig; break;
              case '小': isWin = !tailBig; break;
              case '单': isWin = tailOdd; break;
              case '双': isWin = !tailOdd; break;
              case '大单': isWin = tailBig && tailOdd; break;
              case '小单': isWin = !tailBig && tailOdd; break;
              case '大双': isWin = tailBig && !tailOdd; break;
              case '小双': isWin = !tailBig && !tailOdd; break;
              default: break;
            }
          }
        } else if (bet.type && bet.type.startsWith('animal-')) {
          // ===== 动物运动会 settlement (drawNumbers = permutation of 1-6) =====
          const pos = ANIMAL_POSITIONS.find(p => p.id === bet.positionId);
          if (pos) {
            const num = drawNumbers[pos.index]; // animal number at this 名次 (1-6)
            if (bet.type === 'animal-number') {
              isWin = num.toString() === bet.betName;
            } else if (bet.type === 'animal-twosided') {
              if (bet.betName === '大') isWin = num >= 4;
              else if (bet.betName === '小') isWin = num <= 3;
              else if (bet.betName === '单') isWin = num % 2 !== 0;
              else if (bet.betName === '双') isWin = num % 2 === 0;
            } else if (bet.type === 'animal-dragontiger') {
              // 龙虎: 冠军vs第六名, 亚军vs第五名, 季军vs第四名 (index i vs 5-i)
              const numOpp = drawNumbers[5 - pos.index];
              if (bet.betName === '龙') isWin = num > numOpp;
              else if (bet.betName === '虎') isWin = num < numOpp;
            }
          }
        } else if (bet.type && bet.type.startsWith('lhc-')) {
          // ===== 澳门六合彩 settlement (drawNumbers = 6 正码 + 特码@index 6) =====
          const special = drawNumbers[6]; // 特码
          if (bet.type === 'lhc-tema-number') {
            isWin = special === parseInt(bet.betName);
          } else if (bet.type === 'lhc-tema-twosided') {
            isWin = lhcTwoSidedWin(special, bet.betName);
          } else if (bet.type === 'lhc-zhengte-twosided') {
            // 正特: the i-th 正码 (positionId stores the 0-5 index)
            const idx = parseInt(bet.positionId);
            isWin = lhcTwoSidedWin(drawNumbers[idx], bet.betName);
          } else if (bet.type === 'lhc-zhengte-number') {
            // 正特 数字: number at the chosen 正码 position matches the bet
            const idx = parseInt(bet.positionId);
            isWin = drawNumbers[idx] === parseInt(bet.betName);
          } else if (bet.type === 'lhc-zhengma-number') {
            // 正码: win if the number is among the 6 正码 (index 0-5)
            isWin = drawNumbers.slice(0, 6).includes(parseInt(bet.betName));
          } else if (bet.type === 'lhc-zhengma-twosided') {
            isWin = lhcZhengmaTwoSidedWin(drawNumbers, bet.betName);
          } else if (bet.type === 'lhc-texiao') {
            // 特肖: 特码 的生肖落在所选生肖即中奖 (49 亦算输赢)
            isWin = lhcZodiacOf(special) === bet.betName;
          } else if (bet.type === 'lhc-zhengxiao') {
            // 正肖: 6 个正码中落在所选生肖的个数 -> 命中即中奖, 派彩随命中数倍增
            zhengxiaoHits = drawNumbers.slice(0, 6).filter(n => lhcZodiacOf(n) === bet.betName).length;
            isWin = zhengxiaoHits >= 1;
          } else if (bet.type === 'lhc-yixiao') {
            // 一肖: 当期 7 个号码中任一落在所选生肖即中奖
            isWin = drawNumbers.some(n => lhcZodiacOf(n) === bet.betName);
          } else if (bet.type === 'lhc-yixiao-no') {
            // 一肖不中: 当期 7 个号码均不属于所选生肖即中奖
            isWin = drawNumbers.every(n => lhcZodiacOf(n) !== bet.betName);
          } else if (bet.type === 'lhc-weishu') {
            // 尾数: 当期 7 个号码任一尾数命中即中 (多个同尾只派一次)
            const t = parseInt(bet.betName);
            isWin = drawNumbers.some(n => n % 10 === t);
          } else if (bet.type === 'lhc-weishu-no') {
            // 尾数不中: 当期 7 个号码均不含该尾数即中
            const t = parseInt(bet.betName);
            isWin = drawNumbers.every(n => n % 10 !== t);
          } else if (bet.type === 'lhc-tetoushu') {
            // 特码头数: 特码 的十位 (头数) 命中
            isWin = Math.floor(special / 10) === parseInt(bet.betName);
          } else if (bet.type === 'lhc-teweishu') {
            // 特码尾数: 特码 的个位 (尾数) 命中
            isWin = (special % 10) === parseInt(bet.betName);
          } else if (bet.type === 'lhc-banbo') {
            // 半波: 特码 同时符合波色与属性
            isWin = lhcBanboWin(special, bet.betName);
          } else if (bet.type === 'lhc-wuxing') {
            // 五行: 特码 落在所选五行号码集即中
            isWin = (LHC_WUXING_NUMBERS[bet.betName] || []).includes(special);
          } else if (bet.type === 'lhc-zongxiao') {
            // 总肖: 当期 7 号码所属不同生肖总数 (或其单双) 命中
            const distinct = new Set(drawNumbers.map(n => lhcZodiacOf(n))).size;
            isWin = lhcZongxiaoWin(distinct, bet.betName);
          } else if (bet.type === 'lhc-qisebo') {
            // 七色波: 7 个色波最多的颜色; 平手为和局 (红绿蓝注退回, 和局注中)
            const winner = lhcQiseboResult(drawNumbers);
            if (bet.betName === '和') {
              isWin = winner === null;
            } else if (winner === null) {
              isPush = true; // 红/绿/蓝 注遇和局退回
            } else {
              const want = { 红: 'red', 绿: 'green', 蓝: 'blue' }[bet.betName];
              isWin = winner === want;
            }
          } else if (bet.type === 'lhc-hexiao') {
            // 合肖: 特码 落在所选生肖即中; 特码 49 为和局 (退回)
            if (special === 49) {
              isPush = true;
            } else {
              const z = lhcZodiacOf(special);
              const zodiacs = bet.zodiacs || (bet.betName ? bet.betName.split(',') : []);
              isWin = zodiacs.includes(z);
            }
          } else if (bet.type === 'lhc-buzhong') {
            // 不中: 组合内的号码全部未在当期开奖号码 (7 个) 中出现即中奖
            const combo = bet.nums || [];
            isWin = drawNumbers.every(n => !combo.includes(n));
          }
        } else if (bet.positionId === 'sum') {
          // Sum Bets
          const sum = drawNumbers[0] + drawNumbers[1];
          if (bet.type === 'sum-number') {
            isWin = sum.toString() === bet.betName;
          } else if (bet.type === 'sum-twosided') {
            const isBig = sum >= 12;
            isWin = bet.betName === (isBig ? '大' : '小');
          }
        } else {
          // Position Bets
          const posIdx = POSITIONS.findIndex(p => p.id === bet.positionId);
          if (posIdx !== -1) {
            const num = drawNumbers[posIdx];

            if (bet.type === 'number') {
              isWin = num.toString() === bet.betName;
            } else if (bet.type === 'twosided') {
              if (bet.betName === '大') isWin = num >= 6;
              else if (bet.betName === '小') isWin = num <= 5;
              else if (bet.betName === '单') isWin = num % 2 !== 0;
              else if (bet.betName === '双') isWin = num % 2 === 0;
            } else if (bet.type === 'dragontiger') {
              const opponentIdx = 9 - posIdx;
              const numOpponent = drawNumbers[opponentIdx];
              if (bet.betName === '龙') isWin = num > numOpponent;
              else if (bet.betName === '虎') isWin = num < numOpponent;
            }
          }
        }

        // 和局 (push) refunds the stake; 正肖 pays stake + per-hit profit;
        // all other markets pay the flat amount × odds.
        const winAmt = isPush
          ? bet.amount
          : !isWin
            ? 0
            : bet.type === 'lhc-zhengxiao'
              ? Math.round(bet.amount * (1 + (bet.odds - 1) * zhengxiaoHits))
              : Math.round(bet.amount * bet.odds);
        if (isWin) {
          totalWinnings += winAmt;
          winningDetails.push(`${bet.displayTitle} (中 ${winAmt}元)`);
        } else if (isPush) {
          // Refund the stake back to the balance without counting as a win.
          totalWinnings += winAmt;
        }

        processedSettled.push({
          ...bet,
          time: bet.timestamp,
          winLoss: winAmt - bet.amount,
          result: winAmt - bet.amount,
          status: '已结算',
          drawNumbers: drawNumbers
        });
      });

      winLoss = totalWinnings - totalBetAmount;

      if (totalWinnings > 0) {
        setBalance(prev => prev + totalWinnings);
        addToast(`🎉 [${gameName}] 第${drawIssueStr}期开奖: 恭喜您中奖! 赢回 ${totalWinnings} 元! (${winningDetails.join(', ')})`, 'success');
      } else {
        addToast(`[${gameName}] 第${drawIssueStr}期开奖: 未中奖，下期继续努力！`, 'info');
      }

      setSettledBets(prev => [...processedSettled, ...prev]);

      // Clear placed bets for this game
      setPlacedBets(prev => prev.filter(b => b.gameId !== gameId));

      // 自动跟投: record this round's result for any running plan on this game
      // and place the next round. Runs after the clear above so the appended
      // next-round bets survive.
      settleFollowPlansRef.current?.(gameId, drawIssueStr, drawNumbers, processedSettled);
    }

    // Update the history item with the calculated win/loss
    setGamesState(prev => {
      const game = prev[gameId];
      if (!game) return prev;
      const updatedHistory = game.history.map(item => {
        if (item.issue === drawIssueStr) {
          return { ...item, winLoss: winLoss };
        }
        return item;
      });
      return {
        ...prev,
        [gameId]: {
          ...game,
          history: updatedHistory
        }
      };
    });
  };

  // Main countdown timer loop for all games in the background.
  // The tick runs its logic once per second OUTSIDE any setState updater: it reads
  // the latest state from gamesStateRef, generates each draw exactly once, then
  // applies the new state and triggers settlement. (Generating draws inside a
  // setState updater would double-fire under StrictMode, settling every bet twice
  // against two different random draws.)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const prev = gamesStateRef.current;
      const nextState = {};
      const drawsToProcess = [];

      Object.keys(prev).forEach(gameId => {
        const game = prev[gameId];
        const newTimeLeft = game.timeLeft - 1;

        if (newTimeLeft <= 0) {
          // Draw occurs!
          const isFfc = game.kind === 'ffc';
          const isK3 = game.kind === 'k3';
          const isXy28 = game.kind === 'xy28';
          const isLhc = game.kind === 'lhc';
          const isAnimal = game.kind === 'animal';
          const drawNumbers = isFfc
            ? generateFfcDraw()
            : isK3
              ? generateK3Draw()
              : isXy28
                ? generateXy28Draw()
                : isLhc
                  ? generateLhcDraw()
                  : isAnimal
                    ? generateAnimalDraw()
                    : generateRandomDraw();
          const drawIssueStr = (isFfc || isK3 || isXy28 || isLhc || isAnimal)
            ? game.currentIssue.toString()
            : game.currentIssue.toString().padStart(5, '0');
          const newDraw = { issue: drawIssueStr, numbers: drawNumbers };
          const updatedHistory = [newDraw, ...game.history].slice(0, 30);

          nextState[gameId] = {
            ...game,
            timeLeft: game.maxTime,
            currentIssue: game.currentIssue + 1,
            history: updatedHistory
          };

          drawsToProcess.push({
            gameId,
            gameName: gameName(gameId),
            drawNumbers,
            drawIssueStr
          });
        } else {
          nextState[gameId] = {
            ...game,
            timeLeft: newTimeLeft
          };
        }
      });

      // Keep the ref in sync immediately so a fast follow-up tick sees fresh state.
      gamesStateRef.current = nextState;
      setGamesState(nextState);

      drawsToProcess.forEach(draw => {
        processGameDraw(draw.gameId, draw.gameName, draw.drawNumbers, draw.drawIssueStr);
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Toggle selection of a bet
  const handleToggleBet = (betObj) => {
    if (isClosed) return;
    
    if (betObj.tabId === 'shortcut') {
      const optId = `${betObj.type}-${betObj.betName}`;
      setSelectedShortcutOptions(prev => {
        const exists = prev.includes(optId);
        if (exists) {
          return prev.filter(x => x !== optId);
        } else {
          setSelectedShortcutPositions(posPrev => {
            if (posPrev.length === 0) {
              return ['p1'];
            }
            return posPrev;
          });
          return [...prev, optId];
        }
      });
    } else {
      setNonShortcutSelectedBets(prev => {
        const exists = prev.some(b => b.id === betObj.id);
        if (exists) {
          return prev.filter(b => b.id !== betObj.id);
        } else {
          return [...prev, betObj];
        }
      });
    }
  };

  // Reset active selections
  const handleReset = () => {
    clearSelections();
  };

  // Refresh balance (mock)
  const handleRefreshBalance = () => {
    setBalance(110000);
    addToast('余额已成功重置为 110,000 元', 'success');
  };

  // Open confirmation modal helper
  const handleOpenConfirmModal = () => {
    if (selectedBets.length === 0) return;
    const initialAmount = parseInt(betAmount) || 10;
    // 快捷投注 bets carry their own per-号码 amount; everything else uses the
    // shared 投注金额 from the footer.
    const initialConfirmBets = selectedBets.map(bet => {
      const amt = bet.amount != null ? bet.amount : initialAmount;
      return { ...bet, amount: amt, baseAmount: amt };
    });
    setConfirmBets(initialConfirmBets);
    setBulkAmount(initialAmount.toString());
    setBulkMode(confirmBulkDefault);
    setActiveMultiplier(null);
    setConfirmGameId(activeGameId);
    setIsConfirmModalOpen(true);
  };

  // 计划中心 第X球 label (第一球…第五球) -> FFC ball position name (第1球…第5球).
  const FFC_COND_TO_POS = {
    '第一球': '第1球', '第二球': '第2球', '第三球': '第3球', '第四球': '第4球', '第五球': '第5球',
  };

  // Turn a 跟投/反投 spec from 计划中心 into settleable bet objects (no amount yet).
  // balls  -> one 号码 bet per target digit (FFC 猜球号 / PK10 名次号码).
  // twoside-> a single 大小单双 bet on 和值/总和/特码.
  const buildFollowBets = ({ kind, cond2, predictKind, targets }) => {
    if (predictKind === 'balls') {
      if (kind === 'ffc') {
        const pos = FFC_POSITIONS.find(p => p.name === FFC_COND_TO_POS[cond2]);
        if (!pos) return [];
        return targets.map(v => ({
          id: `ffc-${pos.id}-number-${v}`, tabId: 'guess-ball',
          positionId: pos.id, positionName: pos.name, betName: v,
          odds: FFC_ODDS.number, displayTitle: `${pos.name}-${v}`, type: 'ffc-number',
        }));
      }
      if (kind === 'pk10') {
        const pos = POSITIONS.find(p => p.name === cond2);
        if (!pos) return [];
        return targets.map(v => ({
          id: `position-${pos.id}-number-${v}`, tabId: 'guess-ball',
          positionId: pos.id, positionName: pos.name, betName: v,
          odds: ODDS.number, displayTitle: `${pos.name}-${v}`, type: 'number',
        }));
      }
      return [];
    }
    // twoside: a single 大/小/单/双 stake
    const side = targets[0];
    if (kind === 'k3') return [{
      id: `k3-sum-twosided-${side}`, tabId: 'sum', positionId: 'sum', positionName: '和值',
      betName: side, odds: K3_ODDS.sumTwoSided, displayTitle: `和值-${side}`, type: 'k3-sum-twosided',
    }];
    if (kind === 'xy28') return [{
      id: `xy28-sum-twosided-${side}`, tabId: 'sum', positionId: 'sum', positionName: '总和',
      betName: side, odds: XY28_ODDS.sumTwoSided, displayTitle: `总和-${side}`, type: 'xy28-sum-twosided',
    }];
    if (kind === 'lhc') return [{
      id: `lhc-tema-A-twosided-${side}`, tabId: 'tema', positionId: 'tema', positionName: '特码A',
      betName: side, odds: LHC_TEMA_ODDS.A.ds, displayTitle: `特码A-${side}`, type: 'lhc-tema-twosided',
    }];
    return [];
  };

  // 计划中心 跟投/反投: build the bets, bring them into the shared confirmation
  // modal (targeting the plan's selected game), and close the plan center.
  const handleFollowBet = (spec) => {
    if (!gamesState[spec.gameId]) {
      addToast('该游戏暂未开放投注', 'error');
      return;
    }
    const bets = buildFollowBets(spec);
    if (!bets.length) {
      addToast('本期暂无可投注号码', 'info');
      return;
    }
    const amt = parseInt(betAmount) || 10;
    setConfirmBets(bets.map(b => ({ ...b, amount: amt, baseAmount: amt })));
    setBulkAmount(amt.toString());
    setBulkMode(confirmBulkDefault);
    setActiveMultiplier(null);
    setConfirmGameId(spec.gameId);
    setIsConfirmModalOpen(true);
    // Keep 计划中心 open behind the confirmation modal — the user stays in the
    // plan center rather than being dropped onto the betting page.
    const label = spec.mode === 'follow' ? '跟投' : '反投';
    addToast(`已带入${label} ${spec.expertName} 本期预测，请确认投注`, 'info');
  };

  // ===== 计划中心 自动跟投 (auto-follow) engine =====
  const fmtFollowIssue = (kind, issueNum) =>
    kind === 'pk10' ? issueNum.toString().padStart(5, '0') : issueNum.toString();

  const fpNowStr = () => {
    const now = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
  };

  // Build one round's bets + round record for a plan (no state writes).
  const buildFollowRound = (plan, roundIdx, issueStr) => {
    const override = (plan.perRoundOverrides || []).find((o) => o.idx === roundIdx);
    const mode = override?.mode ?? plan.globalMode;
    const amount = override?.amount ?? plan.amountPerBall;
    const { predictKind, predicted } = genFollowPrediction(plan.kind, plan.cond1, plan.ballCount, plan.cond2);
    const targets = resolveFollowTargets(plan.kind, predicted, mode);
    const base = buildFollowBets({ kind: plan.kind, cond2: plan.cond2, predictKind, targets });
    const ts = fpNowStr();
    const stamp = Date.now();
    const bets = base.map((b, i) => ({
      ...b,
      amount,
      uid: `${plan.id}-r${roundIdx}-${i}-${stamp}`,
      orderId: `20${stamp}${roundIdx}${i}`,
      planId: plan.id,
      followRound: roundIdx,
      gameId: plan.gameId,
      gameName: plan.gameName,
      issue: issueStr,
      timestamp: ts,
      pankou: plan.kind === 'lhc' ? lhcPankou : undefined,
    }));
    const cost = bets.reduce((s, b) => s + b.amount, 0);
    const roundEntry = {
      idx: roundIdx, issue: issueStr, mode, amount, predicted,
      predictKind, drawNumbers: null, settled: false, winLoss: 0,
      betUids: bets.map((b) => b.uid),
    };
    return { bets, roundEntry, cost };
  };

  // Create a plan from the config page and place its first round immediately.
  const onCreatePlan = (config) => {
    const game = gamesState[config.gameId];
    if (!game) { addToast('该游戏暂未开放投注', 'error'); return; }
    const plan = {
      id: `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      expertName: config.expertName,
      gameId: config.gameId,
      gameName: config.gameName,
      kind: config.kind,
      cond1: config.cond1,
      cond2: config.cond2,
      ballCount: config.ballCount,
      roundsTotal: config.roundsTotal,
      amountPerBall: config.amountPerBall,
      globalMode: config.globalMode,
      stop: config.stop,
      perRoundOverrides: config.perRoundOverrides || [],
      status: 'running',
      stopReason: null,
      rounds: [],
      totalWinLoss: 0,
      winRounds: 0,
      settledRounds: 0,
      createdAt: Date.now(),
    };
    const { bets, roundEntry, cost } = buildFollowRound(plan, 0, fmtFollowIssue(plan.kind, game.currentIssue));
    if (balanceRef.current < cost) { addToast('余额不足，无法创建自动跟投', 'error'); return; }
    plan.rounds = [roundEntry];
    setBalance((b) => b - cost);
    setPlacedBets((prev) => [...prev, ...bets]);
    setFollowPlans((prev) => {
      const next = [plan, ...prev];
      followPlansRef.current = next;
      return next;
    });
    addToast(`已创建自动跟投 ${plan.expertName}（${plan.roundsTotal}期）`, 'success');
  };

  // Edit a running plan's *future* settings (already-placed rounds are immutable).
  const onEditPlan = (planId, config) => {
    setFollowPlans((prev) => {
      const next = prev.map((p) => (p.id === planId ? {
        ...p,
        roundsTotal: config.roundsTotal,
        amountPerBall: config.amountPerBall,
        globalMode: config.globalMode,
        stop: config.stop,
        perRoundOverrides: config.perRoundOverrides || [],
      } : p));
      followPlansRef.current = next;
      return next;
    });
    addToast('已更新跟投计划', 'success');
  };

  // Manually stop a plan: withdraw + refund its in-flight (unsettled) round.
  const onStopPlan = (planId) => {
    const plan = followPlansRef.current.find((p) => p.id === planId);
    if (!plan || plan.status !== 'running') return;
    const refund = placedBetsRef.current
      .filter((b) => b.planId === planId)
      .reduce((s, b) => s + b.amount, 0);
    if (refund > 0) {
      setPlacedBets((prev) => prev.filter((b) => b.planId !== planId));
      setBalance((b) => b + refund);
    }
    setFollowPlans((prev) => {
      const next = prev.map((p) => (p.id === planId
        ? { ...p, status: 'stopped', stopReason: '手动停止', rounds: p.rounds.filter((r) => r.settled) }
        : p));
      followPlansRef.current = next;
      return next;
    });
    addToast('已停止自动跟投', 'info');
  };

  // Called by processGameDraw after a game draws: record each running plan's
  // just-settled round, evaluate stop-conditions, and place the next round.
  const settleFollowPlans = (gameId, drawIssueStr, drawNumbers, settledForGame) => {
    const plans = followPlansRef.current;
    if (!plans.some((p) => p.status === 'running' && p.gameId === gameId)) return;
    const nextIssueNum = parseInt(drawIssueStr, 10) + 1;
    const newPlacedBets = [];
    let extraStake = 0;
    const nextPlans = plans.map((plan) => {
      if (plan.status !== 'running' || plan.gameId !== gameId) return plan;
      const roundIdx = plan.rounds.findIndex((r) => !r.settled && r.issue === drawIssueStr);
      if (roundIdx === -1) return plan;
      const planBets = settledForGame.filter((b) => b.planId === plan.id && b.followRound === plan.rounds[roundIdx].idx);
      const roundWinLoss = planBets.reduce((s, b) => s + b.winLoss, 0);
      const rounds = plan.rounds.map((r, i) => (i === roundIdx
        ? { ...r, settled: true, drawNumbers, winLoss: roundWinLoss }
        : r));
      const settledRounds = plan.settledRounds + 1;
      const winRounds = plan.winRounds + (roundWinLoss > 0 ? 1 : 0);
      const totalWinLoss = plan.totalWinLoss + roundWinLoss;
      let status = 'running';
      let stopReason = null;
      const stop = plan.stop || {};
      if (stop.profitAbove?.on && totalWinLoss >= stop.profitAbove.val) { status = 'stopped'; stopReason = '触发止盈'; }
      else if (stop.profitBelow?.on && totalWinLoss <= stop.profitBelow.val) { status = 'stopped'; stopReason = '触发止损'; }
      else if (stop.stopOnWin && roundWinLoss > 0) { status = 'stopped'; stopReason = '中奖停止'; }
      else if (stop.stopOnLose && roundWinLoss <= 0) { status = 'stopped'; stopReason = '不中奖停止'; }
      else if (settledRounds >= plan.roundsTotal) { status = 'done'; stopReason = '已完成'; }
      const updated = { ...plan, rounds, settledRounds, winRounds, totalWinLoss, status, stopReason };
      if (status === 'running') {
        const nextIdx = plan.rounds[roundIdx].idx + 1;
        const built = buildFollowRound(updated, nextIdx, fmtFollowIssue(plan.kind, nextIssueNum));
        if (balanceRef.current - extraStake >= built.cost) {
          newPlacedBets.push(...built.bets);
          extraStake += built.cost;
          updated.rounds = [...updated.rounds, built.roundEntry];
        } else {
          updated.status = 'stopped';
          updated.stopReason = '余额不足';
        }
      }
      return updated;
    });
    followPlansRef.current = nextPlans;
    setFollowPlans(nextPlans);
    if (newPlacedBets.length) setPlacedBets((prev) => [...prev, ...newPlacedBets]);
    if (extraStake > 0) setBalance((b) => b - extraStake);
  };
  // Keep the bridge ref pointing at the latest settleFollowPlans closure.
  useEffect(() => { settleFollowPlansRef.current = settleFollowPlans; });

  // Bulk modify all bet amounts in confirm modal
  const handleBulkAmountChange = (val) => {
    setBulkAmount(val);
    setActiveMultiplier(null);
    const numVal = parseInt(val) || 0;
    setConfirmBets(prev => prev.map(bet => ({
      ...bet,
      amount: numVal
    })));
  };

  // 修改倍数：所有投注金额 = 基础额（进弹窗时的原始金额）× 倍数
  const handleBulkMultiplierChange = (mult) => {
    setActiveMultiplier(mult);
    setConfirmBets(prev => prev.map(bet => ({
      ...bet,
      amount: (bet.baseAmount != null ? bet.baseAmount : bet.amount) * mult
    })));
  };

  // 保存编辑后的快捷倍数
  const handleUpdateMultipliers = (newVals) => {
    setMultiplierValues(newVals);
    if (activeMultiplier != null && !newVals.includes(activeMultiplier)) {
      setActiveMultiplier(null);
    }
    addToast('快选倍数修改成功', 'success');
  };

  // Edit individual bet amount in confirm modal
  const handleIndividualAmountChange = (betId, val) => {
    setActiveMultiplier(null);
    const numVal = parseInt(val) || 0;
    setConfirmBets(prev => prev.map(bet => {
      if (bet.id === betId) {
        return { ...bet, amount: numVal };
      }
      return bet;
    }));
  };

  // Delete a bet from confirm modal list
  const handleDeleteConfirmBet = (betId) => {
    setConfirmBets(prev => prev.filter(bet => bet.id !== betId));
  };

  // Submit confirmed bets
  const handleConfirmSubmit = () => {
    if (confirmBets.length === 0) {
      addToast('请选择至少一注进行投注', 'error');
      return;
    }

    const totalAmountNeeded = confirmBets.reduce((sum, bet) => sum + bet.amount, 0);
    
    if (balance < totalAmountNeeded) {
      addToast('余额不足，投注失败', 'error');
      return;
    }
    
    // Deduct balance
    setBalance(prev => prev - totalAmountNeeded);
    
    // Generate current timestamp (MM-DD HH:MM:SS)
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestampStr = `${month}-${day} ${hours}:${minutes}:${seconds}`;

    // Bets may target a game other than the active one (计划中心 跟投/反投); use
    // that game's own kind / 期号 so they settle against its next draw.
    const targetGameId = confirmGameId || activeGameId;
    const targetGame = gamesState[targetGameId] || activeGame;
    const targetKind = targetGame.kind || gameKind;
    const targetIssue = targetGame.currentIssue;
    const activeGameName = gameName(targetGameId);
    const placedAt = Date.now();
    const confirmedWithTimestamp = confirmBets.map((bet, idx) => ({
      ...bet,
      // Unique per placed instance so settling the same market across draws never
      // produces colliding React keys in the unsettled/settled lists.
      uid: `${bet.id}-${placedAt}-${idx}`,
      timestamp: timestampStr,
      gameId: targetGameId,
      gameName: activeGameName,
      // 六合彩 records which 盘口 (A~D) the bet was placed under, shown before 玩法.
      pankou: targetKind === 'lhc' ? lhcPankou : undefined,
      issue: targetKind === 'pk10' ? targetIssue.toString().padStart(5, '0') : targetIssue.toString()
    }));

    // Save to placed bets list
    setPlacedBets(prev => [...prev, ...confirmedWithTimestamp]);
    
    // Clear selections
    clearSelections();
    
    // Close modal
    setIsConfirmModalOpen(false);
    setConfirmBets([]);
    setConfirmGameId(null);

    addToast(`[${activeGameName}] 下注成功! 共 ${confirmBets.length} 注，合计 ${totalAmountNeeded} 元`, 'success');
  };

  // Submit bets (now opens confirmation modal)
  const handleSubmitBets = () => {
    if (selectedBets.length === 0) return;
    if (!betAmount || parseInt(betAmount) <= 0) {
      addToast('请选择或输入有效的投注金额', 'error');
      return;
    }
    handleOpenConfirmModal();
  };

  // Custom chips updates
  const handleUpdateChips = (newChips) => {
    setChipValues(newChips);
    // If current bet amount isn't in new chips, reset to first chip
    if (!newChips.map(String).includes(betAmount)) {
      setBetAmount(newChips[0].toString());
    }
    addToast('快选金额修改成功', 'success');
  };

  // Calculate dynamic "长龙" statistics based on current history
  // Memoized on history updates
  const longDragonStats = React.useMemo(() => {
    // We calculate "长龙" from the history.
    const stats = [];
    if (history.length === 0) return stats;

    // ===== 动物运动会 long dragon: per-名次 大小 & 单双 streaks, plus 龙虎 for 冠/亚/季 =====
    if (gameKind === 'animal') {
      ANIMAL_POSITIONS.forEach((pos) => {
        const idx = pos.index;

        // 大小 (大: 号码 4-6, 小: 1-3)
        let consecutiveBS = 0;
        let activeBS = null;
        for (let i = 0; i < history.length; i++) {
          const bs = history[i].numbers[idx] >= 4 ? '大' : '小';
          if (i === 0) { activeBS = bs; consecutiveBS = 1; }
          else if (bs === activeBS) consecutiveBS++;
          else break;
        }
        if (consecutiveBS >= 2) {
          const mk = (label) => ({
            id: `animal-${pos.id}-animal-twosided-${label}`,
            tabId: 'long-dragon', positionId: pos.id, positionName: pos.name,
            betName: label, odds: ANIMAL_ODDS.twoSided,
            displayTitle: `${pos.name}-${label}`, type: 'animal-twosided',
          });
          stats.push({
            title: `${pos.name}-${activeBS}`, consecutive: consecutiveBS,
            opt1Label: '大', opt2Label: '小',
            opt1Id: `animal-${pos.id}-animal-twosided-大`, opt2Id: `animal-${pos.id}-animal-twosided-小`,
            odds1: ANIMAL_ODDS.twoSided, odds2: ANIMAL_ODDS.twoSided,
            opt1BetObj: mk('大'), opt2BetObj: mk('小'),
          });
        }

        // 单双
        let consecutiveOE = 0;
        let activeOE = null;
        for (let i = 0; i < history.length; i++) {
          const oe = history[i].numbers[idx] % 2 !== 0 ? '单' : '双';
          if (i === 0) { activeOE = oe; consecutiveOE = 1; }
          else if (oe === activeOE) consecutiveOE++;
          else break;
        }
        if (consecutiveOE >= 2) {
          const mk = (label) => ({
            id: `animal-${pos.id}-animal-twosided-${label}`,
            tabId: 'long-dragon', positionId: pos.id, positionName: pos.name,
            betName: label, odds: ANIMAL_ODDS.twoSided,
            displayTitle: `${pos.name}-${label}`, type: 'animal-twosided',
          });
          stats.push({
            title: `${pos.name}-${activeOE}`, consecutive: consecutiveOE,
            opt1Label: '单', opt2Label: '双',
            opt1Id: `animal-${pos.id}-animal-twosided-单`, opt2Id: `animal-${pos.id}-animal-twosided-双`,
            odds1: ANIMAL_ODDS.twoSided, odds2: ANIMAL_ODDS.twoSided,
            opt1BetObj: mk('单'), opt2BetObj: mk('双'),
          });
        }

        // 龙虎 — 冠军vs第六名, 亚军vs第五名, 季军vs第四名 (只有前三名有)
        if (idx < 3) {
          const oppIdx = 5 - idx;
          let consecutiveDT = 0;
          let activeDT = null;
          for (let i = 0; i < history.length; i++) {
            const dt = history[i].numbers[idx] > history[i].numbers[oppIdx] ? '龙' : '虎';
            if (i === 0) { activeDT = dt; consecutiveDT = 1; }
            else if (dt === activeDT) consecutiveDT++;
            else break;
          }
          if (consecutiveDT >= 2) {
            const mk = (label) => ({
              id: `animal-${pos.id}-animal-dragontiger-${label}`,
              tabId: 'long-dragon', positionId: pos.id, positionName: pos.name,
              betName: label, odds: ANIMAL_ODDS.twoSided,
              displayTitle: `${pos.name}-${label}`, type: 'animal-dragontiger',
            });
            stats.push({
              title: `${pos.name}-${activeDT}`, consecutive: consecutiveDT,
              opt1Label: '龙', opt2Label: '虎',
              opt1Id: `animal-${pos.id}-animal-dragontiger-龙`, opt2Id: `animal-${pos.id}-animal-dragontiger-虎`,
              odds1: ANIMAL_ODDS.twoSided, odds2: ANIMAL_ODDS.twoSided,
              opt1BetObj: mk('龙'), opt2BetObj: mk('虎'),
            });
          }
        }
      });

      return stats.sort((a, b) => b.consecutive - a.consecutive).slice(0, 8);
    }

    // ===== 分分彩 long dragon: per-ball & 总和 大小/单双 streaks =====
    if (gameKind === 'ffc') {
      const buildTwoSidedStat = (positionId, positionName, getValue, mode) => {
        // mode: 'bs' (大/小) or 'oe' (单/双)
        const classify = mode === 'bs'
          ? (v, isSum) => (isSum ? (v >= 23 ? '大' : '小') : (v >= 5 ? '大' : '小'))
          : (v) => (v % 2 !== 0 ? '单' : '双');
        const isSum = positionId === 'sum';
        let consecutive = 0;
        let active = null;
        for (let i = 0; i < history.length; i++) {
          const cls = classify(getValue(history[i].numbers), isSum);
          if (i === 0) { active = cls; consecutive = 1; }
          else if (cls === active) consecutive++;
          else break;
        }
        if (consecutive < 2) return null;
        const opt1Label = mode === 'bs' ? '大' : '单';
        const opt2Label = mode === 'bs' ? '小' : '双';
        const mkBet = (label) => ({
          id: `ffc-${positionId}-twosided-${label}`,
          tabId: 'long-dragon',
          positionId,
          positionName,
          betName: label,
          odds: FFC_ODDS.twoSided,
          displayTitle: `${positionName}-${label}`,
          type: 'ffc-twosided'
        });
        return {
          title: `${positionName}-${active}`,
          consecutive,
          opt1Label, opt2Label,
          opt1Id: `ffc-${positionId}-twosided-${opt1Label}`,
          opt2Id: `ffc-${positionId}-twosided-${opt2Label}`,
          odds1: FFC_ODDS.twoSided,
          odds2: FFC_ODDS.twoSided,
          opt1BetObj: mkBet(opt1Label),
          opt2BetObj: mkBet(opt2Label)
        };
      };

      FFC_POSITIONS.forEach((pos) => {
        const getVal = (nums) => nums[pos.index];
        const bs = buildTwoSidedStat(pos.id, pos.name, getVal, 'bs');
        if (bs) stats.push(bs);
        const oe = buildTwoSidedStat(pos.id, pos.name, getVal, 'oe');
        if (oe) stats.push(oe);
      });
      const sumVal = (nums) => nums.reduce((a, b) => a + b, 0);
      const sumBs = buildTwoSidedStat('sum', '总和', sumVal, 'bs');
      if (sumBs) stats.push(sumBs);
      const sumOe = buildTwoSidedStat('sum', '总和', sumVal, 'oe');
      if (sumOe) stats.push(sumOe);

      return stats.sort((a, b) => b.consecutive - a.consecutive).slice(0, 8);
    }

    // ===== 快三 long dragon: 和值 大小 & 单双 streaks =====
    if (gameKind === 'k3') {
      const buildSumStat = (mode) => {
        // mode: 'bs' (大/小) or 'oe' (单/双)
        const classify = mode === 'bs'
          ? (sum) => (k3SumBig(sum) ? '大' : '小')
          : (sum) => (sum % 2 !== 0 ? '单' : '双');
        let consecutive = 0;
        let active = null;
        for (let i = 0; i < history.length; i++) {
          const sum = history[i].numbers.reduce((a, b) => a + b, 0);
          const cls = classify(sum);
          if (i === 0) { active = cls; consecutive = 1; }
          else if (cls === active) consecutive++;
          else break;
        }
        if (consecutive < 1) return null;
        const opt1Label = mode === 'bs' ? '大' : '单';
        const opt2Label = mode === 'bs' ? '小' : '双';
        const mkBet = (label) => ({
          id: `k3-sum-twosided-${label}`,
          tabId: 'long-dragon',
          positionId: 'sum',
          positionName: '和值',
          betName: label,
          odds: K3_ODDS.sumTwoSided,
          displayTitle: `和值-${label}`,
          type: 'k3-sum-twosided'
        });
        return {
          title: `和值-${active}`,
          consecutive,
          opt1Label, opt2Label,
          opt1Id: `k3-sum-twosided-${opt1Label}`,
          opt2Id: `k3-sum-twosided-${opt2Label}`,
          odds1: K3_ODDS.sumTwoSided,
          odds2: K3_ODDS.sumTwoSided,
          opt1BetObj: mkBet(opt1Label),
          opt2BetObj: mkBet(opt2Label)
        };
      };

      const bs = buildSumStat('bs');
      if (bs) stats.push(bs);
      const oe = buildSumStat('oe');
      if (oe) stats.push(oe);
      return stats;
    }

    // ===== 幸运28 long dragon: 总和 大小 & 单双 streaks =====
    if (gameKind === 'xy28') {
      const buildSumStat = (mode) => {
        // mode: 'bs' (大/小, boundary sum>=14) or 'oe' (单/双)
        const classify = mode === 'bs'
          ? (sum) => (xy28SumBig(sum) ? '大' : '小')
          : (sum) => (sum % 2 !== 0 ? '单' : '双');
        let consecutive = 0;
        let active = null;
        for (let i = 0; i < history.length; i++) {
          const sum = history[i].numbers.reduce((a, b) => a + b, 0);
          const cls = classify(sum);
          if (i === 0) { active = cls; consecutive = 1; }
          else if (cls === active) consecutive++;
          else break;
        }
        if (consecutive < 1) return null;
        const opt1Label = mode === 'bs' ? '大' : '单';
        const opt2Label = mode === 'bs' ? '小' : '双';
        const mkBet = (label) => ({
          id: `xy28-sum-twosided-${label}`,
          tabId: 'long-dragon',
          positionId: 'sum',
          positionName: '总和',
          betName: label,
          odds: XY28_ODDS.sumTwoSided,
          displayTitle: `总和-${label}`,
          type: 'xy28-sum-twosided'
        });
        return {
          title: `总和-${active}`,
          consecutive,
          opt1Label, opt2Label,
          opt1Id: `xy28-sum-twosided-${opt1Label}`,
          opt2Id: `xy28-sum-twosided-${opt2Label}`,
          odds1: XY28_ODDS.sumTwoSided,
          odds2: XY28_ODDS.sumTwoSided,
          opt1BetObj: mkBet(opt1Label),
          opt2BetObj: mkBet(opt2Label)
        };
      };

      const bs = buildSumStat('bs');
      if (bs) stats.push(bs);
      const oe = buildSumStat('oe');
      if (oe) stats.push(oe);
      return stats;
    }

    // ===== 澳门六合彩 long dragon: 特码 & 正特1-6 两面 streaks =====
    if (gameKind === 'lhc') {
      // Each dimension maps a value (1-49) to one of two labels, or null for 49 (和),
      // which breaks the streak.
      const DIMENSIONS = [
        { name: 'bs', a: '大', b: '小', cls: (v) => (v === 49 ? null : v >= 25 ? '大' : '小') },
        { name: 'oe', a: '单', b: '双', cls: (v) => (v === 49 ? null : v % 2 === 1 ? '单' : '双') },
        { name: 'he', a: '合单', b: '合双', cls: (v) => (v === 49 ? null : (Math.floor(v / 10) + (v % 10)) % 2 === 1 ? '合单' : '合双') },
        { name: 'wei', a: '尾大', b: '尾小', cls: (v) => (v === 49 ? null : (v % 10) >= 5 ? '尾大' : '尾小') },
        { name: 'animal', a: '野兽', b: '家禽', cls: (v) => (lhcIsDomestic(v) ? '家禽' : '野兽') },
      ];

      // positions: 特码 (index 6) + 正特一..六 (indices 0-5)
      const positions = [
        { idx: 6, name: '特码', betType: 'lhc-tema-twosided', posId: 'tema' },
        ...LHC_CN_NUM.map((cn, i) => ({
          idx: i, name: `正特${cn}`, betType: 'lhc-zhengte-twosided', posId: String(i),
        })),
      ];

      positions.forEach((pos) => {
        DIMENSIONS.forEach((dim) => {
          let consecutive = 0;
          let active = null;
          for (let i = 0; i < history.length; i++) {
            const cls = dim.cls(history[i].numbers[pos.idx]);
            if (cls === null) break;
            if (i === 0) { active = cls; consecutive = 1; }
            else if (cls === active) consecutive++;
            else break;
          }
          if (consecutive < 2 || active === null) return;

          const odds = Math.round(LHC_TEMA_ODDS.A.ds * lhcPankouFactor(lhcPankou) * 100) / 100; // 两面 × 盘口
          const mkBet = (label) => ({
            id: `${pos.betType}-${pos.posId}-${label}`,
            tabId: 'long-dragon',
            positionId: pos.posId,
            positionName: pos.name,
            betName: label,
            odds,
            displayTitle: `${pos.name}-${label}`,
            type: pos.betType,
          });

          stats.push({
            title: `${pos.name}两面-${active}`,
            consecutive,
            opt1Label: dim.a,
            opt2Label: dim.b,
            opt1Id: `${pos.betType}-${pos.posId}-${dim.a}`,
            opt2Id: `${pos.betType}-${pos.posId}-${dim.b}`,
            odds1: odds,
            odds2: odds,
            opt1BetObj: mkBet(dim.a),
            opt2BetObj: mkBet(dim.b),
          });
        });
      });

      return stats.sort((a, b) => b.consecutive - a.consecutive).slice(0, 8);
    }

    // 1. Check positions 1-10 for Big/Small & Odd/Even
    POSITIONS.forEach((pos, idx) => {
      // Big/Small
      let consecutiveBS = 0;
      let activeBS = null;
      for (let i = 0; i < history.length; i++) {
        const num = history[i].numbers[idx];
        const bs = num >= 6 ? '大' : '小';
        if (i === 0) {
          activeBS = bs;
          consecutiveBS = 1;
        } else {
          if (bs === activeBS) {
            consecutiveBS++;
          } else {
            break;
          }
        }
      }
      if (consecutiveBS >= 2) {
        const opt1Label = '大';
        const opt2Label = '小';
        const opt1Id = `position-${pos.id}-twosided-${opt1Label}`;
        const opt2Id = `position-${pos.id}-twosided-${opt2Label}`;
        stats.push({
          title: `${pos.name}-${activeBS}`,
          consecutive: consecutiveBS,
          opt1Label,
          opt2Label,
          opt1Id,
          opt2Id,
          odds1: ODDS.twoSided,
          odds2: ODDS.twoSided,
          opt1BetObj: { id: opt1Id, tabId: 'long-dragon', positionId: pos.id, positionName: pos.name, betName: opt1Label, odds: ODDS.twoSided, displayTitle: `${pos.name}-${opt1Label}`, type: 'twosided' },
          opt2BetObj: { id: opt2Id, tabId: 'long-dragon', positionId: pos.id, positionName: pos.name, betName: opt2Label, odds: ODDS.twoSided, displayTitle: `${pos.name}-${opt2Label}`, type: 'twosided' }
        });
      }

      // Odd/Even
      let consecutiveOE = 0;
      let activeOE = null;
      for (let i = 0; i < history.length; i++) {
        const num = history[i].numbers[idx];
        const oe = num % 2 !== 0 ? '单' : '双';
        if (i === 0) {
          activeOE = oe;
          consecutiveOE = 1;
        } else {
          if (oe === activeOE) {
            consecutiveOE++;
          } else {
            break;
          }
        }
      }
      if (consecutiveOE >= 2) {
        const opt1Label = '单';
        const opt2Label = '双';
        const opt1Id = `position-${pos.id}-twosided-${opt1Label}`;
        const opt2Id = `position-${pos.id}-twosided-${opt2Label}`;
        stats.push({
          title: `${pos.name}-${activeOE}`,
          consecutive: consecutiveOE,
          opt1Label,
          opt2Label,
          opt1Id,
          opt2Id,
          odds1: ODDS.twoSided,
          odds2: ODDS.twoSided,
          opt1BetObj: { id: opt1Id, tabId: 'long-dragon', positionId: pos.id, positionName: pos.name, betName: opt1Label, odds: ODDS.twoSided, displayTitle: `${pos.name}-${opt1Label}`, type: 'twosided' },
          opt2BetObj: { id: opt2Id, tabId: 'long-dragon', positionId: pos.id, positionName: pos.name, betName: opt2Label, odds: ODDS.twoSided, displayTitle: `${pos.name}-${opt2Label}`, type: 'twosided' }
        });
      }

      // Dragon/Tiger (only first 5 positions comparing with symmetric back positions)
      if (idx < 5) {
        let consecutiveDT = 0;
        let activeDT = null;
        const opponentIdx = 9 - idx;
        for (let i = 0; i < history.length; i++) {
          const numSelf = history[i].numbers[idx];
          const numOpp = history[i].numbers[opponentIdx];
          const dt = numSelf > numOpp ? '龙' : '虎';
          if (i === 0) {
            activeDT = dt;
            consecutiveDT = 1;
          } else {
            if (dt === activeDT) {
              consecutiveDT++;
            } else {
              break;
            }
          }
        }
        if (consecutiveDT >= 2) {
          const opt1Label = '龙';
          const opt2Label = '虎';
          const opt1Id = `position-${pos.id}-dragontiger-${opt1Label}`;
          const opt2Id = `position-${pos.id}-dragontiger-${opt2Label}`;
          stats.push({
            title: `${pos.name}-${activeDT}`,
            consecutive: consecutiveDT,
            opt1Label,
            opt2Label,
            opt1Id,
            opt2Id,
            odds1: ODDS.twoSided,
            odds2: ODDS.twoSided,
            opt1BetObj: { id: opt1Id, tabId: 'long-dragon', positionId: pos.id, positionName: pos.name, betName: opt1Label, odds: ODDS.twoSided, displayTitle: `${pos.name}-${opt1Label}`, type: 'dragontiger' },
            opt2BetObj: { id: opt2Id, tabId: 'long-dragon', positionId: pos.id, positionName: pos.name, betName: opt2Label, odds: ODDS.twoSided, displayTitle: `${pos.name}-${opt2Label}`, type: 'dragontiger' }
          });
        }
      }
    });

    // 2. Sum Big/Small
    let consecutiveSumBS = 0;
    let activeSumBS = null;
    for (let i = 0; i < history.length; i++) {
      const sum = history[i].numbers[0] + history[i].numbers[1];
      const bs = sum >= 12 ? '大' : '小';
      if (i === 0) {
        activeSumBS = bs;
        consecutiveSumBS = 1;
      } else {
        if (bs === activeSumBS) {
          consecutiveSumBS++;
        } else {
          break;
        }
      }
    }
    if (consecutiveSumBS >= 2) {
      const opt1Label = '大';
      const opt2Label = '小';
      const opt1Id = `sum-twosided-${opt1Label}`;
      const opt2Id = `sum-twosided-${opt2Label}`;
      stats.push({
        title: `冠亚和-${activeSumBS}`,
        consecutive: consecutiveSumBS,
        opt1Label,
        opt2Label,
        opt1Id,
        opt2Id,
        odds1: ODDS.sumBig,
        odds2: ODDS.sumSmall,
        opt1BetObj: { id: opt1Id, tabId: 'long-dragon', positionId: 'sum', positionName: '冠亚和', betName: opt1Label, odds: ODDS.sumBig, displayTitle: `冠亚和-${opt1Label}`, type: 'sum-twosided' },
        opt2BetObj: { id: opt2Id, tabId: 'long-dragon', positionId: 'sum', positionName: '冠亚和', betName: opt2Label, odds: ODDS.sumSmall, displayTitle: `冠亚和-${opt2Label}`, type: 'sum-twosided' }
      });
    }

    // Sort stats by consecutive count descending and slice top 7
    return stats.sort((a, b) => b.consecutive - a.consecutive).slice(0, 8);
  }, [history, gameKind, lhcPankou]);

  // Get current last issue drawn numbers
  const lastDraw = history[0];

  // Helper to render colored balls row
  const renderBallsRow = (numbers) => {
    if (gameKind === 'k3') {
      return numbers.map((num, idx) => (
        <Dice key={idx} value={num} size={26} />
      ));
    }
    if (gameKind === 'lhc') {
      // Render 6 正码 + "+" + 特码. Each ball is a 波色-colored ring with the number,
      // and its 生肖 (zodiac) beneath.
      const els = [];
      numbers.forEach((num, idx) => {
        if (idx === 6) els.push(<span key="plus" className="lhc-plus">+</span>);
        els.push(
          <span key={idx} className="lhc-ball-wrap">
            <img
              className="lhc-ball"
              src={lhcBallSrc(num)}
              alt={num.toString().padStart(2, '0')}
            />
            <span className="lhc-zodiac">{lhcZodiacOf(num)}</span>
          </span>
        );
      });
      return els;
    }
    if (gameKind === 'xy28') {
      // Render "a + b + c = sum": red balls joined with +, then the blue 总和 badge.
      const sum = numbers.reduce((a, b) => a + b, 0);
      const els = [];
      numbers.forEach((num, idx) => {
        const color = XY28_COLORS[num] || { bg: '#ee5a52', text: '#ffffff' };
        if (idx > 0) {
          els.push(<span key={`op-${idx}`} className="xy28-op">+</span>);
        }
        els.push(
          <span
            key={`b-${idx}`}
            className="pk10-ball xy28-ball"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {num}
          </span>
        );
      });
      els.push(<span key="eq" className="xy28-op">=</span>);
      els.push(
        <span key="sum" className="xy28-sum-badge">{sum}</span>
      );
      return els;
    }
    if (gameKind === 'animal') {
      return numbers.map((num, idx) => (
        <img key={idx} className="pk10-ball animal-ball" src={animalBallSrc(num)} alt={num} />
      ));
    }
    if (gameKind === 'ffc') {
      return numbers.map((num, idx) => (
        <img key={idx} className="pk10-ball" src={ffcBallSrc(num)} alt={num} />
      ));
    }
    if (gameKind === 'pk10') {
      return numbers.map((num, idx) => (
        <img key={idx} className="pk10-ball" src={pk10BallSrc(num)} alt={num} />
      ));
    }
    return numbers.map((num, idx) => {
      const color = COLORS[num] || { bg: '#9ca3af', text: '#ffffff' };
      return (
        <span
          key={idx}
          className="pk10-ball"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {num}
        </span>
      );
    });
  };

  // Format countdown clock (e.g. 00:00:23)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  return (
    <div className="app-container">
      {/* Toast Overlay notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">{renderToastIcon(t.type)}</span>
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Dropdown Overlay for clicking outside */}
      {isHistoryDropdownOpen && (
        <div className="dropdown-overlay" onClick={() => setIsHistoryDropdownOpen(false)} />
      )}

      {/* Header Bar */}
      <header className="app-header">
        <button type="button" className="header-left-group" title="菜单" onClick={() => setIsDrawerOpen(true)}>
          <span className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="5.5" height="5.5" rx="1.6"/>
              <rect x="9.25" y="3" width="5.5" height="5.5" rx="1.6"/>
              <rect x="15.5" y="3" width="5.5" height="5.5" rx="1.6"/>
              <rect x="3" y="9.25" width="5.5" height="5.5" rx="1.6"/>
              <rect x="9.25" y="9.25" width="5.5" height="5.5" rx="1.6"/>
              <rect x="15.5" y="9.25" width="5.5" height="5.5" rx="1.6"/>
              <rect x="3" y="15.5" width="5.5" height="5.5" rx="1.6"/>
              <rect x="9.25" y="15.5" width="5.5" height="5.5" rx="1.6"/>
              <rect x="15.5" y="15.5" width="5.5" height="5.5" rx="1.6"/>
              <circle cx="18.25" cy="5.75" r="2.4" fill="#ef4444" stroke="#e0f2fe" strokeWidth="0.9"/>
            </svg>
          </span>
          <span className="header-title-container">
            {gameName(activeGameId)}
          </span>
        </button>
        <div className="header-right-group">
          {/* 盘口选择 A~D (仅六合彩) */}
          {gameKind === 'lhc' && (
            <div className="history-picker-wrap pankou-picker-wrap">
              <button
                type="button"
                className={`history-picker pankou-picker ${isPankouOpen ? 'open' : ''}`}
                onClick={() => setIsPankouOpen(prev => !prev)}
              >
                <span className="history-picker-value">{(LHC_PANKOU.find(p => p.id === lhcPankou) || {}).name}</span>
                <svg className="history-picker-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isPankouOpen && (
                <div className="history-dropdown-menu">
                  {LHC_PANKOU.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`history-dropdown-item ${p.id === lhcPankou ? 'active' : ''}`}
                      onClick={() => {
                        setLhcPankou(p.id);
                        setIsPankouOpen(false);
                        clearSelections();
                      }}
                    >
                      <span>{p.name}</span>
                      {p.id === lhcPankou && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button type="button" className="icon-btn" title="侧边栏" onClick={() => setIsRightDrawerOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </header>
      {isPankouOpen && (
        <div className="header-pankou-backdrop" onClick={() => setIsPankouOpen(false)} />
      )}

      {/* Draw Banner (Game status rows) */}
      <div className="draw-banner">
        <div className="draw-banner-header" style={{ position: 'relative' }}>
          {/* Row 1: Last Issue & Results */}
          <div 
            className="draw-row clickable" 
            onClick={() => setIsHistoryDropdownOpen(prev => !prev)}
          >
            <span className="issue-number">{lastDraw ? `${lastDraw.issue}期` : '加载中'}</span>
            <div className="ball-row">
              {lastDraw ? renderBallsRow(lastDraw.numbers) : null}
            </div>
            <button
              type="button"
              className={`icon-btn ${isHistoryDropdownOpen ? 'active' : ''}`}
              title="历史开奖 / 盈亏记录"
              style={{ color: theme === 'midnight-purple' ? '#9B7BFF' : theme === 'midnight-blue' ? '#7199FE' : '#3b82f6', display: 'flex', alignItems: 'center', gap: '2px' }}
              onClick={(e) => {
                e.stopPropagation();
                setIsHistoryDropdownOpen(prev => !prev);
              }}
            >
              {/* History records / win-loss icon */}
              <img src={`${import.meta.env.BASE_URL}${theme === 'midnight-blue' || theme === 'midnight-purple' ? 'rotate-ccw-db.png' : 'rotate-ccw.png'}`} width="20" height="20" alt="历史开奖" />
              {/* Caret to indicate expandable dropdown */}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{
                  transition: 'transform 0.2s ease',
                  transform: isHistoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>

          {/* Row 2: Next Issue & Countdown */}
          <div className="draw-row">
            <span className="issue-number">{(gameKind === 'pk10' ? currentIssue.toString().padStart(5, '0') : currentIssue.toString())}期</span>
            <div className="countdown-container">
              {isClosed ? (
                <span className="status-closed">已封盘</span>
              ) : (
                <>
                  <div className="countdown-item open seal">
                    封盘 <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{formatTime(timeLeft - lockSeconds)}</span>
                  </div>
                  <div className="countdown-item open">
                    开奖 <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{formatTime(timeLeft)}</span>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              className={`icon-btn ${isVideoOpen ? 'active' : ''}`}
              title="开奖动画 / 直播视频"
              style={{ color: theme === 'midnight-purple' ? '#9B7BFF' : theme === 'midnight-blue' ? '#7199FE' : '#3b82f6', display: 'flex', alignItems: 'center', gap: '2px' }}
              onClick={() => setIsVideoOpen(prev => !prev)}
            >
              <img src={`${import.meta.env.BASE_URL}${theme === 'midnight-blue' || theme === 'midnight-purple' ? 'youtube-db.png' : 'youtube.png'}`} width="20" height="20" alt="开奖动画" />
              {/* Caret to indicate expandable player */}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{
                  transition: 'transform 0.2s ease',
                  transform: isVideoOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>

          {/* History Dropdown Menu */}
          {isHistoryDropdownOpen && (
            <div className="history-dropdown">
              {history.slice(0, 5).map((item) => (
                <div key={item.issue} className="history-dropdown-row">
                  <span className="history-issue">{item.issue}期</span>
                  <div className="history-balls">
                    {renderBallsRow(item.numbers)}
                  </div>
                  <div className="history-result">
                    <span className="result-label">结果</span>
                    <span className={`result-val ${item.winLoss > 0 ? 'win' : item.winLoss < 0 ? 'loss' : 'zero'}`}>
                      {item.winLoss > 0 
                        ? item.winLoss.toFixed(2) 
                        : (item.winLoss === 0 || item.winLoss === undefined ? '0.00' : item.winLoss.toFixed(2))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Live Race Animation Player (PK10 only) */}
        {gameKind === 'pk10' ? (
          <RaceAnimation
            activeGame={activeGame}
            isVideoOpen={isVideoOpen}
            activeGameId={activeGameId}
          />
        ) : (
          isVideoOpen && (
            <div className={`video-player-container open ${gameKind === 'k3' ? 'k3' : gameKind === 'xy28' ? 'xy28' : gameKind === 'lhc' ? 'lhc' : gameKind === 'animal' ? 'animal' : ''}`}>
              {/* 动物运动会 embeds the full Cocos scene (which has its own header),
                  so skip the app's result top-bar for it. */}
              {gameKind !== 'animal' && (
                <div className="video-top-bar">
                  <span className="video-logo">{gameName(activeGameId)}</span>
                  <div className="video-rank-row">
                    {lastDraw && renderBallsRow(lastDraw.numbers)}
                  </div>
                </div>
              )}
              {gameKind === 'animal' ? (
                <AnimalAnimation
                  activeGameId={activeGameId}
                  activeGame={activeGame}
                  lockSeconds={lockSeconds}
                />
              ) : gameKind === 'lhc' ? (
                <LhcAnimation
                  activeGame={activeGame}
                  gameName={gameName(activeGameId)}
                  lockSeconds={lockSeconds}
                />
              ) : gameKind === 'k3' ? (
                <K3Animation
                  activeGame={activeGame}
                  gameName={gameName(activeGameId)}
                  lockSeconds={lockSeconds}
                />
              ) : gameKind === 'xy28' ? (
                <Xy28Animation
                  activeGame={activeGame}
                  gameName={gameName(activeGameId)}
                  lockSeconds={lockSeconds}
                />
              ) : (
                <FfcAnimation
                  activeGame={activeGame}
                  gameName={gameName(activeGameId)}
                  lockSeconds={lockSeconds}
                />
              )}
            </div>
          )
        )}
      </div>

      {/* Main Split Layout */}
      <div className="main-layout">
        {/* Left Sidebar Menu */}
        <nav className="sidebar-menu">
          {/* 动物运动会 has no 跟单计划 entry；且需在设置中开启此功能。 */}
          {followPlanEnabled && gameKind !== 'animal' && (
            <button
              type="button"
              className="follow-plan-btn"
              onClick={() => setIsFollowPlanOpen(true)}
            >
              {/* 边框 + 铅笔来自 public/plan.png（用 CSS mask 按皮肤主色上色） */}
              <span className="follow-plan-btn-label">跟单计划</span>
            </button>
          )}
          {sidebarTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`sidebar-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.name}
              </button>
            );
          })}
        </nav>

        {/* Right Active Betting Area */}
        <PlayArea
          activeTab={activeTab}
          selectedBets={selectedBets}
          onToggleBet={handleToggleBet}
          longDragonStats={longDragonStats}
          isClosed={isClosed}
          selectedShortcutPositions={selectedShortcutPositions}
          setSelectedShortcutPositions={setSelectedShortcutPositions}
          selectedShortcutOptions={selectedShortcutOptions}
          gameKind={gameKind}
          pankou={lhcPankou}
          onSetQuickBets={handleSetQuickBets}
          clearNonce={clearNonce}
        />
      </div>

      {/* Bottom Footer Controls */}
      <Footer
        balance={balance}
        onRefreshBalance={handleRefreshBalance}
        selectedBetsCount={selectedBets.length}
        selectedBetsTotal={selectedBetsTotal}
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        onReset={handleReset}
        onSubmit={handleSubmitBets}
        isClosed={isClosed}
        chipValues={chipValues}
        onOpenChipEdit={() => setIsChipEditOpen(true)}
      />

      {/* 跟单计划 (Follow-Plan) Modal */}
      <FollowPlanModal
        open={isFollowPlanOpen}
        onClose={() => setIsFollowPlanOpen(false)}
        gameKind={gameKind}
        activeGameId={activeGameId}
        addToast={addToast}
        onFollowBet={handleFollowBet}
        onOpenMenu={() => setIsRightDrawerOpen(true)}
        followPlans={followPlans}
        placedBets={placedBets}
        settledBets={settledBets}
        gamesState={gamesState}
        balance={balance}
        formatIssue={fmtFollowIssue}
        chipValues={chipValues}
        onOpenChipEdit={() => setIsChipEditOpen(true)}
        onCreatePlan={onCreatePlan}
        onEditPlan={onEditPlan}
        onStopPlan={onStopPlan}
      />

      {/* 编辑快捷金额弹窗（投注页 footer 与 自动跟投 共用） */}
      <ChipEditModal
        open={isChipEditOpen}
        chipValues={chipValues}
        onSave={handleUpdateChips}
        onClose={() => setIsChipEditOpen(false)}
        overPlan={isFollowPlanOpen}
      />

      {/* 编辑快捷倍数弹窗（投注确认弹窗-批量修改倍数，样式复用编辑快捷金额） */}
      <ChipEditModal
        open={isMultiplierEditOpen}
        chipValues={multiplierValues}
        onSave={handleUpdateMultipliers}
        onClose={() => setIsMultiplierEditOpen(false)}
        overConfirm
        title="编辑快捷倍数"
        suffix="倍"
        defaultValues={['1', '2', '5', '10', '20']}
      />

      {/* Bet Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className={`modal-overlay${isFollowPlanOpen ? ' modal-overlay--over-plan' : ''}`}>
          <div className="confirm-modal-content">
            <div className="confirm-modal-header">
              <span className="confirm-modal-title">
                {gameName(confirmGameId || activeGameId)}
              </span>
              <button 
                type="button" 
                className="confirm-modal-close" 
                onClick={() => setIsConfirmModalOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="confirm-modal-summary">
              <span>项目笔数: <strong>{confirmBets.length}</strong></span>
              <span>投注金额: <strong>{confirmBets.reduce((sum, b) => sum + b.amount, 0)}</strong></span>
            </div>
            
            <div className="confirm-modal-list">
              {confirmBets.map((bet) => (
                <div key={bet.id} className="confirm-bet-row">
                  <div className="confirm-bet-info">
                    <span className="confirm-bet-name">{bet.displayTitle}</span>
                    <span className="confirm-bet-odds">{bet.odds}</span>
                  </div>
                  <div className="confirm-bet-actions">
                    <input
                      type="number"
                      pattern="[0-9]*"
                      className="confirm-bet-input"
                      value={bet.amount === 0 ? '' : bet.amount}
                      onChange={(e) => handleIndividualAmountChange(bet.id, e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="confirm-bet-delete"
                      onClick={() => handleDeleteConfirmBet(bet.id)}
                      title="删除投注"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="confirm-modal-bulk">
              <button
                type="button"
                className="bulk-mode-toggle"
                onClick={() => setBulkMode(m => (m === 'amount' ? 'multiplier' : 'amount'))}
                title={bulkMode === 'amount' ? '切换为修改倍数' : '切换为修改金额'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <polyline points="16 4 20 8 16 12" />
                  <line x1="20" y1="16" x2="4" y2="16" />
                  <polyline points="8 12 4 16 8 20" />
                </svg>
              </button>
              <span className="bulk-label">{bulkMode === 'amount' ? '修改金额:' : '修改倍数:'}</span>
              {bulkMode === 'amount' ? (
                <input
                  type="number"
                  pattern="[0-9]*"
                  className="confirm-bulk-input"
                  value={bulkAmount}
                  onChange={(e) => handleBulkAmountChange(e.target.value)}
                  placeholder="修改所有投注金额"
                />
              ) : (
                <div className="bulk-multiplier-row">
                  {multiplierValues.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`chip-btn ${activeMultiplier === m ? 'active' : ''}`}
                      onClick={() => handleBulkMultiplierChange(m)}
                    >
                      {m}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="edit-chip-btn"
                    onClick={() => setIsMultiplierEditOpen(true)}
                    title="编辑快捷倍数"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            <div className="confirm-modal-footer">
              <div className="confirm-modal-balance">
                <span>余额：</span>
                <strong>{balance.toLocaleString()}</strong>
                <button
                  type="button"
                  className="reload-btn"
                  onClick={handleRefreshBalance}
                  title="刷新余额"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </button>
              </div>
              <div className="confirm-modal-footer-btns">
                <button
                  type="button"
                  className="confirm-btn-cancel"
                  onClick={() => setIsConfirmModalOpen(false)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="confirm-btn-ok"
                  onClick={handleConfirmSubmit}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Selection Drawer */}
      <GameDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectGame={handleSelectGame}
        activeGameId={activeGameId}
        gameTimers={{
          pk10_1m: gamesState.pk10_1m.timeLeft,
          pk10_5m: gamesState.pk10_5m.timeLeft,
          pk10_10m: gamesState.pk10_10m.timeLeft,
        }}
      />

      {/* Right Menu Drawer */}
      <RightMenuDrawer
        isOpen={isRightDrawerOpen}
        onClose={() => setIsRightDrawerOpen(false)}
        balance={balance}
        onRefreshBalance={handleRefreshBalance}
        onSelectPlanCenter={() => setIsFollowPlanOpen(true)}
        showPlanCenter={followPlanEnabled}
        onSelectUnsettled={() => { setCurrentPage('unsettled'); setIsFollowPlanOpen(false); }}
        onSelectSettled={() => { setCurrentPage('settled'); setIsFollowPlanOpen(false); }}
        onSelectBetting={() => { setCurrentPage('betting'); setIsFollowPlanOpen(false); }}
        onSelectHistory={() => { setCurrentPage('history'); setIsFollowPlanOpen(false); }}
        onSelectSettings={() => { setCurrentPage('settings'); setIsFollowPlanOpen(false); }}
        activeItem={isFollowPlanOpen ? '计划中心' : currentPage === 'betting' ? '投注' : currentPage === 'unsettled' ? '未结明细' : currentPage === 'settled' ? '今日已结' : currentPage === 'history' ? '开奖历史' : currentPage === 'settings' ? '设置' : ''}
        unsettledAmount={placedBets.reduce((acc, b) => acc + b.amount, 20)}
        elevated={isFollowPlanOpen}
      />

      {/* Unsettled Details Full Page Overlay */}
      {currentPage === 'unsettled' && (
        <UnsettledDetails
          onBack={() => setCurrentPage('betting')}
          onOpenMenu={() => setIsRightDrawerOpen(true)}
          placedBets={placedBets}
          currentIssue={currentIssue}
          addToast={addToast}
        />
      )}

      {/* Settled Details Full Page Overlay */}
      {currentPage === 'settled' && (
        <SettledDetails
          onBack={() => setCurrentPage('betting')}
          onOpenMenu={() => setIsRightDrawerOpen(true)}
          settledBets={settledBets}
          addToast={addToast}
        />
      )}

      {/* Draw History Full Page Overlay */}
      {currentPage === 'history' && (
        <DrawHistory
          onBack={() => setCurrentPage('betting')}
          onOpenMenu={() => setIsRightDrawerOpen(true)}
        />
      )}

      {/* Settings Full Page Overlay */}
      {currentPage === 'settings' && (
        <SettingsPage
          onBack={() => setCurrentPage('betting')}
          onOpenMenu={() => setIsRightDrawerOpen(true)}
          theme={theme}
          onChangeTheme={setTheme}
          lang={lang}
          onChangeLang={handleChangeLang}
          followPlanEnabled={followPlanEnabled}
          onToggleFollowPlan={setFollowPlanEnabled}
          confirmBulkDefault={confirmBulkDefault}
          onChangeConfirmBulkDefault={setConfirmBulkDefault}
          onLogout={handleLogout}
          hideLogout={EMBED.embedded}
        />
      )}

      {/* Login Page Overlay */}
      {!loggedIn && <LoginPage onLogin={() => setLoggedIn(true)} />}
    </div>
  );
}
