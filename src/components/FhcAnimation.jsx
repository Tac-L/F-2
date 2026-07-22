import React, { useState, useEffect, useRef } from 'react';
import { fhcSymbolSrc, fhcSymbolNameOf } from '../constants/gameData';

// ===== 鱼虾蟹 (FHC) 开奖动画 =====
// Mirrors the 快三 timeline: idle → 封盘 tumble → draw → reveal. The three dice
// show symbol tiles (鱼/虾/蟹/葫芦/金钱/鸡) instead of pips.

const REVEAL_WINDOW = 2.4;   // seconds the freshly-drawn result stays highlighted
const SETTLE_STEP = 0.18;    // stagger between consecutive tiles locking in

export default function FhcAnimation({ activeGame, gameName, lockSeconds = 10 }) {
  const { timeLeft, maxTime, history, currentIssue } = activeGame;

  const [rollFaces, setRollFaces] = useState([1, 1, 1]);
  const rollRef = useRef(null);

  const result = (history && history.length > 0) ? history[0].numbers : [1, 1, 1];
  const drawnIssue = (history && history.length > 0) ? history[0].issue : (currentIssue - 1).toString();

  const elapsed = maxTime - timeLeft;
  const isSpinning = timeLeft <= lockSeconds && timeLeft > 0;
  const isRevealing = !isSpinning && elapsed < REVEAL_WINDOW;

  useEffect(() => {
    if (!isSpinning) {
      if (rollRef.current) clearInterval(rollRef.current);
      return;
    }
    rollRef.current = setInterval(() => {
      setRollFaces(() => Array.from({ length: 3 }, () => Math.floor(Math.random() * 6) + 1));
    }, 90);
    return () => {
      if (rollRef.current) clearInterval(rollRef.current);
    };
  }, [isSpinning]);

  const faces = isSpinning ? rollFaces : result;

  const mmss = (s) => {
    const v = Math.max(0, s);
    const m = Math.floor(v / 60).toString().padStart(2, '0');
    const ss = (v % 60).toString().padStart(2, '0');
    return `00:${m}:${ss}`;
  };

  const tileClass = () =>
    isSpinning ? 'k3a-die tumbling' : isRevealing ? 'k3a-die settling' : 'k3a-die';
  const tileDelay = (i) => (isRevealing ? { animationDelay: `${i * SETTLE_STEP}s` } : undefined);

  return (
    <div className="k3a-stage">
      {/* Top banner: logo + result symbols + issue numbers */}
      <div className="k3a-topbar">
        <div className="k3a-logo fhca-logo">鱼<span>虾蟹</span></div>

        <div className="k3a-result-plate">
          {isSpinning ? (
            <span className="k3a-result-live">正在开奖<span className="k3a-dots">...</span></span>
          ) : (
            <span className="fhca-result-row">
              {result.map((n, i) => (
                <img key={i} className="fhca-result-tile" src={fhcSymbolSrc(fhcSymbolNameOf(n))} alt={fhcSymbolNameOf(n)} />
              ))}
            </span>
          )}
        </div>

        <div className="k3a-issue-col">
          <span className="k3a-issue-line">本期：{isSpinning ? currentIssue : drawnIssue}</span>
          <span className="k3a-issue-line next">下期：{isSpinning ? currentIssue + 1 : currentIssue}</span>
        </div>
      </div>

      {/* Central circular countdown */}
      <div className="k3a-center">
        <div className={`k3a-timer-ring ${isSpinning ? 'sealed' : ''}`}>
          <span className="k3a-timer-label">倒计时</span>
          <span className="k3a-timer-digits">{mmss(timeLeft)}</span>
          <div className="k3a-timer-bars" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => <span key={i} />)}
          </div>
        </div>
      </div>

      {/* Bottom: three symbol tiles in glowing domes */}
      <div className="k3a-dice-row">
        {[0, 1, 2].map((i) => (
          <div key={i} className="k3a-dome">
            <div className={tileClass()} style={tileDelay(i)}>
              <img className="fhca-dome-tile" src={fhcSymbolSrc(fhcSymbolNameOf(faces[i]))} alt={fhcSymbolNameOf(faces[i])} />
            </div>
            <div className="k3a-dome-glow" aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* Status footer */}
      <div className="k3a-footer">
        {isSpinning ? (
          <span className="k3a-foot-live">开奖中…</span>
        ) : isRevealing ? (
          <span className="k3a-foot-done">{result.map(fhcSymbolNameOf).join(' · ')}</span>
        ) : (
          <span className="k3a-foot-wait">{gameName} · 等待开奖</span>
        )}
      </div>
    </div>
  );
}
