import React, { useState, useEffect, useRef } from 'react';
import { lhcColorOf, lhcZodiacOf, LHC_WAVE_HEX } from '../constants/gameData';

// ===== 一分澳门六合彩 开奖动画 — 「MARK SIX」摇珠机风格 =====
// Purple broadcast stage with a glass lottery sphere. Flow:
//   1. idle    : betting open — the last draw sits in the 7 slots, sphere idles.
//   2. 封盘 spin: timeLeft <= lockSeconds — sphere spins, slots roll random numbers.
//   3. draw     : timeLeft hits 0, the 7 numbers are drawn, timeLeft resets.
//   4. reveal   : the 6 正码 + 特码 drop into their slots one-by-one (left → right).

const STEP_MS = 450;        // time between each ball being sucked out / revealed
const REVEAL_WINDOW = 4.2;  // seconds the freshly-drawn result reveals / stays lit

export default function LhcAnimation({ activeGame, gameName, lockSeconds = 10 }) {
  const { timeLeft, maxTime, history, currentIssue } = activeGame;

  const result = (history && history.length > 0) ? history[0].numbers : [0, 0, 0, 0, 0, 0, 0];
  const drawnIssue = (history && history.length > 0) ? history[0].issue : (currentIssue - 1).toString();

  const elapsed = maxTime - timeLeft;
  const isSpinning = timeLeft <= lockSeconds && timeLeft > 0;
  const isRevealing = !isSpinning && elapsed < REVEAL_WINDOW;

  // Rolling random numbers shown in the slots while the sphere spins.
  const [roll, setRoll] = useState([0, 0, 0, 0, 0, 0, 0]);
  const rollRef = useRef(null);
  useEffect(() => {
    if (!isSpinning) {
      if (rollRef.current) clearInterval(rollRef.current);
      return;
    }
    rollRef.current = setInterval(() => {
      setRoll(Array.from({ length: 7 }, () => Math.floor(Math.random() * 49) + 1));
    }, 70);
    return () => { if (rollRef.current) clearInterval(rollRef.current); };
  }, [isSpinning]);

  // Step-driven reveal: during the reveal window the balls are sucked up the
  // central tube one at a time; each completed suck reveals the next slot. The
  // tube-suck CSS animation period (STEP_MS) matches this interval so the rhythm
  // of "ball pops out of the tube" lines up with "ball appears in the slot".
  const [revealStep, setRevealStep] = useState(7);
  const stepRef = useRef(null);
  useEffect(() => {
    if (!isRevealing) {
      if (stepRef.current) clearInterval(stepRef.current);
      setRevealStep(7); // idle / spinning: all slots populated
      return;
    }
    setRevealStep(0);
    let n = 0;
    stepRef.current = setInterval(() => {
      n += 1;
      setRevealStep(n);
      if (n >= 7 && stepRef.current) clearInterval(stepRef.current);
    }, STEP_MS);
    return () => { if (stepRef.current) clearInterval(stepRef.current); };
  }, [isRevealing, drawnIssue]);

  // The tube ball should keep being sucked up only while balls remain to reveal.
  const isSucking = isRevealing && revealStep < 7;

  const sum = result.reduce((a, b) => a + b, 0);

  const mmss = (s) => {
    const v = Math.max(0, s);
    const m = Math.floor(v / 60).toString().padStart(2, '0');
    const ss = (v % 60).toString().padStart(2, '0');
    return `00:${m}:${ss}`;
  };

  // One ball slot. `special` styles the 特码 (7th) with a gold ring.
  const renderBall = (num, idx, special) => {
    if (isSpinning) {
      return (
        <span key={`s${idx}`} className={`lhca-ball rolling ${special ? 'special' : ''}`}>
          {roll[idx].toString().padStart(2, '0')}
        </span>
      );
    }
    // Not yet sucked out — show an empty pending slot.
    if (idx >= revealStep) {
      return <span key={`p${idx}`} className={`lhca-ball pending ${special ? 'special' : ''}`} />;
    }
    const hex = LHC_WAVE_HEX[lhcColorOf(num)];
    return (
      <span
        key={`r${idx}`}
        className={`lhca-ball drop ${special ? 'special' : ''}`}
        style={{ borderColor: hex, color: hex }}
      >
        {num.toString().padStart(2, '0')}
        <em className="lhca-ball-zodiac">{lhcZodiacOf(num)}</em>
      </span>
    );
  };

  return (
    <div className="lhca-stage">
      {/* Repeated MARK SIX watermark */}
      <div className="lhca-watermark" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i}>{i % 2 === 0 ? 'MARK SIX' : '六合彩'}</span>
        ))}
      </div>

      {/* Countdown */}
      <div className="lhca-timer">{mmss(timeLeft)}</div>

      {/* Glass sphere machine. A 玻璃管 runs vertically through the centre with a
          gold funnel at the top. Balls rest at the bottom; churn while spinning;
          and get sucked up the central tube one-by-one while revealing. */}
      <div className={`lhca-machine ${isSpinning ? 'spin' : ''} ${isRevealing ? 'revealing' : ''} ${isSucking ? 'sucking' : ''}`}>
        <div className={`lhca-sphere ${isSpinning ? 'spin' : ''}`}>
          <div className="lhca-sphere-glass" />
          <div className="lhca-sphere-shine" />
          {/* Balls pile at the bottom (behind the central tube) */}
          <div className="lhca-sphere-balls" aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${(i % 5) * 0.08}s` }} />
            ))}
          </div>
          {/* Central glass tube + gold funnel; a ball rises up it during 开奖 */}
          <div className="lhca-tube" aria-hidden="true">
            <span className="lhca-tube-ball" />
          </div>
          <div className="lhca-funnel" aria-hidden="true" />
        </div>
      </div>

      {/* Result slots: 6 正码 + 特码 */}
      <div className="lhca-slots">
        {result.slice(0, 6).map((num, i) => renderBall(num, i, false))}
        <span className="lhca-plus">+</span>
        {renderBall(result[6], 6, true)}
      </div>

      {/* Info bar */}
      <div className="lhca-info">
        <span>期数：<b>{drawnIssue}</b></span>
        <span className="lhca-info-draw">
          开奖号码：<b>{result.slice(0, 6).map((n) => n.toString().padStart(2, '0')).join(' ')}</b>
          <i> + {result[6].toString().padStart(2, '0')}</i>
        </span>
        <span>总和：<b className="lhca-info-sum">{sum}</b></span>
      </div>

      {/* Status line */}
      <div className="lhca-status">
        {isSpinning
          ? <span className="lhca-status-live">正在开奖<span className="lhca-dots">...</span></span>
          : isRevealing
            ? <span className="lhca-status-done">{drawnIssue}期 开奖完成</span>
            : <span className="lhca-status-wait">{gameName} · 等待开奖</span>}
      </div>
    </div>
  );
}
