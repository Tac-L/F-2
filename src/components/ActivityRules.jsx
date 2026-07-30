import React from 'react';
import { DRAWER_CATEGORIES } from '../constants/gameData';
import { IMPORTANT_STATEMENT, GAME_RULES } from '../constants/gameRules';
import BacRulesContent from './BacRulesContent';

// Classify a raw rule line into a display kind so it can be styled consistently
// across every game without hand-tagging hundreds of lines.
const classifyLine = (line) => {
  if (line === '名词定义：' || /^名词定义/.test(line)) return 'section';
  if (/^[一二三四五六七八九十]+、/.test(line)) return 'section';   // 一、二、…
  if (/^[0-9０-９]{1,2}、(?![0-9０-９])/.test(line)) return 'section'; // 1、 ２、 16、（「、」后为数字则视为号码区间，非标题）
  if (/^\d+\.\d+/.test(line)) return 'sub';                          // 2.1
  if (/^(举例\d*|例如|例)\s*[:：]\s*$/.test(line)) return 'eglabel';  // 举例：（内容在下一行）
  if (/^(举例\d*|例如|例)[：:]/.test(line)) return 'eg';              // 例：xxx（单行）
  if (/^如(?!果)/.test(line)) return 'eg';                           // 如：… / 如中奖… / 如开奖…（举例，排除「如果」）
  if (/^注[：:]/.test(line)) return 'note';
  if (/^[-•]\s*/.test(line)) return 'bullet';
  return 'p';
};

// Number-distribution / detail lines → rendered as an indented bullet.
// 波色 lines additionally carry a color. These patterns only ever appear in 六合彩.
const distInfo = (line) => {
  if (/^红[波单双大小合]/.test(line)) return { color: 'red' };
  if (/^绿[波单双大小合]/.test(line)) return { color: 'green' };
  if (/^蓝[波单双大小合]/.test(line)) return { color: 'blue' };
  if (/^[0-9０-９]{1,2}[头尾][：:]/.test(line)) return {};
  if (/^[金木水火土][：:]/.test(line)) return {};
  if (/^[鼠牛虎兔龙蛇马羊猴鸡狗猪豹][：:]/.test(line)) return {};
  if (/^(球色号码分布如下|20\d\d年五行如下|范围包含)/.test(line)) return {};
  return null;
};

// Is this line a numbered 玩法 item? (label：… with a short punctuation-free label,
// optionally prefixed by an explicit "(1)"). Distribution lines are never items.
const isItem = (line) => {
  if (distInfo(line)) return false;
  if (/^[（(]/.test(line) && !/^\(\d+\)/.test(line)) return false; // e.g. (请注意…)
  const s = line.replace(/^\(\d+\)\s*/, '');
  return /^[^：:。，、]{1,16}[：:]/.test(s);
};

// Build a flat rule-line array into a small block tree, then render it.
// When `numberItems` is true (六合彩), consecutive 玩法 items inside a section
// become an auto-numbered list; continuations and number-distribution lines
// nest underneath the current item as text / indented bullets.
const renderLines = (lines, { numberItems = false } = {}) => {
  const blocks = [];
  let ol = null;      // current ordered-list: array of items { text, children:[] }
  let item = null;    // current item being appended to

  const flushOl = () => { ol = null; item = null; };
  const addChildOrTop = (node) => {
    if (item) item.children.push(node);
    else blocks.push(node);
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const kind = classifyLine(line);

    if (kind === 'section') { flushOl(); blocks.push({ t: 'section', text: line }); continue; }
    if (kind === 'sub') { flushOl(); blocks.push({ t: 'sub', text: line }); continue; }

    if (kind === 'eglabel') {
      const items = [];
      let j = i + 1;
      while (j < lines.length && classifyLine(lines[j]) === 'p' && !distInfo(lines[j])) {
        items.push(lines[j]);
        j += 1;
      }
      addChildOrTop({ t: 'egGroup', label: line, items });
      i = j - 1;
      continue;
    }
    if (kind === 'eg') { addChildOrTop({ t: 'eg', text: line }); continue; }
    if (kind === 'note') { addChildOrTop({ t: 'note', text: line }); continue; }
    if (kind === 'bullet') { addChildOrTop({ t: 'bullet', text: line.replace(/^[-•]\s*/, '') }); continue; }

    const dist = distInfo(line);
    if (dist) { addChildOrTop({ t: 'bullet', text: line, color: dist.color }); continue; }

    if (numberItems && isItem(line)) {
      if (!ol) { ol = []; blocks.push({ t: 'ol', items: ol }); }
      item = { text: line.replace(/^\(\d+\)\s*/, ''), children: [] };
      ol.push(item);
      continue;
    }

    // Plain sentence: a continuation of the current item, else an intro paragraph.
    if (item) item.children.push({ t: 'p', text: line });
    else { flushOl(); blocks.push({ t: 'p', text: line }); }
  }

  const colorCls = (c) => (c ? ` rules-c-${c}` : '');
  const renderChild = (n, k) => {
    if (n.t === 'bullet') return <div key={k} className={`rules-subbullet${colorCls(n.color)}`}>{n.text}</div>;
    if (n.t === 'eg') return <p key={k} className="rules-eg">{n.text}</p>;
    if (n.t === 'note') return <p key={k} className="rules-note">{n.text}</p>;
    if (n.t === 'egGroup') return (
      <div key={k} className="rules-eg">
        <div className="rules-eg-label">{n.label}</div>
        {n.items.map((it, m) => <p key={m} className="rules-eg-item">{it}</p>)}
      </div>
    );
    return <p key={k} className="rules-item-cont">{n.text}</p>;
  };

  return blocks.map((b, i) => {
    switch (b.t) {
      case 'section': return <h3 key={i} className="rules-section">{b.text}</h3>;
      case 'sub': return <h4 key={i} className="rules-sub">{b.text}</h4>;
      case 'p': return <p key={i} className="rules-p">{b.text}</p>;
      case 'note': return <p key={i} className="rules-note">{b.text}</p>;
      case 'eg': return <p key={i} className="rules-eg">{b.text}</p>;
      case 'bullet': return <div key={i} className={`rules-subbullet${colorCls(b.color)}`}>{b.text}</div>;
      case 'egGroup': return (
        <div key={i} className="rules-eg">
          <div className="rules-eg-label">{b.label}</div>
          {b.items.map((it, m) => <p key={m} className="rules-eg-item">{it}</p>)}
        </div>
      );
      case 'ol': return (
        <ol key={i} className="rules-olist">
          {b.items.map((it, k) => (
            <li key={k}>
              <span className="rules-olitem">{it.text}</span>
              {it.children.map(renderChild)}
            </li>
          ))}
        </ol>
      );
      default: return null;
    }
  });
};

export default function ActivityRules({ onBack, onOpenMenu }) {
  const [categoryId, setCategoryId] = React.useState(DRAWER_CATEGORIES[0].id);
  const [gameId, setGameId] = React.useState(DRAWER_CATEGORIES[0].games[0].id);
  const [sheet, setSheet] = React.useState(null); // 'category' | 'game' | null
  const [showTop, setShowTop] = React.useState(false);
  const bodyRef = React.useRef(null);
  const filtersRef = React.useRef(null);

  const category = DRAWER_CATEGORIES.find((c) => c.id === categoryId);
  const game = category.games.find((g) => g.id === gameId);
  const isBac = categoryId === 'bac';
  const lines = GAME_RULES[categoryId] || [];

  // Scroll so the game-selection picker row sits at the top (not all the way
  // up to 重要声明). We set scrollTop directly because scrollTo({smooth}) /
  // CSS scroll-behavior are unreliable in some mobile webviews.
  const scrollToPickers = () => {
    const el = bodyRef.current;
    const f = filtersRef.current;
    if (!el || !f) return;
    const delta = f.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.scrollTop += delta - 8;
    setShowTop(false); // picker is now at the top → hide the button
  };

  // Show the button only once the game-selection picker row has scrolled
  // fully past the top of the viewport.
  const handleScroll = () => {
    const el = bodyRef.current;
    const f = filtersRef.current;
    if (!el || !f) return;
    setShowTop(f.getBoundingClientRect().bottom <= el.getBoundingClientRect().top);
  };

  const handleSelectCategory = (id) => {
    const cat = DRAWER_CATEGORIES.find((c) => c.id === id);
    setCategoryId(id);
    setGameId(cat.games[0].id);
    setSheet(null);
    // Keep the current scroll position — do not jump back up to 重要声明.
  };

  const handleSelectGame = (id) => {
    setGameId(id);
    setSheet(null);
  };

  return (
    <div className="settled-detail-container activity-rules-container">
      {/* Header */}
      <div className="settled-header">
        <button type="button" className="settled-back-btn" onClick={onBack} title="返回">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="settled-title">活动规则</span>
        <button type="button" className="settled-menu-btn" onClick={onOpenMenu} title="菜单">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <div className="settled-body" ref={bodyRef} onScroll={handleScroll}>
        {/* 重要声明 — shown for every game */}
        <div className="rules-block">
          <h2 className="rules-heading">重要声明</h2>
          <ol className="rules-ol">
            {IMPORTANT_STATEMENT.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>

        {/* Category / game pickers — same options & style as 开奖历史 */}
        <div className="settled-filters-row" ref={filtersRef}>
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

        {/* Game-specific rules content */}
        <div className="rules-block rules-content">
          {isBac
            ? <BacRulesContent />
            : lines.length === 0
              ? (
                <div className="settled-empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <span>该游戏暂无规则说明</span>
                </div>
              )
              : renderLines(lines, { numberItems: categoryId === 'lhc' })}
        </div>
      </div>

      {/* Back-to-top floating button (appears after scrolling down) */}
      {showTop && (
        <button type="button" className="rules-to-top" onClick={scrollToPickers} title="回到游戏选择" aria-label="回到游戏选择">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* Transparent click-catcher to close an open dropdown when tapping outside */}
      {sheet && (
        <div className="history-picker-backdrop" onClick={() => setSheet(null)} />
      )}
    </div>
  );
}
