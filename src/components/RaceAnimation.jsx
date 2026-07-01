import React, { useState, useEffect, useRef } from 'react';
import { PK10_COLORS } from '../constants/gameData';

// Web Audio API Sound Synthesizer Class
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.filterNode = null;
    this.isPlayingEngine = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startEngine() {
    this.init();
    this.resume();
    if (!this.ctx || this.isPlayingEngine) return;

    try {
      // 1. Create nodes
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.filterNode = this.ctx.createBiquadFilter();

      // Low frequency oscillator for rumble effect
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      // Configure LFO
      lfo.type = 'sine';
      lfo.frequency.value = 12; // 12 Hz throttle vibration
      lfoGain.gain.value = 10; // amplitude of pitch variation

      // Configure Engine Oscillator
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 45; // Low pitch rumble

      // Configure Filter to make it sound muffled/exhaust-like
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.value = 80;
      this.filterNode.Q.value = 2.0;

      // Set volume
      this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      // Connect LFO to modulate Engine Oscillator frequency
      lfo.connect(lfoGain);
      lfoGain.connect(this.engineOsc.frequency);

      // Connect audio chain: Osc -> Filter -> Gain -> Destination
      this.engineOsc.connect(this.filterNode);
      this.filterNode.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      // Start oscillators
      lfo.start();
      this.engineOsc.start();
      this.isPlayingEngine = true;

      // Keep reference to LFO for cleanup
      this.lfo = lfo;
      this.lfoGain = lfoGain;
    } catch (e) {
      console.warn("Failed to start engine audio:", e);
    }
  }

  setEngineSpeed(speedRatio) {
    if (!this.ctx || !this.isPlayingEngine || !this.engineOsc || !this.filterNode) return;
    // Map speed ratio (0 to 1) to frequency (45Hz to 140Hz) and filter cutoff (80Hz to 250Hz)
    const time = this.ctx.currentTime;
    const targetFreq = 45 + speedRatio * 95;
    const targetFilter = 80 + speedRatio * 170;

    this.engineOsc.frequency.setTargetAtTime(targetFreq, time, 0.1);
    this.filterNode.frequency.setTargetAtTime(targetFilter, time, 0.1);
    this.engineGain.gain.setTargetAtTime(0.08 + speedRatio * 0.04, time, 0.2);
  }

  stopEngine() {
    if (!this.isPlayingEngine) return;
    try {
      if (this.engineOsc) this.engineOsc.stop();
      if (this.lfo) this.lfo.stop();
      this.isPlayingEngine = false;
    } catch (e) {
      console.warn("Error stopping engine audio:", e);
    }
  }

  playBeep() {
    this.init();
    this.resume();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime); // 1kHz beep
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Failed to play beep:", e);
    }
  }
}

export default function RaceAnimation({
  activeGame,
  isVideoOpen,
  activeGameId
}) {
  const { timeLeft, maxTime, history, currentIssue } = activeGame;
  
  // States
  const [isMuted, setIsMuted] = useState(true);
  const [carPositions, setCarPositions] = useState(Array(10).fill(85)); // Starts on right (85%)
  const [activeRank, setActiveRank] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  // Audio reference
  const audioRef = useRef(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new SoundSynth();
    return () => {
      if (audioRef.current) {
        audioRef.current.stopEngine();
      }
    };
  }, []);

  // Determine if currently in the racing state
  // We race for the first 7 seconds of a new round, then show podium for 5 seconds
  const RACE_TIME = 7;
  const PODIUM_TIME = 5;
  const TOTAL_ANIM_TIME = RACE_TIME + PODIUM_TIME; // 12

  const isRacing = timeLeft > (maxTime - RACE_TIME);
  const isPodium = timeLeft <= (maxTime - RACE_TIME) && timeLeft > (maxTime - TOTAL_ANIM_TIME);
  const isCountdown = timeLeft <= (maxTime - TOTAL_ANIM_TIME);

  const raceSecondsElapsed = maxTime - timeLeft; // 0 to 6 during race

  // Manage Sound engine based on racing state and mute state
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isVideoOpen && !isMuted) {
      audioRef.current.startEngine();
      if (isRacing) {
        // Accelerate sound
        const speedRatio = Math.sin((raceSecondsElapsed / RACE_TIME) * Math.PI);
        audioRef.current.setEngineSpeed(0.4 + speedRatio * 0.6);
      } else {
        // Idle sound
        audioRef.current.setEngineSpeed(0);
      }
    } else {
      audioRef.current.stopEngine();
    }
  }, [isVideoOpen, isMuted, isRacing, raceSecondsElapsed]);

  // Beep on the final 3 seconds before draw
  useEffect(() => {
    if (!audioRef.current || isMuted || !isVideoOpen || isRacing || isPodium) return;
    // Play beep when countdown displays 3, 2, or 1 second before draw
    if (timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
      audioRef.current.playBeep();
    }
  }, [timeLeft, isMuted, isVideoOpen, isRacing, isPodium]);

  // Animation ticks for the racing loop
  useEffect(() => {
    let animId;
    
    if (isCountdown) {
      // Countdown phase: reset cars to the start line (right side)
      // Slight vertical layout offset for cars stack, wait on starting line
      setCarPositions(Array(10).fill(85));
      
      // Rank row displays last draw results
      if (history && history.length > 0) {
        setActiveRank(history[0].numbers);
      } else {
        setActiveRank([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      }
      return;
    }

    if (isPodium) {
      // Podium phase: Keep cars at their final finish positions
      const targetNumbers = (history && history.length > 0) ? history[0].numbers : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const finalPos = Array(10).fill(0).map((_, idx) => {
        const carNum = idx + 1;
        const finalRankIdx = targetNumbers.indexOf(carNum);
        return 8 + finalRankIdx * 6;
      });
      setCarPositions(finalPos);
      setActiveRank(targetNumbers);
      return;
    }

    // Racing phase: update cars positions dynamically to simulate race
    const startTimestamp = Date.now();
    const durationMs = RACE_TIME * 1000;
    
    // Determine target numbers from previous history (the newly drawn numbers)
    const targetNumbers = (history && history.length > 0) ? history[0].numbers : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const updatePositions = () => {
      const elapsed = Date.now() - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1); // 0 to 1

      // Generate positions for each car
      const newPos = Array(10).fill(0).map((_, idx) => {
        const carNum = idx + 1;
        // Find final rank index of this car in targetNumbers
        const finalRankIdx = targetNumbers.indexOf(carNum); // 0 = 1st place (leftmost), 9 = 10th place

        if (progress < 0.8) {
          // Phase 1: shuffles randomly on the middle track (between 15% and 75%)
          const speedFactor = Math.sin(progress * Math.PI * 2 + carNum) * 20;
          const randomJitter = Math.cos(progress * 15 + carNum * 3) * 8;
          return 50 + speedFactor + randomJitter; // centers around 50%
        } else {
          // Phase 2: sprint to the finish line
          // 1st place: 8% (leftmost), 2nd place: 14%, 3rd place: 20%, ..., 10th place: 62%
          const finalTargetPos = 8 + finalRankIdx * 6;
          // Interpolate progress from 0.8 to 1
          const sprintProgress = (progress - 0.8) / 0.2;
          const smoothSprint = Math.sin((sprintProgress * Math.PI) / 2);
          
          const speedFactorAt08 = Math.sin(0.8 * Math.PI * 2 + carNum) * 20;
          const randomJitterAt08 = Math.cos(0.8 * 15 + carNum * 3) * 8;
          const posAt08 = 50 + speedFactorAt08 + randomJitterAt08;

          return posAt08 + (finalTargetPos - posAt08) * smoothSprint;
        }
      });

      setCarPositions(newPos);

      // Compute rank based on current position on screen
      const rankWithPositions = newPos.map((pos, idx) => ({
        num: idx + 1,
        pos
      }));
      // Sort: smaller pos value is ahead
      rankWithPositions.sort((a, b) => a.pos - b.pos);
      setActiveRank(rankWithPositions.map(item => item.num));

      if (progress < 1) {
        animId = requestAnimationFrame(updatePositions);
      }
    };

    animId = requestAnimationFrame(updatePositions);

    return () => cancelAnimationFrame(animId);
  }, [isRacing, isPodium, isCountdown, history]);

  // Handle Mute Button click
  const handleToggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
    if (audioRef.current) {
      audioRef.current.resume();
    }
  };

  // Safe variables for displaying stats
  // We want to show stats of the PREVIOUS draw if we are counting down.
  // If we are racing, we show the draw stats of the *prior* draw until the race ends, or the *new* draw.
  // Actually, to match Image 2: when counting down to Issue 34, we show results of Issue 33.
  // So the issue displayed should be:
  // - If racing: the issue that is currently being drawn (currentIssue - 1).
  // - If countdown: the last drawn issue (currentIssue - 1).
  const statsIssue = isRacing ? (currentIssue - 1) : (history[0]?.issue || (currentIssue - 1).toString().padStart(5, '0'));
  
  // Calculate sum and dragon/tiger stats for display
  const statsDrawNumbers = isRacing 
    ? (history[1]?.numbers || [1,2,3,4,5,6,7,8,9,10])
    : (history[0]?.numbers || [1,2,3,4,5,6,7,8,9,10]);

  const statsSum = statsDrawNumbers[0] + statsDrawNumbers[1];
  const statsSumBS = statsSum >= 12 ? '小' : '大'; // Wait! In PK10: Big is >= 12, Small is <= 11? No, wait!
  // Let's verify sum Big/Small: 3 to 19 range. Midpoint is 11. 
  // In gameData.js line 209: `const isBig = sum >= 12;` -> so Big is >= 12, Small is <= 11.
  // Wait! In Image 2, the Sum is `11`, and the badge says `小`. This matches!
  const statsSumOddEven = statsSum % 2 !== 0 ? '单' : '双';

  const statsDragonTiger = Array(5).fill('').map((_, i) => {
    return statsDrawNumbers[i] > statsDrawNumbers[9 - i] ? '龙' : '虎';
  });

  const renderPodiumBall = (num) => {
    if (!num) return null;
    const color = PK10_COLORS[num] || { bg: '#9ca3af', text: '#ffffff' };
    return (
      <span
        className="podium-winner-ball"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {num}
      </span>
    );
  };

  // Render static black placeholder if video toggled off
  if (!isVideoOpen) {
    return (
      <div className="video-player-container closed">
        <div className="video-placeholder-title">極速賽車</div>
      </div>
    );
  }

  return (
    <div className="video-player-container open">
      {/* Top Banner Row: Logo, Live Ranks, Sound Control */}
      <div className="video-top-bar">
        <span className="video-logo">極速賽車</span>
        <div className="video-rank-row">
          {activeRank.map((num, idx) => {
            const color = PK10_COLORS[num] || { bg: '#9ca3af', text: '#ffffff' };
            return (
              <span
                key={idx}
                className="video-rank-ball"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                {num}
              </span>
            );
          })}
        </div>
        <button
          type="button"
          className="video-sound-btn"
          onClick={handleToggleMute}
          title={isMuted ? "开启声音" : "关闭声音"}
        >
          {isMuted ? (
            // Muted Speaker Icon
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          ) : (
            // Playing Speaker Icon
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Racetrack & Animation Area */}
      <div className={`video-stage ${isRacing ? 'racing' : ''}`}>
        
        {/* Parallax Landmarks Backdrop */}
        <div className="video-backdrop">
          <svg className="landmarks-svg" viewBox="0 0 430 60" fill="none" preserveAspectRatio="none">
            {/* Beijing CCTV Tower */}
            <path d="M50 55 L60 15 L72 15 L78 55 L70 55 L66 23 L62 23 L56 55 Z" fill="#334155" opacity="0.3"/>
            <path d="M58 23 L70 23 L68 28 L60 28 Z" fill="#475569" opacity="0.3"/>
            
            {/* Water Cube */}
            <rect x="110" y="32" width="55" height="23" rx="3" fill="#0284c7" opacity="0.25"/>
            <circle cx="120" cy="40" r="3" fill="#fff" opacity="0.1"/>
            <circle cx="135" cy="48" r="4" fill="#fff" opacity="0.1"/>
            <circle cx="150" cy="38" r="2.5" fill="#fff" opacity="0.1"/>
            <circle cx="128" cy="46" r="2" fill="#fff" opacity="0.1"/>
            <circle cx="145" cy="45" r="3.5" fill="#fff" opacity="0.1"/>

            {/* National Grand Theatre Dome */}
            <path d="M210 55 C210 30, 270 30, 270 55 Z" fill="#64748b" opacity="0.35"/>
            <path d="M236 55 C236 42, 244 42, 244 55 Z" fill="#1e293b" opacity="0.4"/>

            {/* Bird's Nest Stadium */}
            <ellipse cx="340" cy="42" rx="45" ry="13" fill="#475569" opacity="0.3"/>
            <path d="M295 42 L385 42 M300 35 L380 49 M300 49 L380 35 M310 32 L370 52 M320 30 L360 54 M340 29 L340 55" stroke="#334155" strokeWidth="1.5" opacity="0.35"/>
          </svg>
        </div>

        {/* Tracks Grid & Roads */}
        <div className="race-track">
          {/* Curbs at the top and bottom of track */}
          <div className="curb top"></div>
          <div className="curb bottom"></div>
          
          {/* Lanes dividers */}
          <div className="lane-line line-1"></div>
          <div className="lane-line line-2"></div>
          <div className="lane-line line-3"></div>
          <div className="lane-line line-4"></div>
          <div className="lane-line line-5"></div>
          <div className="lane-line line-6"></div>
          <div className="lane-line line-7"></div>
          <div className="lane-line line-8"></div>
          <div className="lane-line line-9"></div>

          {/* Cars rendering */}
          {carPositions.map((posPercent, idx) => {
            const carNum = idx + 1;
            const carColor = PK10_COLORS[carNum] || { bg: '#9ca3af', text: '#ffffff' };
            // Calculate track lane Y position (equally spaced vertically)
            const topOffsetPx = 10 + idx * 10.5; // fits nicely in stage

            return (
              <div
                key={carNum}
                className="race-car"
                style={{
                  left: `${posPercent}%`,
                  top: `${topOffsetPx}px`,
                  zIndex: Math.floor(posPercent) // Cars further back sit behind
                }}
              >
                {/* SVG Car Facing Left */}
                <svg width="36" height="11" viewBox="0 0 36 11" fill="none">
                  {/* Car Body shadow */}
                  <rect x="2" y="2" width="30" height="7" rx="2" fill="#000" opacity="0.3"/>
                  
                  {/* Main Car Body Colored */}
                  <path d="M0 5 L6 1 L28 1 C30 1, 32 2, 33 4 L35 5 L35 7 L33 8 C32 10, 30 11, 28 11 L6 11 L0 7 Z" fill={carColor.bg}/>
                  
                  {/* Stripes / Decals */}
                  <path d="M10 2 L22 2 L22 10 L10 10 Z" fill="#fff" opacity="0.2"/>
                  <path d="M13 1 L16 1 L14 11 L11 11 Z" fill="#000" opacity="0.15"/>
                  
                  {/* Spoiler / Wing */}
                  <rect x="30" y="0" width="3" height="11" rx="0.5" fill="#1e293b"/>
                  <rect x="31" y="2" width="3" height="7" fill={carColor.bg}/>

                  {/* Windshield */}
                  <path d="M6 3 L10 2 L10 10 L6 9 Z" fill="#1e293b"/>
                  <path d="M7 4 L9 3.5 L9 8.5 L7 8 Z" fill="#38bdf8" opacity="0.6"/>

                  {/* Wheels */}
                  <circle cx="8" cy="1" r="2.2" fill="#0f172a" stroke="#475569" strokeWidth="0.5"/>
                  <circle cx="8" cy="10" r="2.2" fill="#0f172a" stroke="#475569" strokeWidth="0.5"/>
                  <circle cx="26" cy="1" r="2.2" fill="#0f172a" stroke="#475569" strokeWidth="0.5"/>
                  <circle cx="26" cy="10" r="2.2" fill="#0f172a" stroke="#475569" strokeWidth="0.5"/>
                  
                  {/* Wheel hubs */}
                  <circle cx="8" cy="1" r="0.8" fill="#e2e8f0"/>
                  <circle cx="8" cy="10" r="0.8" fill="#e2e8f0"/>
                  <circle cx="26" cy="1" r="0.8" fill="#e2e8f0"/>
                  <circle cx="26" cy="10" r="0.8" fill="#e2e8f0"/>

                  {/* Number Badge */}
                  <circle cx="18" cy="6" r="3.2" fill="#fff"/>
                  <text x="18" y="8.2" fontSize="6.5" fontWeight="900" fill="#000" textAnchor="middle" fontFamily="Outfit, sans-serif">{carNum}</text>
                </svg>
              </div>
            );
          })}
        </div>

        {/* Countdown & Lights Overlay (only displayed in countdown phase) */}
        {isCountdown && (
          <div className="countdown-overlay">
            <div className="countdown-timer-text">
              00:{timeLeft.toString().padStart(2, '0')}<span>ss</span>
            </div>
            
            {/* Traffic Lights Box */}
            <div className="traffic-lights-box">
              {/* 6 lights: green, green, yellow, yellow, red, red */}
              {/* Green lights (indices 0, 1): active when timer > 15 */}
              <div className={`light-circle green ${timeLeft > 15 ? 'active' : ''}`}></div>
              <div className={`light-circle green ${timeLeft > 15 ? 'active' : ''}`}></div>
              
              {/* Yellow lights (indices 2, 3): active when timer is 6 to 15 */}
              <div className={`light-circle yellow ${(timeLeft <= 15 && timeLeft > 5) ? 'active' : ''}`}></div>
              <div className={`light-circle yellow ${(timeLeft <= 15 && timeLeft > 5) ? 'active' : ''}`}></div>
              
              {/* Red lights (indices 4, 5): active when timer <= 5 */}
              <div className={`light-circle red ${timeLeft <= 5 ? 'active' : ''}`}></div>
              <div className={`light-circle red ${timeLeft <= 5 ? 'active' : ''}`}></div>
            </div>
          </div>
        )}

        {/* Podium overlay (displayed in podium phase) */}
        {isPodium && (
          <div className="podium-overlay">
            {/* Mounts and flashes once */}
            <div className="photo-flash" />
            
            <div className="podium-title">本期冠亞季軍</div>
            <div className="podium-stage-container">
              
              {/* 2nd Place (亞軍) */}
              <div className="podium-column second">
                <div className="podium-trophy silver">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2H6v2H2v3c0 2.2 1.8 4 4 4h1.2c.8 1.8 2.4 3.1 4.3 3.4C11 16.3 9 18 9 20h6c0-2-2-3.7-2.5-5.6 1.9-.3 3.5-1.6 4.3-3.4H18c2.2 0 4-1.8 4-4V4h-4V2zM6 9c-1.1 0-2-.9-2-2V6h2v3zm14-2c0 1.1-.9 2-2 2V6h2v1z"/>
                  </svg>
                </div>
                <div className="podium-ball-container">
                  {renderPodiumBall(activeRank[1])}
                </div>
                <div className="podium-label">亞軍</div>
                <div className="podium-pedestal p-second">2</div>
              </div>

              {/* 1st Place (冠軍) */}
              <div className="podium-column first">
                <div className="podium-trophy gold">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 5.3 5.6.5-4.2 3.8 1.2 5.4-5-3-5 3 1.2-5.4-4.2-3.8 5.6-.5z"/>
                  </svg>
                </div>
                <div className="podium-ball-container">
                  {renderPodiumBall(activeRank[0])}
                </div>
                <div className="podium-label">冠軍</div>
                <div className="podium-pedestal p-first">1</div>
              </div>

              {/* 3rd Place (季軍) */}
              <div className="podium-column third">
                <div className="podium-trophy bronze">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2H6v2H2v3c0 2.2 1.8 4 4 4h1.2c.8 1.8 2.4 3.1 4.3 3.4C11 16.3 9 18 9 20h6c0-2-2-3.7-2.5-5.6 1.9-.3 3.5-1.6 4.3-3.4H18c2.2 0 4-1.8 4-4V4h-4V2zM6 9c-1.1 0-2-.9-2-2V6h2v3zm14-2c0 1.1-.9 2-2 2V6h2v1z"/>
                  </svg>
                </div>
                <div className="podium-ball-container">
                  {renderPodiumBall(activeRank[2])}
                </div>
                <div className="podium-label">季軍</div>
                <div className="podium-pedestal p-third">3</div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar showing previous round details */}
      <div className="video-bottom-bar">
        <div className="video-bottom-badge issue-badge">
          期号：<span>{statsIssue}</span>
        </div>
        
        <div className="video-bottom-badge sum-badge">
          冠亚和：
          <span className="badge-value blue">{statsSum}</span>
          <span className={`badge-text ${statsSumBS === '大' ? 'blue' : 'orange'}`}>{statsSumBS}</span>
          <span className={`badge-text ${statsSumOddEven === '单' ? 'blue' : 'orange'}`}>{statsSumOddEven}</span>
        </div>

        <div className="video-bottom-badge dt-badge">
          龙虎：
          {statsDragonTiger.map((val, idx) => (
            <span key={idx} className={`badge-text ${val === '龙' ? 'blue' : 'orange'}`}>
              {val}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
