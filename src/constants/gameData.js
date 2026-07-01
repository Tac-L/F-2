// PK10 ("一分极速飞艇") Game Configurations

// Colors for PK10 numbers 1 to 10
export const PK10_COLORS = {
  1: { bg: '#eab308', text: '#ffffff' }, // Yellow
  2: { bg: '#3b82f6', text: '#ffffff' }, // Blue
  3: { bg: '#4b5563', text: '#ffffff' }, // Dark Gray
  4: { bg: '#f97316', text: '#ffffff' }, // Orange
  5: { bg: '#22d3ee', text: '#ffffff' }, // Cyan
  6: { bg: '#7c3aed', text: '#ffffff' }, // Purple
  7: { bg: '#9ca3af', text: '#ffffff' }, // Gray
  8: { bg: '#ef4444', text: '#ffffff' }, // Red
  9: { bg: '#7f1d1d', text: '#ffffff' }, // Burgundy/Dark Red
  10: { bg: '#22c55e', text: '#ffffff' }, // Green
};

// Tabs list for the left sidebar
export const SIDEBAR_TABS = [
  { id: 'long-dragon', name: '长龙' },
  { id: 'shortcut', name: '快捷' },
  { id: 'guess-number', name: '猜号码' },
  { id: 'two-sided', name: '两面盘' },
  { id: 'sum-combination', name: '冠亚和' },
];

// Positions for PK10
export const POSITIONS = [
  { id: 'p1', name: '冠军', key: '1st' },
  { id: 'p2', name: '亚军', key: '2nd' },
  { id: 'p3', name: '第三名', key: '3rd' },
  { id: 'p4', name: '第四名', key: '4th' },
  { id: 'p5', name: '第五名', key: '5th' },
  { id: 'p6', name: '第六名', key: '6th' },
  { id: 'p7', name: '第七名', key: '7th' },
  { id: 'p8', name: '第八名', key: '8th' },
  { id: 'p9', name: '第九名', key: '9th' },
  { id: 'p10', name: '第十名', key: '10th' },
];

// Position label mapping for the shortcut tab header (shorter versions)
export const SHORTCUT_POSITIONS = [
  { id: 'p1', name: '冠军' },
  { id: 'p2', name: '亚军' },
  { id: 'p3', name: '第三' },
  { id: 'p4', name: '第四' },
  { id: 'p5', name: '第五' },
  { id: 'p6', name: '第六' },
  { id: 'p7', name: '第七' },
  { id: 'p8', name: '第八' },
  { id: 'p9', name: '第九' },
  { id: 'p10', name: '第十' },
];

// Odds details
export const ODDS = {
  number: 10,     // Odds for guessing specific numbers (1-10)
  twoSided: 2,    // Odds for Big/Small, Odd/Even, Dragon/Tiger
  sumBig: 2.25,   // Sum: Big
  sumSmall: 1.8,  // Sum: Small
  sumOdd: 2,      // Sum: Odd
  sumEven: 2,     // Sum: Even
  // Sum specific numbers mapping (3 to 19)
  sumNumbers: {
    3: 45,
    4: 45,
    5: 22.5,
    6: 22.5,
    7: 15,
    8: 15,
    9: 11.25,
    10: 11.25,
    11: 9,
    12: 11.25,
    13: 11.25,
    14: 15,
    15: 15,
    16: 22.5,
    17: 22.5,
    18: 45,
    19: 45,
  }
};

// ======================= 分分彩 (FFC) Game Configurations =======================
// 分分彩 draws 5 balls, each ball is a single digit 0-9.

// Colors for FFC digits 0 to 9
export const FFC_COLORS = {
  0: { bg: '#a855f7', text: '#ffffff' }, // Purple
  1: { bg: '#eab308', text: '#ffffff' }, // Gold/Yellow
  2: { bg: '#3b82f6', text: '#ffffff' }, // Blue
  3: { bg: '#7f1d1d', text: '#ffffff' }, // Burgundy/Dark Red
  4: { bg: '#f97316', text: '#ffffff' }, // Orange
  5: { bg: '#22d3ee', text: '#ffffff' }, // Cyan
  6: { bg: '#22c55e', text: '#ffffff' }, // Green
  7: { bg: '#9ca3af', text: '#ffffff' }, // Gray
  8: { bg: '#ef4444', text: '#ffffff' }, // Red
  9: { bg: '#4f46e5', text: '#ffffff' }, // Indigo
};

// Left sidebar tabs for FFC
export const FFC_SIDEBAR_TABS = [
  { id: 'long-dragon', name: '长龙' },
  { id: 'guess-ball', name: '猜球号' },
  { id: 'two-sided', name: '两面盘' },
  { id: 'front-mid-back', name: '前中后' },
];

// The 5 ball positions for FFC
export const FFC_POSITIONS = [
  { id: 'b1', name: '第1球', index: 0 },
  { id: 'b2', name: '第2球', index: 1 },
  { id: 'b3', name: '第3球', index: 2 },
  { id: 'b4', name: '第4球', index: 3 },
  { id: 'b5', name: '第5球', index: 4 },
];

// Odds for FFC play types
export const FFC_ODDS = {
  number: 10,     // 猜球号: guessing a specific digit 0-9
  twoSided: 2,    // 两面盘 / 长龙: 大、小、单、双
  dragon: 2.22,   // 龙
  tiger: 2.22,    // 虎
  he: 10,         // 和
  baozi: 100,     // 豹子 (three of a kind)
  shunzi: 16.66,  // 顺子 (straight)
  duizi: 3.7,     // 对子 (pair)
  banshun: 2.77,  // 半顺 (half straight)
  zaliu: 3.33,    // 杂六 (none of the above)
};

// 前中后: the three 3-ball groups
export const FFC_TRIPLE_GROUPS = [
  { id: 'front', name: '前三球', indices: [0, 1, 2] },
  { id: 'mid', name: '中三球', indices: [1, 2, 3] },
  { id: 'back', name: '后三球', indices: [2, 3, 4] },
];

// 前中后 betting options per group
export const FFC_TRIPLE_OPTIONS = [
  { key: '豹子', odds: FFC_ODDS.baozi },
  { key: '顺子', odds: FFC_ODDS.shunzi },
  { key: '对子', odds: FFC_ODDS.duizi },
  { key: '半顺', odds: FFC_ODDS.banshun },
  { key: '杂六', odds: FFC_ODDS.zaliu },
];

// Classify a 3-digit group into one of the 前中后 categories.
// Categories are mutually exclusive; each draw matches exactly one.
export function classifyFfcTriple(a, b, c) {
  const arr = [a, b, c];
  const uniqueCount = new Set(arr).size;

  // 豹子: all three identical
  if (uniqueCount === 1) return '豹子';
  // 对子: exactly two identical
  if (uniqueCount === 2) return '对子';

  // All three distinct -> 顺子 / 半顺 / 杂六
  const sorted = [...arr].sort((x, y) => x - y);
  const isStraight = sorted[1] - sorted[0] === 1 && sorted[2] - sorted[1] === 1;
  // wrap-around straights (8,9,0) and (9,0,1)
  const isWrapStraight =
    (sorted[0] === 0 && sorted[1] === 8 && sorted[2] === 9) ||
    (sorted[0] === 0 && sorted[1] === 1 && sorted[2] === 9);
  if (isStraight || isWrapStraight) return '顺子';

  // 半顺: any two of the three are adjacent (incl. 0/9 wrap)
  const hasAdjacent =
    sorted[1] - sorted[0] === 1 ||
    sorted[2] - sorted[1] === 1 ||
    (sorted[0] === 0 && sorted[2] === 9);
  if (hasAdjacent) return '半顺';

  // 杂六: none of the above
  return '杂六';
}

// ======================= 快三 (K3) Game Configurations =======================
// 快三 draws 3 dice, each die is 1-6. 和值 (sum) ranges 3-18.

// Left sidebar tabs for K3
export const K3_SIDEBAR_TABS = [
  { id: 'long-dragon', name: '长龙' },
  { id: 'three-army', name: '三军' },
  { id: 'short-pair', name: '短牌' },
  { id: 'long-pair', name: '长牌' },
  { id: 'all-triple', name: '全骰' },
  { id: 'sum', name: '和值' },
  { id: 'two-same', name: '二同号' },
  { id: 'three-diff', name: '三不同' },
];

// Odds for K3 play types
export const K3_ODDS = {
  threeArmy: 2,        // 三军: a chosen number (1-6) appears on at least one die
  shortPair: 13.5,     // 短牌: a chosen number appears on at least two dice
  longPair: 7.2,       // 长牌 (二不同号): two chosen distinct numbers both appear
  specificTriple: 216, // 全骰: a specific triple (e.g. 1-1-1)
  anyTriple: 36,       // 全骰: any triple
  sumTwoSided: 2.05,   // 和值 大/小/单/双
  twoSame: 72,         // 二同号: exact pattern of two identical + one different
  threeDiff: 36,       // 三不同: three distinct specific numbers
};

// 和值 (sum) specific-number odds, sums 3-18. Odds are 216 / (number of dice combos).
export const K3_SUM_ODDS = {
  3: 216, 4: 72, 5: 36, 6: 21.6, 7: 14.4, 8: 10.28, 9: 8.64, 10: 8,
  11: 8, 12: 8.64, 13: 10.28, 14: 14.4, 15: 21.6, 16: 36, 17: 72, 18: 216,
};

// 二同号: every "two identical + one different" pattern, order-independent.
// 6 pair-values × 5 single-values = 30 combos. Stored as [pairValue, singleValue].
export const K3_TWO_SAME = (() => {
  const combos = [];
  for (let pair = 1; pair <= 6; pair++) {
    for (let single = 1; single <= 6; single++) {
      if (single !== pair) combos.push([pair, single]);
    }
  }
  return combos;
})();

// 三不同: every set of three distinct numbers, order-independent. C(6,3) = 20 combos.
export const K3_THREE_DIFF = (() => {
  const combos = [];
  for (let a = 1; a <= 6; a++) {
    for (let b = a + 1; b <= 6; b++) {
      for (let c = b + 1; c <= 6; c++) {
        combos.push([a, b, c]);
      }
    }
  }
  return combos;
})();

// 短牌: the 6 二同号 pairs (1-1 ... 6-6)
export const K3_SHORT_PAIRS = [1, 2, 3, 4, 5, 6];

// 长牌: the 15 二不同号 combinations (a < b)
export const K3_LONG_PAIRS = (() => {
  const pairs = [];
  for (let a = 1; a <= 6; a++) {
    for (let b = a + 1; b <= 6; b++) {
      pairs.push([a, b]);
    }
  }
  return pairs;
})();

// 全骰: the 6 specific triples (1-1-1 ... 6-6-6)
export const K3_TRIPLES = [1, 2, 3, 4, 5, 6];

// Classify the 和值 (sum of 3 dice) into 大/小 — sums 11-18 are 大, 3-10 are 小.
export const k3SumBig = (sum) => sum >= 11;

// ======================= 幸运28 (XY28) Game Configurations =======================
// 幸运28 draws 3 balls, each ball is a single digit 0-9. 总和 (sum) ranges 0-27.

// Colors for XY28 result balls. The balls render as warm-red circles (matching the
// site), while the 总和 itself is shown as a blue badge.
export const XY28_COLORS = (() => {
  const map = {};
  for (let i = 0; i <= 9; i++) {
    map[i] = { bg: '#ee5a52', text: '#ffffff' };
  }
  return map;
})();

// Left sidebar tabs for XY28
export const XY28_SIDEBAR_TABS = [
  { id: 'long-dragon', name: '长龙' },
  { id: 'sum', name: '总和' },
  { id: 'side-ball', name: '边球' },
  { id: 'tail-ball', name: '尾球' },
  { id: 'dragon-tiger-leopard', name: '龙虎豹' },
  { id: 'extreme', name: '极值' },
  { id: 'three-ball', name: '三球' },
];

// Number of 3-digit (0-9 each) combinations producing each 总和 value 0-27.
// 大单/小单… ranges below are derived from these counts.
export const XY28_SUM_COUNTS = (() => {
  const counts = {};
  for (let a = 0; a <= 9; a++) {
    for (let b = 0; b <= 9; b++) {
      for (let c = 0; c <= 9; c++) {
        const s = a + b + c;
        counts[s] = (counts[s] || 0) + 1;
      }
    }
  }
  return counts;
})();

// 总和 specific-number odds: 1000 / (combinations), truncated to 2 decimals.
export const xy28SumOdds = (sum) =>
  Math.floor((1000 / XY28_SUM_COUNTS[sum]) * 100) / 100;

// 总和 大小 boundary: sums 14-27 are 大, sums 0-13 are 小.
export const xy28SumBig = (sum) => sum >= 14;

// Odds for the XY28 play types (posted by the site).
export const XY28_ODDS = {
  // 总和 两面
  sumTwoSided: 2,    // 大 / 小 / 单 / 双
  sumDaDan: 4.32,    // 大单 (大 & 单)
  sumXiaoDan: 3.71,  // 小单 (小 & 单)
  sumDaShuang: 3.71, // 大双 (大 & 双)
  sumXiaoShuang: 4.32, // 小双 (小 & 双)
  // 边球 (based on 总和 range)
  bian: 2.27,        // 边: 总和 0-9 或 18-27
  zhong: 1.78,       // 中: 总和 10-17
  daBian: 4.54,      // 大边: 总和 18-27
  xiaoBian: 4.54,    // 小边: 总和 0-9
  // 尾球 (based on the last digit of 总和)
  tailNumber: 10,    // 尾数 0-9
  tailTwoSided: 2.5, // 尾 大 / 小 / 单 / 双
  tailCombo: 5,      // 尾 大单 / 小单 / 大双 / 小双
  // 龙虎豹 (总和 mod 3)
  dtl: 2.99,         // 龙 (余0) / 虎 (余1) / 豹 (余2)
  // 极值
  extreme: 17.85,    // 极大 (总和 22-27) / 极小 (总和 0-5)
  // 三球 (复用 顺子/豹子/对子 分类)
  shunzi: 16.66,     // 顺子 (含环形 8-9-0 / 9-0-1)
  baozi: 100,        // 豹子 (三同号)
  duizi: 3.7,        // 对子 (二同号)
};

// 龙虎豹 betting options. Each group is the set of 总和 values with sum % 3 === mod.
export const XY28_DTL_OPTIONS = [
  { label: '龙', odds: XY28_ODDS.dtl, mod: 0 },
  { label: '虎', odds: XY28_ODDS.dtl, mod: 1 },
  { label: '豹', odds: XY28_ODDS.dtl, mod: 2 },
];

// 极值 betting options. nums lists the 总和 values that win the group.
export const XY28_EXTREME_OPTIONS = [
  { label: '极大', odds: XY28_ODDS.extreme, nums: [22, 23, 24, 25, 26, 27] },
  { label: '极小', odds: XY28_ODDS.extreme, nums: [0, 1, 2, 3, 4, 5] },
];

// 三球 betting options (classified via classifyFfcTriple on the 3 balls).
export const XY28_THREE_BALL_OPTIONS = [
  { label: '顺子', odds: XY28_ODDS.shunzi },
  { label: '豹子', odds: XY28_ODDS.baozi },
  { label: '对子', odds: XY28_ODDS.duizi },
];

// 总和 两面 betting options: [label, oddsKey, betName used at settlement]
export const XY28_SUM_TWO_SIDED = [
  { label: '大', odds: XY28_ODDS.sumTwoSided },
  { label: '小', odds: XY28_ODDS.sumTwoSided },
  { label: '单', odds: XY28_ODDS.sumTwoSided },
  { label: '双', odds: XY28_ODDS.sumTwoSided },
  { label: '大单', odds: XY28_ODDS.sumDaDan },
  { label: '小单', odds: XY28_ODDS.sumXiaoDan },
  { label: '大双', odds: XY28_ODDS.sumDaShuang },
  { label: '小双', odds: XY28_ODDS.sumXiaoShuang },
];

// 边球 betting options
export const XY28_SIDE_OPTIONS = [
  { label: '边', odds: XY28_ODDS.bian },
  { label: '中', odds: XY28_ODDS.zhong },
  { label: '大边', odds: XY28_ODDS.daBian },
  { label: '小边', odds: XY28_ODDS.xiaoBian },
];

// 尾球 两面 betting options
export const XY28_TAIL_TWO_SIDED = [
  { label: '大', odds: XY28_ODDS.tailTwoSided },
  { label: '小', odds: XY28_ODDS.tailTwoSided },
  { label: '单', odds: XY28_ODDS.tailTwoSided },
  { label: '双', odds: XY28_ODDS.tailTwoSided },
  { label: '大单', odds: XY28_ODDS.tailCombo },
  { label: '小单', odds: XY28_ODDS.tailCombo },
  { label: '大双', odds: XY28_ODDS.tailCombo },
  { label: '小双', odds: XY28_ODDS.tailCombo },
];

// ======================= 澳门六合彩 (LHC) Game Configurations =======================
// Mark Six: each draw produces 6 正码 (regular) + 1 特码 (special), all unique numbers
// from 1-49. In our draw array index 0-5 are 正码 (draw order), index 6 is the 特码.

// 波色 (color waves) — every number 1-49 belongs to exactly one of 红 / 绿 / 蓝.
export const LHC_RED = [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46];
export const LHC_GREEN = [5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49];
export const LHC_BLUE = [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48];

export const lhcColorOf = (n) =>
  LHC_RED.includes(n) ? 'red' : LHC_GREEN.includes(n) ? 'green' : 'blue';

// Hex per 波色 (used for the colored ball ring + number in the draw banner / grid).
export const LHC_WAVE_HEX = {
  red: '#e3342f',
  green: '#16a34a',
  blue: '#2563eb',
};

// 生肖 (zodiac). Derived so that 07 -> 鼠 (matching the reference screenshots, a 马 year).
export const LHC_ZODIACS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
export const lhcZodiacOf = (n) => LHC_ZODIACS[(((7 - n) % 12) + 12) % 12];

// 家禽 (domestic): 牛、马、羊、鸡、狗、猪 ; 野兽 (wild): 鼠、虎、龙、蛇、兔、猴
export const LHC_DOMESTIC = ['牛', '马', '羊', '鸡', '狗', '猪'];
export const lhcIsDomestic = (n) => LHC_DOMESTIC.includes(lhcZodiacOf(n));

// 特肖: each 生肖 -> its 号码 set (1-49). 马 covers 5 号码 (01,13,25,37,49), 其余 4 个。
export const LHC_TEXIAO_NUMBERS = (() => {
  const map = {};
  LHC_ZODIACS.forEach((z) => { map[z] = []; });
  for (let n = 1; n <= 49; n++) map[lhcZodiacOf(n)].push(n);
  return map;
})();

// 特肖 odds — 5 号码的生肖 (马) 赔率较低 9.1, 其余 4 号码 11.55.
export const lhcTexiaoOdds = (zodiac) =>
  (LHC_TEXIAO_NUMBERS[zodiac].length === 5 ? 9.1 : 11.55);

// 正肖 / 一肖 / 一肖不中 odds. The 5-号码 生肖 (马) is priced separately.
// 一肖不中 inverts the logic, so 马 (more 号码 → harder to miss) pays MORE.
export const LHC_XIAO_ODDS = {
  zhengxiao: { normal: 1.4891, ma: 1.1245 }, // 正肖 (命中正码数倍增派彩)
  yixiao: { normal: 1.41, ma: 1.1 },         // 一肖
  'yixiao-no': { normal: 1.19, ma: 1.54 },   // 一肖不中
};
export const lhcXiaoOdds = (play, zodiac) =>
  (LHC_TEXIAO_NUMBERS[zodiac].length === 5 ? LHC_XIAO_ODDS[play].ma : LHC_XIAO_ODDS[play].normal);

// 尾数 groups: 尾数 0-9 -> 号码 set. 0尾 has 4 号码 (10,20,30,40), 其余 5 个.
export const LHC_TAIL_GROUPS = (() => {
  const arr = [];
  for (let t = 0; t <= 9; t++) {
    const nums = [];
    for (let n = 1; n <= 49; n++) if (n % 10 === t) nums.push(n);
    arr.push({ tail: t, nums });
  }
  return arr;
})();

// 头数 groups: 头数 0-4 -> 号码 set. 0头 has 9 号码 (01-09), 其余 10 个.
export const LHC_HEAD_GROUPS = (() => {
  const arr = [];
  for (let h = 0; h <= 4; h++) {
    const nums = [];
    for (let n = 1; n <= 49; n++) if (Math.floor(n / 10) === h) nums.push(n);
    arr.push({ head: h, nums });
  }
  return arr;
})();

// 尾数 / 尾数不中 / 特码尾数 / 特码头数 odds. The smaller group (0尾 4 号 / 0头 9 号)
// is priced separately; 尾数不中 inverts so the smaller group pays LESS.
export const lhcWeishuOdds = (tail) => (tail === 0 ? 1.41 : 1.1);      // 尾数 (含)
export const lhcWeishuNoOdds = (tail) => (tail === 0 ? 1.19 : 1.54);  // 尾数不中
export const lhcTeweishuOdds = (tail) => (tail === 0 ? 11.55 : 9.1);  // 特码尾数
export const lhcTetoushuOdds = (head) => (head === 0 ? 4.74 : 4.2);   // 特码头数

// 半波: 波色 × 属性. 特码 同时符合该波色与属性 (大小单双合单合双大单小单大双小双) 即中。
// 属性复用 lhcTwoSidedWin (49 在所有属性下均不命中, 故不出现在任何半波卡)。
export const LHC_BANBO_PROPS = ['大', '小', '单', '双', '合单', '合双', '大单', '小单', '大双', '小双'];

// Per-card odds taken directly from the reference screenshots (not count-derived).
export const LHC_BANBO_ODDS = {
  red:   { 大: 6.15, 小: 4.1,  单: 5.3, 双: 4.63, 合单: 4.63, 合双: 5.3, 大单: 15.3, 小单: 8.9,  大双: 11.3, 小双: 8.9 },
  blue:  { 大: 4.63, 小: 6.15, 单: 5.3, 双: 5.3,  合单: 5.3,  合双: 5.3, 大单: 8.9,  小单: 15.3, 大双: 11.3, 小双: 11.3 },
  green: { 大: 5.3,  小: 6.15, 单: 5.3, 双: 6.15, 合单: 5.3,  合双: 5.3, 大单: 11.3, 小单: 11.3, 大双: 11.3, 小双: 15.3 },
};

// All 30 半波 cards: { label, betName, color, prop, odds, nums }.
export const LHC_BANBO_ITEMS = (() => {
  const colors = [['红', 'red', LHC_RED], ['蓝', 'blue', LHC_BLUE], ['绿', 'green', LHC_GREEN]];
  const items = [];
  colors.forEach(([cn, color, nums]) => {
    LHC_BANBO_PROPS.forEach((prop) => {
      const set = nums.filter((n) => lhcTwoSidedWin(n, prop)).sort((a, b) => a - b);
      items.push({ label: cn + prop, betName: cn + prop, color, prop, odds: LHC_BANBO_ODDS[color][prop], nums: set });
    });
  });
  return items;
})();

// 五行: 金木水火土, each a fixed 号码 set (covers all 1-49; 49 属火). 特码 落在即中。
export const LHC_WUXING = [
  { element: '金', odds: 4.2, nums: [4, 5, 12, 13, 26, 27, 34, 35, 42, 43] },
  { element: '木', odds: 4.2, nums: [8, 9, 16, 17, 24, 25, 38, 39, 46, 47] },
  { element: '水', odds: 4.74, nums: [1, 14, 15, 22, 23, 30, 31, 44, 45] },
  { element: '火', odds: 3.38, nums: [2, 3, 10, 11, 18, 19, 32, 33, 40, 41, 48, 49] },
  { element: '土', odds: 5.42, nums: [6, 7, 20, 21, 28, 29, 36, 37] },
];
export const LHC_WUXING_NUMBERS = Object.fromEntries(LHC_WUXING.map((w) => [w.element, w.nums]));

// 总肖: 当期 7 号码 (6 正码 + 特码) 所属「不同生肖」的总数 (范围 2-7), 以及其单双.
export const LHC_ZONGXIAO = [
  { label: '2肖', betName: '2', odds: 900 },
  { label: '3肖', betName: '3', odds: 350 },
  { label: '4肖', betName: '4', odds: 16.49 },
  { label: '5肖', betName: '5', odds: 2.56 },
  { label: '6肖', betName: '6', odds: 1.47 },
  { label: '7肖', betName: '7', odds: 5.07 },
  { label: '总肖单', betName: '单', odds: 1.37 },
  { label: '总肖双', betName: '双', odds: 1.23 },
];

// 总肖 win check: betName 是数字 (匹配不同生肖总数) 或 单/双.
export function lhcZongxiaoWin(distinctCount, betName) {
  if (betName === '单') return distinctCount % 2 === 1;
  if (betName === '双') return distinctCount % 2 === 0;
  return distinctCount === parseInt(betName);
}

// 七色波: 7 个色波中哪种颜色最多 (正码各 1, 特码 1.5). 平手 -> 和局 (红绿蓝注退回).
export const LHC_QISEBO = [
  { label: '红波', betName: '红', color: 'red', odds: 2.13 },
  { label: '绿波', betName: '绿', color: 'green', odds: 2.53 },
  { label: '蓝波', betName: '蓝', color: 'blue', odds: 2.53 },
  { label: '和局', betName: '和', odds: 30.62 },
];
// Returns the winning color 'red'|'green'|'blue', or null for 和局 (top tie).
export function lhcQiseboResult(drawNumbers) {
  const w = { red: 0, green: 0, blue: 0 };
  for (let i = 0; i < 6; i++) w[lhcColorOf(drawNumbers[i])] += 1;
  w[lhcColorOf(drawNumbers[6])] += 1.5; // 特码 计 1.5
  const max = Math.max(w.red, w.green, w.blue);
  const winners = ['red', 'green', 'blue'].filter((c) => w[c] === max);
  return winners.length === 1 ? winners[0] : null;
}

// 合肖: 选 2-11 个生肖为一组合, 特码 落在所选生肖即中; 特码 49 -> 和局 (退回).
export const LHC_HEXIAO_CATEGORIES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const LHC_HEXIAO_CN = { 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九', 10: '十', 11: '十一' };
// Odds by 类别 (组合中的生肖个数).
export const LHC_HEXIAO_ODDS = { 2: 6, 3: 4, 4: 3, 5: 2.4, 6: 2, 7: 1.71, 8: 1.5, 9: 1.33, 10: 1.2, 11: 1.09 };
export const lhcHexiaoOdds = (n) => LHC_HEXIAO_ODDS[n];

// C(arr, k): all k-sized combinations, preserving input order.
export function combinations(arr, k) {
  const res = [];
  const rec = (start, combo) => {
    if (combo.length === k) { res.push([...combo]); return; }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      rec(i + 1, combo);
      combo.pop();
    }
  };
  rec(0, []);
  return res;
}

// 半波 win check: 特码 must match both the 波色 and the 属性.
export function lhcBanboWin(special, betName) {
  const cn = betName[0];
  const prop = betName.slice(1);
  const want = cn === '红' ? 'red' : cn === '绿' ? 'green' : 'blue';
  return lhcColorOf(special) === want && lhcTwoSidedWin(special, prop);
}

// Left sidebar tabs for LHC. Only 长龙 + 特码 are implemented for now; the rest render
// a "敬请期待" placeholder so the full navigation matches the reference design.
export const LHC_SIDEBAR_TABS = [
  { id: 'long-dragon', name: '长龙' },
  { id: 'tema', name: '特码' },
  { id: 'zhengma', name: '正码' },
  { id: 'zhengte', name: '正特' },
  { id: 'texiao', name: '特肖' },
  { id: 'zhengxiao', name: '正肖' },
  { id: 'yixiao', name: '一肖' },
  { id: 'yixiao-no', name: '一肖不中' },
  { id: 'weishu', name: '尾数' },
  { id: 'weishu-no', name: '尾数不中' },
  { id: 'tetoushu', name: '特头数' },
  { id: 'teweishu', name: '特尾数' },
  { id: 'banbo', name: '半波' },
  { id: 'wuxing', name: '五行' },
  { id: 'zongxiao', name: '总肖' },
  { id: 'qisebo', name: '七色波' },
  { id: 'hexiao', name: '合肖' },
];

// 盘口 (market plate) A~D for 六合彩. Plays are identical across 盘口; only the
// odds differ. Each 盘口 applies a multiplier to the base odds of every play.
export const LHC_PANKOU = [
  { id: 'A', name: 'A盘', factor: 1 },
  { id: 'B', name: 'B盘', factor: 0.985 },
  { id: 'C', name: 'C盘', factor: 0.97 },
  { id: 'D', name: 'D盘', factor: 0.955 },
];
export const lhcPankouFactor = (id) => {
  const p = LHC_PANKOU.find((x) => x.id === id);
  return p ? p.factor : 1;
};

// 特码 odds — 特码A / 特码B are the same markets at different 盘口 (odds).
export const LHC_TEMA_ODDS = {
  A: {
    number: 47.3,    // 数字 (单号 01-49)
    ds: 1.3,         // 大/小/单/双/合单/合双/尾大/尾小/家禽/野兽
    heCombo: 3.3,    // 大单/小单/大双/小双
    red: 2.18, green: 2.36, blue: 2.36, // 波色
    range: 4.2, rangeLast: 4.74,        // 数字范围 (41-49 赔率较高)
  },
  B: {
    number: 46.5,
    ds: 1.25,
    heCombo: 3.2,
    red: 2.1, green: 2.28, blue: 2.28,
    range: 4.1, rangeLast: 4.6,
  },
};

// 特码 两面 option list (order matches the reference screenshot). `oddsKey` indexes
// into LHC_TEMA_ODDS[panel]; `disabled` options (合大/合小) render as "--".
export const LHC_TEMA_TWO_SIDED = [
  { label: '大', oddsKey: 'ds' }, { label: '小', oddsKey: 'ds' },
  { label: '单', oddsKey: 'ds' }, { label: '双', oddsKey: 'ds' },
  { label: '合大', disabled: true }, { label: '合小', disabled: true },
  { label: '合单', oddsKey: 'ds' }, { label: '合双', oddsKey: 'ds' },
  { label: '大单', oddsKey: 'heCombo' }, { label: '小单', oddsKey: 'heCombo' },
  { label: '大双', oddsKey: 'heCombo' }, { label: '小双', oddsKey: 'heCombo' },
  { label: '尾大', oddsKey: 'ds' }, { label: '尾小', oddsKey: 'ds' },
  { label: '家禽', oddsKey: 'ds' }, { label: '野兽', oddsKey: 'ds' },
  { label: '红波', oddsKey: 'red' }, { label: '绿波', oddsKey: 'green' },
  { label: '蓝波', oddsKey: 'blue' },
  { label: '1-10', oddsKey: 'range' }, { label: '11-20', oddsKey: 'range' },
  { label: '21-30', oddsKey: 'range' }, { label: '31-40', oddsKey: 'range' },
  { label: '41-49', oddsKey: 'rangeLast' },
];

// 快捷投注 category quick-pick buttons (波色 / 大小单双 / 家禽野兽 / 12 生肖).
export const LHC_QUICK_CATEGORIES = [
  '红', '蓝', '绿',
  '大', '小', '单',
  '双', '家禽', '野兽',
  '鼠', '牛', '虎',
  '兔', '龙', '蛇',
  '马', '羊', '猴',
  '鸡', '狗', '猪',
];

// Return the set of 号码 (1-49) belonging to a 快捷投注 category.
export function lhcNumbersForCategory(cat) {
  const all = Array.from({ length: 49 }, (_, i) => i + 1);
  switch (cat) {
    case '红': return [...LHC_RED];
    case '绿': return [...LHC_GREEN];
    case '蓝': return [...LHC_BLUE];
    case '大': return all.filter((n) => n >= 25 && n !== 49);
    case '小': return all.filter((n) => n <= 24);
    case '单': return all.filter((n) => n % 2 === 1);
    case '双': return all.filter((n) => n % 2 === 0);
    case '家禽': return all.filter((n) => lhcIsDomestic(n));
    case '野兽': return all.filter((n) => !lhcIsDomestic(n));
    default: return all.filter((n) => lhcZodiacOf(n) === cat); // 生肖
  }
}

// 特码 / 正特 两面 win check for a single value (1-49). 49 is 和 (push, returns false)
// for 大小/单双/合数/尾数; for 家禽野兽/波色/范围 49 still counts (win or lose, never 和).
export function lhcTwoSidedWin(value, betName) {
  const tens = Math.floor(value / 10);
  const units = value % 10;
  const heSum = tens + units; // 合数 = 个位 + 十位
  const tail = units;         // 尾数
  switch (betName) {
    case '大': return value !== 49 && value >= 25;
    case '小': return value <= 24;
    case '单': return value !== 49 && value % 2 === 1;
    case '双': return value !== 49 && value % 2 === 0;
    case '合大': return value !== 49 && heSum >= 7;
    case '合小': return value !== 49 && heSum <= 6;
    case '合单': return value !== 49 && heSum % 2 === 1;
    case '合双': return value !== 49 && heSum % 2 === 0;
    case '大单': return value !== 49 && value >= 25 && value % 2 === 1;
    case '小单': return value !== 49 && value <= 24 && value % 2 === 1;
    case '大双': return value !== 49 && value >= 25 && value % 2 === 0;
    case '小双': return value !== 49 && value <= 24 && value % 2 === 0;
    case '尾大': return value !== 49 && tail >= 5;
    case '尾小': return value !== 49 && tail <= 4;
    case '家禽': return lhcIsDomestic(value);
    case '野兽': return !lhcIsDomestic(value);
    case '红波': return LHC_RED.includes(value);
    case '绿波': return LHC_GREEN.includes(value);
    case '蓝波': return LHC_BLUE.includes(value);
    case '1-10': return value >= 1 && value <= 10;
    case '11-20': return value >= 11 && value <= 20;
    case '21-30': return value >= 21 && value <= 30;
    case '31-40': return value >= 31 && value <= 40;
    case '41-49': return value >= 41 && value <= 49;
    default: return false;
  }
}

// 正码 odds — 数字 (中任一正码) 7.46, 两面 1.3.
export const LHC_ZHENGMA_ODDS = {
  number: 7.46,
  twoSided: 1.3,
};

// 正码 两面 options (顺序对应参考截图). orange split handled in the component.
export const LHC_ZHENGMA_TWO_SIDED = [
  '总和大', '总和小', '总和单', '总和双', '总尾大', '总尾小', '龙', '虎',
];

// 正码 两面 win check.
//  - 总和大/小、总和单/双 用「7 个号码」(6 正码 + 特码) 的总和
//  - 总尾大/小 用「6 个正码」总和的尾数 (0-4 小 / 5-9 大)
//  - 龙/虎 比较第一球 (正码1) 与第六球 (正码6)
export function lhcZhengmaTwoSidedWin(drawNumbers, betName) {
  const total7 = drawNumbers.reduce((a, b) => a + b, 0);
  const total6 = drawNumbers.slice(0, 6).reduce((a, b) => a + b, 0);
  const tail6 = total6 % 10;
  const ball1 = drawNumbers[0];
  const ball6 = drawNumbers[5];
  switch (betName) {
    case '总和大': return total7 >= 175;
    case '总和小': return total7 <= 174;
    case '总和单': return total7 % 2 === 1;
    case '总和双': return total7 % 2 === 0;
    case '总尾大': return tail6 >= 5;
    case '总尾小': return tail6 <= 4;
    case '龙': return ball1 > ball6;
    case '虎': return ball1 < ball6;
    default: return false;
  }
}

// 正特 开奖位置 (按开奖顺序，非号码大小): 特一 .. 特六.
export const LHC_ZHENGTE_POS = ['特一', '特二', '特三', '特四', '特五', '特六'];

// 正特 odds — 数字 47.3, 两面/合 1.3, 波色 红 2.18 / 绿·蓝 2.36.
export const LHC_ZHENGTE_ODDS = {
  number: 47.3,
  ds: 1.3,
  red: 2.18,
  green: 2.36,
  blue: 2.36,
};

// 正特 两面 option list (顺序对应参考截图): 大小/单双/合大合小/合单合双/尾大尾小/波色.
// 复用 lhcTwoSidedWin 进行结算 (作用于指定位置的号码)。
export const LHC_ZHENGTE_TWO_SIDED = [
  { label: '大', oddsKey: 'ds' }, { label: '小', oddsKey: 'ds' },
  { label: '单', oddsKey: 'ds' }, { label: '双', oddsKey: 'ds' },
  { label: '合大', oddsKey: 'ds' }, { label: '合小', oddsKey: 'ds' },
  { label: '合单', oddsKey: 'ds' }, { label: '合双', oddsKey: 'ds' },
  { label: '尾大', oddsKey: 'ds' }, { label: '尾小', oddsKey: 'ds' },
  { label: '红波', oddsKey: 'red' }, { label: '绿波', oddsKey: 'green' },
  { label: '蓝波', oddsKey: 'blue' },
];

// Chinese numerals for 正特一 .. 正特六 (used in 长龙 titles / 正特 markets).
export const LHC_CN_NUM = ['一', '二', '三', '四', '五', '六'];

// Game categories and list for the left side drawer
export const DRAWER_CATEGORIES = [
  {
    id: 'lhc',
    name: '六合彩',
    games: [
      { id: 'ap_lhc_1m', name: '一分澳门六合彩', status: 'active', initialTime: 45, maxTime: 60 },
      { id: 'ap_lhc_5m', name: '五分澳门六合彩', status: 'active', initialTime: 248, maxTime: 300 },
      { id: 'ap_lhc_10m', name: '十分澳门六合彩', status: 'active', initialTime: 548, maxTime: 600 }
    ]
  },
  {
    id: 'pk10',
    name: 'PK10',
    games: [
      { id: 'pk10_1m', name: '一分极速赛车', status: 'active', initialTime: 48, maxTime: 60 },
      { id: 'pk10_5m', name: '五分极速赛车', status: 'active', initialTime: 248, maxTime: 300 },
      { id: 'pk10_10m', name: '十分极速赛车', status: 'active', initialTime: 548, maxTime: 600 }
    ]
  },
  {
    id: 'ffc',
    name: '分分彩',
    games: [
      { id: 'ffc_1m', name: '一分分分彩', status: 'active', initialTime: 32, maxTime: 60 },
      { id: 'ffc_5m', name: '五分分分彩', status: 'active', initialTime: 248, maxTime: 300 },
      { id: 'ffc_10m', name: '十分分分彩', status: 'active', initialTime: 548, maxTime: 600 }
    ]
  },
  {
    id: 'k3',
    name: '快三',
    games: [
      { id: 'k3_1m', name: '一分快三', status: 'active', initialTime: 50, maxTime: 60 },
      { id: 'k3_5m', name: '五分快三', status: 'active', initialTime: 248, maxTime: 300 },
      { id: 'k3_10m', name: '十分快三', status: 'active', initialTime: 548, maxTime: 600 }
    ]
  },
  {
    id: 'xy28',
    name: '28类',
    games: [
      { id: 'xy28_1m', name: '一分幸运28', status: 'active', initialTime: 48, maxTime: 60 },
      { id: 'xy28_5m', name: '五分幸运28', status: 'active', initialTime: 248, maxTime: 300 },
      { id: 'xy28_10m', name: '十分幸运28', status: 'active', initialTime: 548, maxTime: 600 }
    ]
  }
];

