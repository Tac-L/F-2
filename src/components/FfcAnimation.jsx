import React, { useState, useEffect, useRef } from 'react';
import { FFC_COLORS } from '../constants/gameData';

// ===== 分分彩 开奖动画 =====
// Timeline across one period (timeLeft counts maxTime -> 0):
//   1. idle    : betting open. Last result is shown, a 倒计时 ticks down.
//   2. 封盘 spin: when timeLeft <= lockSeconds the round is sealed and the 5
//                 middle cards spin through random digits ("正在开奖").
//   3. draw     : timeLeft hits 0, the new numbers are drawn, timeLeft resets.
//   4. reveal   : the fresh result flips open card-by-card (翻牌 cascade),
//                 with the 大小 / 单双 tags flipping in, then settles back to idle.

const REVEAL_WINDOW = 2.4;     // seconds the "开奖号码" reveal status lingers after a draw
const CASCADE_STEP = 0.13;     // flip delay between consecutive cards (翻牌 cascade)

export default function FfcAnimation({ activeGame, lockSeconds = 10 }) {
  const { timeLeft, maxTime, history, currentIssue } = activeGame;

  // Random digits shown while the cards spin during 封盘.
  const [rollDigits, setRollDigits] = useState([0, 0, 0, 0, 0]);
  const rollRef = useRef(null);

  const result = (history && history.length > 0) ? history[0].numbers : [0, 0, 0, 0, 0];
  const drawnIssue = (history && history.length > 0) ? history[0].issue : (currentIssue - 1).toString();

  const elapsed = maxTime - timeLeft;        // 0 right after a draw

  // 封盘: the sealed window before the draw — this is when the reels spin.
  const isSpinning = timeLeft <= lockSeconds && timeLeft > 0;
  // The reveal cascade (翻牌) runs in the first couple seconds of the new period.
  const isRevealing = !isSpinning && elapsed < REVEAL_WINDOW;
  const justDrawn = isRevealing;
  const showResult = !isSpinning;            // result is on the board whenever not spinning

  // Cards carry the flip animation ONLY during the reveal window; in idle they
  // render statically so a delayed-flip frame can never leave them invisible.
  const numCardClass = (i) =>
    isSpinning ? 'rolling' : isRevealing ? 'revealed flip-in' : 'revealed';
  const tagCardClass = () =>
    isSpinning ? 'blank' : isRevealing ? 'flip-in' : 'shown';
  const flipDelay = (i) => (isRevealing ? { animationDelay: `${i * CASCADE_STEP}s` } : undefined);

  // Spin loop: cycle random digits only while sealed.
  useEffect(() => {
    if (!isSpinning) {
      if (rollRef.current) clearInterval(rollRef.current);
      return;
    }
    rollRef.current = setInterval(() => {
      setRollDigits(() => Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)));
    }, 70);
    return () => {
      if (rollRef.current) clearInterval(rollRef.current);
    };
  }, [isSpinning]);

  const bigSmall = (d) => (d >= 5 ? '大' : '小');
  const oddEven = (d) => (d % 2 !== 0 ? '单' : '双');
  const sum = result.reduce((a, b) => a + b, 0);
  const sumBig = sum >= 23 ? '大' : '小';

  const mmss = (s) => `00:${Math.max(0, s).toString().padStart(2, '0')}`;

  const cells = [0, 1, 2, 3, 4].map((i) => ({
    i,
    digit: isSpinning ? rollDigits[i] : result[i],
    bs: bigSmall(result[i]),
    oe: oddEven(result[i]),
  }));

  return (
    <div className="ffc-stage">
      {/* Decorative hanging lantern strip */}
      <div className="ffc-lantern-strip" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="ffc-lantern" />
        ))}
      </div>

      <div className="ffc-board">
        {/* Wooden title plaque */}
        <div className="ffc-plaque">分分彩</div>

        <div className="ffc-board-inner">
          {/* Left: the three rows of cards */}
          <div className="ffc-cards-area">
            {/* Top row — 大小 */}
            <div className="ffc-row">
              {cells.map((c) => (
                <div
                  key={`bs-${c.i}`}
                  className={`ffc-tag-card ${tagCardClass()}`}
                  style={flipDelay(c.i)}
                >
                  {showResult && (
                    <span className={c.bs === '大' ? 'tag-big' : 'tag-small'}>{c.bs}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Middle row — spinning / revealed numbers */}
            <div className="ffc-row">
              {cells.map((c) => {
                const color = FFC_COLORS[c.digit] || { bg: '#9ca3af', text: '#fff' };
                return (
                  <div
                    key={`num-${c.i}`}
                    className={`ffc-num-card ${numCardClass(c.i)}`}
                    style={flipDelay(c.i)}
                  >
                    <span
                      className="ffc-num-digit"
                      style={showResult ? { color: color.bg } : undefined}
                    >
                      {c.digit}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom row — 单双 */}
            <div className="ffc-row">
              {cells.map((c) => (
                <div
                  key={`oe-${c.i}`}
                  className={`ffc-tag-card ${tagCardClass()}`}
                  style={flipDelay(c.i)}
                >
                  {showResult && (
                    <span className={c.oe === '单' ? 'tag-odd' : 'tag-even'}>{c.oe}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: wooden info sign + 总和 badge */}
          <div className="ffc-side">
            <div className="ffc-sign">
              <div className="ffc-sign-issue">
                本期：<span>{isSpinning ? currentIssue : drawnIssue}</span>期
              </div>
              <div className="ffc-sign-status">
                {isSpinning ? (
                  <span className="open-live">正在开奖<span className="ffc-dots">...</span></span>
                ) : justDrawn ? (
                  <>开奖号码：<span className="open-done">{result.join(' ')}</span></>
                ) : (
                  <span className="open-wait">等待开奖</span>
                )}
              </div>
            </div>

            {/* Big countdown to the draw — visible while open and during 封盘 spin */}
            {!justDrawn && (
              <div className={`ffc-countdown ${isSpinning ? 'sealed' : ''}`}>
                <span className="cd-label">{isSpinning ? '封盘' : '距开奖'}</span>
                <span className="cd-secs">{mmss(timeLeft)}</span>
              </div>
            )}

            {/* 总和 badge — shown alongside the revealed result */}
            {showResult && justDrawn && (
              <div className="ffc-sum-badge">
                <span className="sum-val">{sum}</span>
                <span className={`sum-bs ${sumBig === '大' ? 'big' : 'small'}`}>{sumBig}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
