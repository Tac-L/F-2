import React, { useState, useEffect, useRef } from 'react';
import Dice from './Dice';
import { k3SumBig } from '../constants/gameData';

// ===== 快三 (K3) 开奖动画 =====
// Timeline across one period (timeLeft counts maxTime -> 0):
//   1. idle    : betting open. Last result + 和值 shown, the central 倒计时 ticks down.
//   2. 封盘 spin: when timeLeft <= lockSeconds the round is sealed and the three
//                 dice tumble through random faces ("正在开奖").
//   3. draw     : timeLeft hits 0, the new dice are drawn, timeLeft resets.
//   4. reveal   : the fresh result settles die-by-die with a pop, the 和值 / 大小
//                 banner flips in, then settles back to idle.

const REVEAL_WINDOW = 2.4;     // seconds the freshly-drawn result stays highlighted
const SETTLE_STEP = 0.18;      // delay between consecutive dice locking in (left → right)

export default function K3Animation({ activeGame, gameName, lockSeconds = 10 }) {
  const { timeLeft, maxTime, history, currentIssue } = activeGame;

  // Random faces shown while the dice tumble during 封盘.
  const [rollFaces, setRollFaces] = useState([1, 1, 1]);
  const rollRef = useRef(null);

  const result = (history && history.length > 0) ? history[0].numbers : [1, 1, 1];
  const drawnIssue = (history && history.length > 0) ? history[0].issue : (currentIssue - 1).toString();

  const elapsed = maxTime - timeLeft;          // 0 right after a draw

  // 封盘: the sealed window before the draw — this is when the dice tumble.
  const isSpinning = timeLeft <= lockSeconds && timeLeft > 0;
  // The settle/reveal runs in the first couple seconds of the new period.
  const isRevealing = !isSpinning && elapsed < REVEAL_WINDOW;
  const showResult = !isSpinning;              // result is on the board whenever not spinning

  // Tumble loop: cycle random faces only while sealed.
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
  const sum = result.reduce((a, b) => a + b, 0);
  const sumBig = k3SumBig(sum) ? '大' : '小';
  const sumOdd = sum % 2 !== 0 ? '单' : '双';

  const mmss = (s) => {
    const v = Math.max(0, s);
    const m = Math.floor(v / 60).toString().padStart(2, '0');
    const ss = (v % 60).toString().padStart(2, '0');
    return `00:${m}:${ss}`;
  };

  // Per-die class: tumbling while sealed, a staggered settle pop on reveal.
  const dieClass = (i) =>
    isSpinning ? 'k3a-die tumbling' : isRevealing ? 'k3a-die settling' : 'k3a-die';
  const dieDelay = (i) => (isRevealing ? { animationDelay: `${i * SETTLE_STEP}s` } : undefined);

  return (
    <div className="k3a-stage">
      {/* Top banner: logo + result equation + issue numbers */}
      <div className="k3a-topbar">
        <div className="k3a-logo">快<span>3</span></div>

        <div className="k3a-result-plate">
          {isSpinning ? (
            <span className="k3a-result-live">正在开奖<span className="k3a-dots">...</span></span>
          ) : (
            <>
              <span className="k3a-eq-num">{result[0]}</span>
              <span className="k3a-eq-op">+</span>
              <span className="k3a-eq-num">{result[1]}</span>
              <span className="k3a-eq-op">+</span>
              <span className="k3a-eq-num">{result[2]}</span>
              <span className="k3a-eq-op">=</span>
              <span className="k3a-eq-sum">{sum}</span>
              <span className="k3a-eq-div" />
              <span className={`k3a-eq-bs ${sumBig === '大' ? 'big' : 'small'}`}>{sumBig}</span>
            </>
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

      {/* Bottom: three dice in glowing domes */}
      <div className="k3a-dice-row">
        {[0, 1, 2].map((i) => (
          <div key={i} className="k3a-dome">
            <div className={dieClass(i)} style={dieDelay(i)}>
              <Dice value={faces[i]} size={46} />
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
          <span className="k3a-foot-done">和值 {sum} · {sumBig}{sumOdd}</span>
        ) : (
          <span className="k3a-foot-wait">{gameName} · 等待开奖</span>
        )}
      </div>
    </div>
  );
}
