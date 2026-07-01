import React, { useState, useEffect, useRef } from 'react';
import { xy28SumBig } from '../constants/gameData';

// ===== 幸运28 (XY28) 开奖动画 — 「PC蛋蛋」舞台风格 =====
// Three balls float (bob up and down) continuously on a neon stage. During the
// 封盘 window the balls show a dark "sealed" seam; the moment the draw lands the
// faces flip open (rotateY) and reveal the three numbers, left → right.
//   1. idle    : betting open. Revealed balls float; the central 倒计时 ticks down.
//   2. 封盘 spin: timeLeft <= lockSeconds — balls go dark/sealed, "正在开奖".
//   3. draw     : timeLeft hits 0, the numbers are drawn, timeLeft resets.
//   4. reveal   : the faces flip open in a left→right cascade.

const REVEAL_WINDOW = 2.4;     // seconds the freshly-drawn result stays highlighted
const FLIP_STEP = 0.18;        // delay between consecutive faces flipping open

export default function Xy28Animation({ activeGame, gameName, lockSeconds = 10 }) {
  const { timeLeft, maxTime, history, currentIssue } = activeGame;

  // Random digits shown while the faces are sealed during 封盘.
  const [rollDigits, setRollDigits] = useState([0, 0, 0]);
  const rollRef = useRef(null);

  const result = (history && history.length > 0) ? history[0].numbers : [0, 0, 0];
  const drawnIssue = (history && history.length > 0) ? history[0].issue : (currentIssue - 1).toString();

  const elapsed = maxTime - timeLeft;          // 0 right after a draw

  const isSpinning = timeLeft <= lockSeconds && timeLeft > 0;
  const isRevealing = !isSpinning && elapsed < REVEAL_WINDOW;

  // Cycle random digits only while sealed (kept off-screen behind the seam, but
  // drives a flicker if we ever want to expose it).
  useEffect(() => {
    if (!isSpinning) {
      if (rollRef.current) clearInterval(rollRef.current);
      return;
    }
    rollRef.current = setInterval(() => {
      setRollDigits(() => Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)));
    }, 80);
    return () => {
      if (rollRef.current) clearInterval(rollRef.current);
    };
  }, [isSpinning]);

  const sum = result.reduce((a, b) => a + b, 0);
  const sumBig = xy28SumBig(sum) ? '大' : '小';

  const mmss = (s) => {
    const v = Math.max(0, s);
    const m = Math.floor(v / 60).toString().padStart(2, '0');
    const ss = (v % 60).toString().padStart(2, '0');
    return `00:${m}:${ss}`;
  };

  return (
    <div className="xy28a-stage">
      {/* 3D broadcast room: back wall + side walls + floor grid */}
      <div className="xy28a-room" aria-hidden="true">
        <span className="xy28a-wall xy28a-wall-l" />
        <span className="xy28a-wall xy28a-wall-r" />
        <span className="xy28a-grid" />
      </div>

      {/* Spotlight beams */}
      <div className="xy28a-lights" aria-hidden="true">
        <span /><span /><span /><span />
      </div>

      {/* Top bar: logo + result boxes + 下期 issue */}
      <div className="xy28a-topbar">
        <div className="xy28a-logo">PC<span>蛋蛋</span></div>
        <div className="xy28a-result-boxes">
          {[0, 1, 2].map((i) => (
            <span key={i} className="xy28a-rbox">{result[i]}</span>
          ))}
        </div>
        <div className="xy28a-issue">下期：{isSpinning ? currentIssue + 1 : currentIssue}</div>
      </div>

      {/* Central countdown */}
      <div className="xy28a-timer">{mmss(timeLeft)}</div>

      {/* Stage floor: 3D platform + neon track + scattered tiles + three balls */}
      <div className="xy28a-floor">
        <div className="xy28a-platform" aria-hidden="true" />
        <div className="xy28a-track" aria-hidden="true" />
        <div className="xy28a-tiles" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>
        <div className="xy28a-balls">
          {[0, 1, 2].map((i) => (
            <div key={i} className="xy28a-podium">
              <div className="xy28a-floatwrap" style={{ animationDelay: `${i * 0.5}s` }}>
                <div className="xy28a-crown" aria-hidden="true">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <div className="xy28a-ribbon xy28a-ribbon-l" aria-hidden="true" />
                <div className="xy28a-ribbon xy28a-ribbon-r" aria-hidden="true" />
                <div
                  className={`xy28a-face ${isSpinning ? 'sealed' : 'revealed'} ${isRevealing ? 'flip' : ''}`}
                  style={isRevealing ? { animationDelay: `${i * FLIP_STEP}s` } : undefined}
                >
                  {isSpinning
                    ? <span className="xy28a-seam" />
                    : <span className="xy28a-digit">{result[i]}</span>}
                </div>
              </div>
              <div className="xy28a-stand" aria-hidden="true" />
              <div className="xy28a-shadow" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>

      {/* Status footer */}
      <div className="xy28a-footer">
        {isSpinning ? (
          <span className="xy28a-foot-live">正在开奖<span className="xy28a-dots">...</span></span>
        ) : isRevealing ? (
          <span className="xy28a-foot-done">{drawnIssue}期 · 总和 {sum} · {sumBig}</span>
        ) : (
          <span className="xy28a-foot-wait">{gameName} · 等待开奖</span>
        )}
      </div>
    </div>
  );
}
