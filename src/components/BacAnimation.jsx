import React from 'react';
import { bacTotal, bacCardSrc } from '../constants/gameData';

// ===== 百家乐 (Baccarat) 开奖动画 =====
// Idle → 封盘 (发牌中) → reveal. Shows the 闲/庄 card rows with their totals and a
// central 倒计时 ring, reusing the 快三 (k3a) stage styling.

export default function BacAnimation({ activeGame, gameName, lockSeconds = 10 }) {
  const { timeLeft, history, currentIssue } = activeGame;

  const result = (history && history.length > 0) ? history[0].numbers : { p: [], b: [] };
  const drawnIssue = (history && history.length > 0) ? history[0].issue : (currentIssue - 1).toString();

  const isSpinning = timeLeft <= lockSeconds && timeLeft > 0;

  const pCards = result.p || [];
  const bCards = result.b || [];
  const pt = bacTotal(pCards);
  const bt = bacTotal(bCards);
  const outcome = pt > bt ? '闲赢' : bt > pt ? '庄赢' : '和局';

  const mmss = (s) => {
    const v = Math.max(0, s);
    const m = Math.floor(v / 60).toString().padStart(2, '0');
    const ss = (v % 60).toString().padStart(2, '0');
    return `00:${m}:${ss}`;
  };

  return (
    <div className="k3a-stage baca-stage">
      <div className="k3a-topbar">
        <div className="k3a-logo">百<span>家乐</span></div>
        <div className="k3a-result-plate">
          {isSpinning ? (
            <span className="k3a-result-live">正在发牌<span className="k3a-dots">...</span></span>
          ) : (
            <span className={`baca-outcome ${pt > bt ? 'player' : bt > pt ? 'banker' : 'tie'}`}>{outcome}</span>
          )}
        </div>
        <div className="k3a-issue-col">
          <span className="k3a-issue-line">本期：{isSpinning ? currentIssue : drawnIssue}</span>
          <span className="k3a-issue-line next">下期：{isSpinning ? currentIssue + 1 : currentIssue}</span>
        </div>
      </div>

      <div className="k3a-center">
        <div className={`k3a-timer-ring ${isSpinning ? 'sealed' : ''}`}>
          <span className="k3a-timer-label">倒计时</span>
          <span className="k3a-timer-digits">{mmss(timeLeft)}</span>
          <div className="k3a-timer-bars" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => <span key={i} />)}
          </div>
        </div>
      </div>

      {/* Card table: 闲 (left) vs 庄 (right) */}
      {!isSpinning && (
        <div className="baca-table">
          <div className="baca-hand player">
            <div className="baca-hand-title">闲 {pt}</div>
            <div className="baca-cards">
              {/* 补牌 (3rd card) laid horizontally on the outer (left) side. */}
              {pCards[2] && (
                <span className="baca-drawn"><img className="baca-card" src={bacCardSrc(pCards[2])} alt="" /></span>
              )}
              {pCards.slice(0, 2).map((c, i) => (
                <img key={i} className="baca-card" src={bacCardSrc(c)} alt="" />
              ))}
            </div>
          </div>
          <div className="baca-hand banker">
            <div className="baca-hand-title">庄 {bt}</div>
            <div className="baca-cards">
              {bCards.slice(0, 2).map((c, i) => (
                <img key={i} className="baca-card" src={bacCardSrc(c)} alt="" />
              ))}
              {/* 补牌 (3rd card) laid horizontally on the outer (right) side. */}
              {bCards[2] && (
                <span className="baca-drawn"><img className="baca-card" src={bacCardSrc(bCards[2])} alt="" /></span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="k3a-footer">
        {isSpinning ? (
          <span className="k3a-foot-live">发牌中…</span>
        ) : (
          <span className="k3a-foot-wait">{gameName} · {outcome}</span>
        )}
      </div>
    </div>
  );
}
