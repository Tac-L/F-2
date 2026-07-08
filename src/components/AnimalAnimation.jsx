import React from 'react';

// 动物运动会 (Animal Olympics) draw animation.
//
// The animation is a pre-packaged Cocos Creator game shipped under /public/TGame.
// Rather than re-implement it in React (like the other games' animations), we embed
// it directly via an iframe — it self-boots and renders the animal-race scene shown
// in the product screenshots. Live draw data is fetched by the game from its own
// backend when reachable; offline it simply shows the idle race scene.
export default function AnimalAnimation({ activeGameId }) {
  const src = `${import.meta.env.BASE_URL}TGame/index.html`;
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
