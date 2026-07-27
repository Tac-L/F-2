import React from 'react';
import { bacTotal } from '../constants/gameData';

// =============================================================================
// 百家乐 路子图 (roadmap)
//
// 规则依据专案内的《百家乐的路.png》说明，实现五种路：
//   珠盘路 / 大路 / 大眼路(p=1) / 小路(p=2) / 曱甴路(p=3)
//
// 下三路(大眼/小路/曱甴)统一算法，仅差一个回看参数 p：
//   起始位   : 大眼 第2列第2行、小路 第3列第2行、曱甴 第4列第2行(不足则退到下一列第一行)
//   新列(行0): 比较【前一列】与【前(1+p)列】圆圈个数 —— 相同=红(齐整)，不同=蓝(不齐)
//   续列(行≥1): 看【前p列】—— 该列高度==当前行号 → 蓝(无)，否则 → 红(有)
// =============================================================================

const ROWS = 6;

// 把按时间顺序(旧→新)的结果压成大路「逻辑列」。
// 每列: { outcome:'banker'|'player', cells:[{ ties, bankerPair, playerPair, leadingTies }] }
// 和局(tie)不另起格，累加到最近一格；开局前的和局暂存为 leadingTies。
function buildBigCols(results) {
  const cols = [];
  let pendingTies = 0;
  for (const r of results) {
    if (r.outcome === 'tie') {
      if (cols.length === 0) { pendingTies += 1; continue; }
      const col = cols[cols.length - 1];
      col.cells[col.cells.length - 1].ties += 1;
      continue;
    }
    const last = cols[cols.length - 1];
    if (!last || last.outcome !== r.outcome) {
      cols.push({
        outcome: r.outcome,
        cells: [{ ties: 0, bankerPair: r.bankerPair, playerPair: r.playerPair, leadingTies: pendingTies }],
      });
      pendingTies = 0;
    } else {
      last.cells.push({ ties: 0, bankerPair: r.bankerPair, playerPair: r.playerPair, leadingTies: 0 });
    }
  }
  return cols;
}

// 逻辑列 → 6 行物理网格，含「长龙拖尾」(满 6 行或下格被占则向右转)。
function layoutColumns(cols, rows = ROWS) {
  const occupied = new Set();
  const out = [];
  let maxCol = 0;
  let prevFirstCol = 0;
  cols.forEach((col, ci) => {
    let row = 0;
    let colPos = 0;
    let firstCol = 0;
    col.cells.forEach((cell, ri) => {
      if (ri === 0) {
        colPos = ci === 0 ? 0 : prevFirstCol + 1;
        row = 0;
        while (occupied.has(`${row},${colPos}`)) colPos += 1;
        firstCol = colPos;
      } else {
        let nrow = row + 1;
        let ncol = colPos;
        if (nrow >= rows || occupied.has(`${nrow},${ncol}`)) {
          nrow = row;
          ncol = colPos + 1;
          while (occupied.has(`${nrow},${ncol}`)) ncol += 1;
        }
        row = nrow;
        colPos = ncol;
      }
      occupied.add(`${row},${colPos}`);
      out.push({ row, col: colPos, outcome: col.outcome, ...cell });
      if (colPos > maxCol) maxCol = colPos;
    });
    prevFirstCol = firstCol;
  });
  return { cells: out, cols: out.length ? maxCol + 1 : 0 };
}

// 由大路逻辑列衍生下三路，返回顺序 ['red'|'blue', ...]。
function deriveMarks(cols, p) {
  const marks = [];
  for (let c = 0; c < cols.length; c++) {
    const len = cols[c].cells.length;
    for (let r = 0; r < len; r++) {
      let color;
      if (r === 0) {
        if (c - 1 - p < 0) continue; // 起始位之前，跳过
        color = cols[c - 1].cells.length === cols[c - 1 - p].cells.length ? 'red' : 'blue';
      } else {
        if (c - p < 0) continue;
        color = cols[c - p].cells.length === r ? 'blue' : 'red';
      }
      marks.push(color);
    }
  }
  return marks;
}

// 把红/蓝序列按「连续同色」分组成逻辑列，方便复用 layoutColumns 的画法。
function marksToCols(marks) {
  const cols = [];
  for (const m of marks) {
    const last = cols[cols.length - 1];
    if (!last || last.outcome !== m) cols.push({ outcome: m, cells: [{}] });
    else last.cells.push({});
  }
  return cols;
}

// 问路: 假设下一局为 outcome(banker/player)，重算下三路，取各路「新增的那一颗」颜色。
// 仅当追加这一局确实为该路新增一颗时才返回颜色，否则返回 null(数据不足)。
function predictNext(results, outcome) {
  const before = buildBigCols(results);
  const after = buildBigCols([...results, { outcome, bankerPair: false, playerPair: false }]);
  const pick = (p) => {
    const a = deriveMarks(after, p);
    const b = deriveMarks(before, p);
    return a.length > b.length ? a[a.length - 1] : null;
  };
  return { eye: pick(1), small: pick(2), cockroach: pick(3) };
}

// 网格化: cells[] → grid[row][col]
function toGrid(cells, colsCount) {
  const g = Array.from({ length: ROWS }, () => Array(colsCount).fill(null));
  cells.forEach((c) => {
    if (c.row < ROWS && c.col < colsCount) g[c.row][c.col] = c;
  });
  return g;
}

// 通用网格渲染
function RoadGrid({ cells, cols, minCols, cellClass, render }) {
  const colsCount = Math.max(cols, minCols);
  const grid = toGrid(cells, colsCount);
  return (
    <div className={`bac-road-grid ${cellClass}`}>
      {grid.map((line, r) => (
        <div className="bac-road-line" key={r}>
          {line.map((cell, c) => (
            <div className="bac-road-cell" key={c}>
              {cell ? render(cell) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// 横向滚动容器，内容变化时自动滚到最右(显示最新一列)。
function ScrollRight({ dep, children }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const toRight = () => { el.scrollLeft = el.scrollWidth; };
    toRight();
    window.addEventListener('resize', toRight);
    return () => window.removeEventListener('resize', toRight);
  }, [dep]);
  return (
    <div className="bac-board-scroll" ref={ref}>
      {children}
    </div>
  );
}

export default function BacRoadmap({ history }) {
  const results = React.useMemo(() => {
    const chrono = [...(history || [])].reverse(); // history 为新→旧，反转成旧→新
    return chrono.map((item) => {
      const p = (item.numbers && item.numbers.p) || [];
      const b = (item.numbers && item.numbers.b) || [];
      const pt = bacTotal(p);
      const bt = bacTotal(b);
      const outcome = bt > pt ? 'banker' : pt > bt ? 'player' : 'tie';
      return {
        outcome,
        bankerPair: b.length >= 2 && b[0].r === b[1].r,
        playerPair: p.length >= 2 && p[0].r === p[1].r,
      };
    });
  }, [history]);

  const bigCols = React.useMemo(() => buildBigCols(results), [results]);
  const bigRoad = React.useMemo(() => layoutColumns(bigCols), [bigCols]);
  const bead = React.useMemo(
    () => results.map((r, i) => ({ ...r, row: i % ROWS, col: Math.floor(i / ROWS) })),
    [results]
  );
  const beadCols = bead.length ? Math.floor((bead.length - 1) / ROWS) + 1 : 0;
  const bigEye = React.useMemo(() => layoutColumns(marksToCols(deriveMarks(bigCols, 1))), [bigCols]);
  const smallRoad = React.useMemo(() => layoutColumns(marksToCols(deriveMarks(bigCols, 2))), [bigCols]);
  const cockroach = React.useMemo(() => layoutColumns(marksToCols(deriveMarks(bigCols, 3))), [bigCols]);

  // ---- cell renderers ----
  const beadDot = (cell) => {
    const label = cell.outcome === 'banker' ? '庄' : cell.outcome === 'player' ? '闲' : '和';
    return (
      <span className={`bac-bead ${cell.outcome}`}>
        {label}
        {cell.bankerPair && <span className="bac-pair-dot banker" />}
        {cell.playerPair && <span className="bac-pair-dot player" />}
      </span>
    );
  };

  const bigDot = (cell) => {
    const ties = (cell.ties || 0) + (cell.leadingTies || 0);
    return (
      <span className={`bac-big ${cell.outcome}`}>
        {ties > 0 && <span className="bac-tie-slash" />}
        {ties > 0 && <span className="bac-tie-num">{ties}</span>}
      </span>
    );
  };

  const eyeDot = (cell) => <span className={`bac-eye ${cell.outcome}`} />;
  const smallDot = (cell) => <span className={`bac-small ${cell.outcome}`} />;
  const cockroachDot = (cell) => <span className={`bac-cockroach ${cell.outcome}`} />;

  const empty = results.length === 0;

  // 庄问路 / 闲问路: 下一局若开庄/开闲，下三路各会出什么颜色。
  const askBanker = React.useMemo(() => predictNext(results, 'banker'), [results]);
  const askPlayer = React.useMemo(() => predictNext(results, 'player'), [results]);

  const askPill = (label, cls, pred) => (
    <div className={`bac-ask ${cls}`}>
      <div className="bac-ask-marks">
        <span className={`bac-eye ${pred.eye || 'none'}`} />
        <span className={`bac-small ${pred.small || 'none'}`} />
        <span className={`bac-cockroach ${pred.cockroach || 'none'}`} />
      </div>
      <span className="bac-ask-label">{label}</span>
    </div>
  );

  return (
    <div className="bac-roadmap">
      {empty ? (
        <div className="bac-roadmap-empty">暂无开奖记录</div>
      ) : (
        // 真实赌场版式: 珠盘路(左) + 大路(右上) + 下三路 大眼/小路/曱甴(右下并排)
        <div className="bac-board">
          <div className="bac-board-bead">
            <ScrollRight dep={results.length}>
              <RoadGrid cells={bead} cols={beadCols} minCols={8} cellClass="md" render={beadDot} />
            </ScrollRight>
            <div className="bac-ask-row">
              {askPill('庄问路', 'banker', askBanker)}
              {askPill('闲问路', 'player', askPlayer)}
            </div>
          </div>
          <div className="bac-board-right">
            <div className="bac-board-big">
              <ScrollRight dep={results.length}>
                <RoadGrid cells={bigRoad.cells} cols={bigRoad.cols} minCols={12} cellClass="md" render={bigDot} />
              </ScrollRight>
            </div>
            <div className="bac-board-derived">
              <div className="bac-board-sub">
                <ScrollRight dep={results.length}>
                  <RoadGrid cells={bigEye.cells} cols={bigEye.cols} minCols={10} cellClass="xs" render={eyeDot} />
                </ScrollRight>
              </div>
              <div className="bac-board-sub">
                <ScrollRight dep={results.length}>
                  <RoadGrid cells={smallRoad.cells} cols={smallRoad.cols} minCols={10} cellClass="xs" render={smallDot} />
                </ScrollRight>
              </div>
              <div className="bac-board-sub">
                <ScrollRight dep={results.length}>
                  <RoadGrid cells={cockroach.cells} cols={cockroach.cols} minCols={10} cellClass="xs" render={cockroachDot} />
                </ScrollRight>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
