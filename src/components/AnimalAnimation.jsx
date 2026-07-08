import React, { useEffect } from 'react';

// 动物运动会 (Animal Olympics) draw animation.
//
// The animation is a pre-packaged Cocos Creator game shipped under /public/TGame,
// embedded via an iframe. The app is the source of truth ("App 为准"): we publish
// the active game's current issue / countdown / last result to a global that the
// game's offline mock (public/TGame/mock-api.js) reads, so the animation plays the
// SAME result and issue number as the rest of the app instead of its own random data.

// Convert a finishing order [3,1,5,2,6,4] to the game's lotteryCode "CAEBFD"
// (animal number n → letter: 1→A … 6→F).
const toLotteryCode = (nums) =>
  (nums || []).map((n) => String.fromCharCode(64 + n)).join('');

export default function AnimalAnimation({ activeGameId, activeGame, lockSeconds = 15 }) {
  const src = `${import.meta.env.BASE_URL}TGame/index.html`;

  // Publish App state for the embedded game's mock to consume. Runs every tick
  // (activeGame.timeLeft changes each second) so the countdown stays in sync.
  useEffect(() => {
    if (!activeGame) return;
    const last = activeGame.history && activeGame.history[0];
    window.__ANIMAL_FEED__ = {
      // Current (betting) issue shown during the countdown.
      issue: String(activeGame.currentIssue),
      // Seconds until 封盘 — the game counts this down, then plays the race.
      countdown: Math.max(1, (activeGame.timeLeft || 0) - lockSeconds),
      countdown1: 8,
      // The last completed draw is what the race animates toward.
      lotteryCode: last ? toLotteryCode(last.numbers) : '',
      lastIssue: last ? String(last.issue) : String(activeGame.currentIssue),
    };
  }, [activeGame, lockSeconds]);

  return (
    <div className="video-stage animal-stage">
      <iframe
        // Re-mount when the game changes so the scene resets cleanly.
        key={activeGameId}
        className="animal-game-frame"
        src={src}
        title="动物运动会开奖动画"
        scrolling="no"
        allow="autoplay"
      />
    </div>
  );
}
