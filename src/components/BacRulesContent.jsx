import React from 'react';
import { bacCardSrc, bacTotal } from '../constants/gameData';
import { BAC_RULES, BAC_PLAY_EXAMPLES } from '../constants/gameRules';

// 阿拉伯数字 -> 中文数字（百家乐 section 标题：一、二、…）。
const CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const colorCls = (c) => (c ? ` rules-c-${c}` : '');

// 表格单元格内容（支持多行数组）。
const renderCell = (cell) => (
  Array.isArray(cell)
    ? cell.map((ln, li) => <React.Fragment key={li}>{li > 0 && <br />}{ln}</React.Fragment>)
    : cell
);

// 渲染结构化的百家乐规则区块（section / p / ul / note / eg / table）。
// onExample(key) 打开玩法判定「例」示例牌型弹窗。
const renderBlocks = (blocks, onExample) => blocks.map((b, i) => {
  switch (b.t) {
    case 'section':
      return <h3 key={i} className="rules-section">{CN_NUM[Number(b.n)] || b.n}、{b.title}</h3>;
    case 'sub':
      return <h4 key={i} className="rules-sub">{b.text}</h4>;
    case 'p':
      return <p key={i} className={`rules-p ${b.muted ? 'rules-muted' : ''}`}>{b.text}</p>;
    case 'note':
      return <p key={i} className="rules-note">{b.text}</p>;
    case 'eg':
      return <p key={i} className="rules-eg">{b.text}</p>;
    case 'ul':
      return (
        <ul key={i} className="rules-ul">
          {b.items.map((it, k) => (
            typeof it === 'string'
              ? <li key={k}>{it}</li>
              : <li key={k}><span className={`rules-tag rules-tag-${it.labelClass}`}>{it.label}</span>：{it.text}</li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div key={i} className="rules-table-wrap">
          {b.caption && <div className="rules-table-caption">{b.caption}</div>}
          <table className={`rules-table ${b.odds ? 'odds' : ''}`}>
            <thead>
              <tr>{b.head.map((h, k) => <th key={k}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => {
                    const hasEg = b.withExamples && (b.leftCols || []).includes(c) && BAC_PLAY_EXAMPLES[row[0]];
                    return (
                      <td key={c} className={(b.leftCols || []).includes(c) ? 'rules-td-left' : ''}>
                        {hasEg ? (
                          <div className="rules-cell-eg">
                            <span className="rules-cell-eg-text">{renderCell(cell)}</span>
                            <button type="button" className="rules-eg-btn" onClick={() => onExample && onExample(row[0])}>例</button>
                          </div>
                        ) : renderCell(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
});

// 百家乐规则内容（活动规则页与投注页「玩法说明」共用）。
export default function BacRulesContent() {
  const [exampleKey, setExampleKey] = React.useState(null);
  return (
    <>
      {renderBlocks(BAC_RULES, setExampleKey)}

      {exampleKey && BAC_PLAY_EXAMPLES[exampleKey] && (
        <div className="rules-eg-overlay" onClick={() => setExampleKey(null)}>
          <div className="rules-eg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rules-eg-modal-head">
              <span className="rules-eg-modal-title">{exampleKey}　示例</span>
              <button type="button" className="rules-eg-modal-close" onClick={() => setExampleKey(null)} aria-label="关闭">×</button>
            </div>
            <div className="rules-eg-modal-body">
              {BAC_PLAY_EXAMPLES[exampleKey].desc && (
                <p className="rules-eg-desc">{BAC_PLAY_EXAMPLES[exampleKey].desc}</p>
              )}
              {BAC_PLAY_EXAMPLES[exampleKey].hands.map((h, hi) => (
                <div key={hi} className="rules-eg-hand">
                  {h.label && <div className="rules-eg-hand-label">{h.label}</div>}
                  {[['庄家', 'banker', h.banker], ['闲家', 'player', h.player]].map(([name, cls, cards]) => (
                    <div key={cls} className="rules-eg-hand-row">
                      <span className={`rules-eg-side ${cls}`}>{name}</span>
                      <span className="rules-eg-cards">
                        {cards.map((c, ci) => (
                          <img key={ci} className="rules-eg-card" src={bacCardSrc(c)} alt="" />
                        ))}
                      </span>
                      <span className="rules-eg-total">= {bacTotal(cards)} 点</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
