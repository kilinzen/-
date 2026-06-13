/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from "react";
import { Play, RotateCcw, Shield, ShieldAlert, Award, Star, Zap } from "lucide-react";
import { PlayerStats } from "../types";

interface SnakeGameProps {
  stats: PlayerStats;
  selectedSkinColor: string;
  selectedSkinIcon: string;
  onWin: (goldEarned: number, gemsEarned: number, endingScore: number) => void;
  onLose: (peakScore: number) => void;
  onScoreGrow: (amount: number) => void;
}

interface GameGate {
  lane: number; // 0: left, 1: center, 2: right
  type: "add" | "sub" | "mult" | "div";
  value: number;
  y: number; // relative pos on track (0 to 5000)
  passed: boolean;
}

interface GamePowerUp {
  lane: number;
  type: "shield" | "magnet" | "gem";
  y: number;
  collected: boolean;
}

interface GameCoin {
  lane: number;
  y: number;
  collected: boolean;
  value: number;
}

interface Particle {
  id: string; // Add dynamic ID
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  val?: string;
}

export default function SnakeGame({
  stats,
  selectedSkinColor,
  selectedSkinIcon,
  onWin,
  onLose,
  onScoreGrow,
}: SnakeGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [snakeScore, setSnakeScore] = useState(1);
  const [activeShield, setActiveShield] = useState(false);
  const [activeMagnet, setActiveMagnet] = useState(false);
  const [magnetTimer, setMagnetTimer] = useState(0);

  // Stats for run screen
  const [runGoldCollected, setRunGoldCollected] = useState(0);
  const [runGemsCollected, setRunGemsCollected] = useState(0);
  const [runProgress, setRunProgress] = useState(0); // 0 to 100

  // Reference for game ticks (using ref to avoid state stale closures in requestAnimationFrame)
  const gameRef = useRef({
    isPlaying: false,
    snakeScore: 1,
    peakScore: 1,
    snakeX: 150, // 0 to 300 lane coordinate mapping
    targetSnakeX: 150,
    speed: 4,
    cameraY: 0,
    gates: [] as GameGate[],
    powerups: [] as GamePowerUp[],
    coins: [] as GameCoin[],
    particles: [] as Particle[],
    roadLength: 4500, // Finish line at 4500px
    bossHp: 100,
    maxBossHp: 100,
    bossActive: false,
    bossY: 4800,
    chestExploded: false,
    goldCollected: 0,
    gemsCollected: 0,
    shieldActive: false,
    magnetTimerActive: 0, // seconds
    hasFitted: false,
  });

  // Sound Synth Generator
  const playSound = (type: "coin" | "gate-good" | "gate-bad" | "hit" | "explosion" | "shield") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "coin") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === "gate-good") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.25); // C6
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      } else if (type === "shield") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.32);
      } else if (type === "gate-bad") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(349.23, ctx.currentTime); // F4
        osc.frequency.linearRampToValueAtTime(130.81, ctx.currentTime + 0.3); // C3
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.31);
      } else if (type === "hit") {
        osc.type = "square";
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.11);
      } else if (type === "explosion") {
        // Noise synthesis simulation
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.61);
      }
    } catch (e) {
      // Audio context block security policy guard
    }
  };

  // Setup / reset Level Elements
  const initLevel = () => {
    // Stage determines difficulty & boss HP
    const stage = stats.currentStage;
    const startScore = Math.max(1, stats.metaStartCount);
    const bossHp = Math.round(100 + stage * 65);

    gameRef.current.peakScore = startScore;
    setSnakeScore(startScore);
    setIsGameOver(false);
    setIsWon(false);
    setRunGoldCollected(0);
    setRunGemsCollected(0);
    setRunProgress(0);
    setActiveShield(false);
    setActiveMagnet(false);
    setMagnetTimer(0);

    // Populate track with structural patterns
    const gates: GameGate[] = [];
    const coins: GameCoin[] = [];
    const powerups: GamePowerUp[] = [];

    // Let's lay down gates and elements every 350-450 pixels
    const trackEnds = 4300;
    let currY = 500;

    while (currY < trackEnds) {
      // 0: left (x: 50), 1: center (x: 150), 2: right (x: 250)
      const choiceType = Math.random();

      if (choiceType < 0.65) {
        // Double Gate Choice! e.g. lane 0 is +X, lane 2 is -Y
        const leftIsGood = Math.random() > 0.4;
        const rewardScale = Math.round(5 + stage * 2);
        const penaltyScale = Math.round(3 + stage);

        gates.push({
          lane: 0,
          type: leftIsGood ? (Math.random() > 0.7 ? "mult" : "add") : (Math.random() > 0.8 ? "div" : "sub"),
          value: leftIsGood ? (Math.random() > 0.7 ? 2 : rewardScale) : (Math.random() > 0.8 ? 2 : penaltyScale),
          y: currY,
          passed: false,
        });

        gates.push({
          lane: 2,
          type: !leftIsGood ? (Math.random() > 0.7 ? "mult" : "add") : (Math.random() > 0.8 ? "div" : "sub"),
          value: !leftIsGood ? (Math.random() > 0.7 ? 2 : rewardScale) : (Math.random() > 0.8 ? 2 : penaltyScale),
          y: currY,
          passed: false,
        });
      } else {
        // Single central multiplier or jackpot door
        gates.push({
          lane: 1,
          type: "mult",
          value: 3,
          y: currY,
          passed: false,
        });
      }

      // Add neat coins alongside and in-between gates
      for (let c = 0; c < 5; c++) {
        const coinLane = Math.floor(Math.random() * 3);
        coins.push({
          lane: coinLane,
          y: currY + 120 + c * 35,
          collected: false,
          value: Math.round(1 + stage * 0.5),
        });
      }

      // Chance to spawn power-up
      if (Math.random() > 0.65) {
        powerups.push({
          lane: Math.floor(Math.random() * 3),
          type: Math.random() > 0.5 ? "shield" : "magnet",
          y: currY + 230,
          collected: false,
        });
      } else if (Math.random() > 0.9) {
        powerups.push({
          lane: Math.floor(Math.random() * 3),
          type: "gem",
          y: currY + 200,
          collected: false,
        });
      }

      currY += 480;
    }

    gameRef.current = {
      isPlaying: false,
      snakeScore: startScore,
      snakeX: 150,
      targetSnakeX: 150,
      speed: 4.5 + stage * 0.15,
      cameraY: 0,
      gates,
      powerups,
      coins,
      particles: [],
      roadLength: 4500,
      bossHp: bossHp,
      maxBossHp: bossHp,
      bossActive: false,
      bossY: 4550,
      chestExploded: false,
      goldCollected: 0,
      gemsCollected: 0,
      shieldActive: false,
      magnetTimerActive: 0,
      hasFitted: true,
    };
  };

  useEffect(() => {
    initLevel();
  }, [stats.currentStage, stats.metaStartCount]);

  // Main Canvas & Interaction controller
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const fitCanvas = () => {
      if (containerRef.current && canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = containerRef.current.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);
      }
    };

    fitCanvas();
    const handleResize = () => fitCanvas();
    window.addEventListener("resize", handleResize);

    // Mouse movement listeners inside container
    const handleMouseMove = (e: MouseEvent) => {
      if (!gameRef.current.isPlaying) return;
      const rect = canvas.getBoundingClientRect();
      const xRel = e.clientX - rect.left;
      const pct = xRel / rect.width;
      // Clamp between lane 0 and lane 2 boundary (approx 30px to 270px out of 300 scale)
      gameRef.current.targetSnakeX = Math.max(30, Math.min(270, pct * 300));
    };

    // Touch listeners
    const handleTouchMove = (e: TouchEvent) => {
      if (!gameRef.current.isPlaying) return;
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const xRel = e.touches[0].clientX - rect.left;
        const pct = xRel / rect.width;
        gameRef.current.targetSnakeX = Math.max(30, Math.min(270, pct * 300));
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Loop logic
    const gameLoop = () => {
      const state = gameRef.current;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      // Interpolate Snake Position smoothly (feels ultra fluid)
      state.snakeX += (state.targetSnakeX - state.snakeX) * 0.15;

      // Update state triggers inside runner
      if (state.isPlaying) {
        // Cameras follow snake head
        state.cameraY += state.speed;

        // Progress calc
        const currProgress = Math.min(100, Math.round((state.cameraY / state.roadLength) * 100));
        setRunProgress(currProgress);

        // Slow down slightly near boss
        if (state.cameraY > state.roadLength - 100 && !state.bossActive) {
          state.bossActive = true;
          playSound("explosion");
        }

        // Handle item timers (magnet)
        if (state.magnetTimerActive > 0) {
          state.magnetTimerActive -= 1 / 60;
          setMagnetTimer(Math.max(0, Math.round(state.magnetTimerActive)));
          if (state.magnetTimerActive <= 0) {
            setActiveMagnet(false);
          }
        }

        // Logic gates collisions
        const snakeHeadY = state.cameraY + (h - 180); // Y pos of head on road
        const headLane = Math.round((state.snakeX - 50) / 100); // 0, 1, 2

        state.gates.forEach((gate) => {
          if (!gate.passed && Math.abs(gate.y - snakeHeadY) < 40) {
            // Check lane match
            if (gate.lane === headLane) {
              gate.passed = true;
              let previousScore = state.snakeScore;
              let nextScore = previousScore;

              if (gate.type === "add") {
                nextScore += gate.value;
                playSound("gate-good");
              } else if (gate.type === "mult") {
                nextScore *= gate.value;
                playSound("gate-good");
              } else if (gate.type === "sub" || gate.type === "div") {
                // Shield can save
                if (state.shieldActive) {
                  state.shieldActive = false;
                  setActiveShield(false);
                  playSound("shield");
                  // Trigger golden shield explosion particles
                  for (let i = 0; i < 15; i++) {
                    state.particles.push({
                      id: `${Date.now()}-${Math.random()}`,
                      x: state.snakeX,
                      y: h - 180,
                      vx: (Math.random() - 0.5) * 8,
                      vy: (Math.random() - 0.5) * 8,
                      color: "#FBBF24",
                      size: Math.random() * 6 + 4,
                      alpha: 1,
                    });
                  }
                } else {
                  if (gate.type === "sub") {
                    nextScore -= gate.value;
                  } else {
                    nextScore = Math.floor(nextScore / gate.value);
                  }
                  playSound("gate-bad");
                }
              }

              // Trigger score update particles
              const diff = nextScore - previousScore;
              if (diff !== 0) {
                // Notify parent score grew to trace daily achievements
                if (diff > 0) onScoreGrow(diff);

                // Flying numbers text particle
                state.particles.push({
                  id: `${Date.now()}-${Math.random()}`,
                  x: state.snakeX,
                  y: h - 210,
                  vx: (Math.random() - 0.5) * 3,
                  vy: -4,
                  color: diff > 0 ? "#10B981" : "#EF4444",
                  size: 20,
                  alpha: 1,
                  val: diff > 0 ? `+${diff}` : `${diff}`,
                });
              }

              // Guard score
              if (nextScore <= 0) {
                nextScore = 0;
                // Dead
                state.isPlaying = false;
                setIsPlaying(false);
                setIsGameOver(true);
                onLose(state.peakScore);
              }
              state.snakeScore = nextScore;
              state.peakScore = Math.max(state.peakScore, nextScore);
              setSnakeScore(nextScore);
            }
          }
        });

        // Collect Gold Coins collisions
        state.coins.forEach((coin) => {
          if (!coin.collected) {
            let matches = false;
            const coinX = coin.lane * 100 + 50;
            const coinYCanvas = coin.y - state.cameraY;

            // Magnet extends pickup range!
            if (state.magnetTimerActive > 0) {
              const dx = coinX - state.snakeX;
              const dy = coinYCanvas - (h - 180);
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 180) {
                // Fly towards snake head!
                coin.y -= (coin.y - (state.cameraY + (h - 180))) * 0.15;
                if (dist < 30) matches = true;
              }
            } else {
              // Direct lane check
              if (coin.lane === headLane && Math.abs(coin.y - snakeHeadY) < 35) {
                matches = true;
              }
            }

            if (matches) {
              coin.collected = true;
              // Skin Gold multiplier slot check
              const multiplier = stats.gearRingLevel > 0 ? (1 + stats.gearRingLevel * 0.15) : 1;
              const coinsEarned = Math.round(coin.value * multiplier);
              state.goldCollected += coinsEarned;
              setRunGoldCollected(state.goldCollected);
              playSound("coin");

              // Spawn tiny sparkling coins
              state.particles.push({
                id: `${Date.now()}-${Math.random()}`,
                x: state.snakeX + (Math.random() - 0.5) * 15,
                y: h - 185,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: "#FBBF24", // Golden Yellow
                size: Math.random() * 5 + 3,
                alpha: 1,
              });
            }
          }
        });

        // Power-ups pickup triggers
        state.powerups.forEach((pu) => {
          if (!pu.collected && Math.abs(pu.y - snakeHeadY) < 35) {
            if (pu.lane === headLane) {
              pu.collected = true;
              if (pu.type === "shield") {
                state.shieldActive = true;
                setActiveShield(true);
                playSound("shield");

                // Trigger Shield particle glow
                for (let i = 0; i < 10; i++) {
                  state.particles.push({
                    id: `${Date.now()}-${Math.random()}`,
                    x: state.snakeX,
                    y: h - 180,
                    vx: Math.cos(i) * 5,
                    vy: Math.sin(i) * 5,
                    color: "#3B82F6",
                    size: 6,
                    alpha: 1,
                  });
                }
              } else if (pu.type === "magnet") {
                state.magnetTimerActive = 10; // active for 10s
                setActiveMagnet(true);
                setMagnetTimer(10);
                playSound("shield");
              } else if (pu.type === "gem") {
                state.gemsCollected += 1;
                setRunGemsCollected(state.gemsCollected);
                playSound("gate-good");
                // Gems highlight particles
                state.particles.push({
                  id: `${Date.now()}-${Math.random()}`,
                  x: state.snakeX,
                  y: h - 180,
                  vx: (Math.random() - 0.5) * 4,
                  vy: -5,
                  color: "#9333EA",
                  size: 20,
                  alpha: 1,
                  val: "💎 +1",
                });
              }
            }
          }
        });

        // Giant Boss Fight Interaction!
        if (state.bossActive && state.bossHp > 0) {
          // Snake head continuously attacks boss
          const distToBoss = state.bossY - snakeHeadY;
          if (distToBoss < 130) {
            // Smash and tick!
            playSound("hit");
            const tickPower = Math.ceil(state.snakeScore * 0.1) || 1;
            state.bossHp = Math.max(0, state.bossHp - tickPower);
            state.snakeScore = Math.max(0, state.snakeScore - tickPower);
            setSnakeScore(state.snakeScore);

            // Shaker screens simulation
            ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);

            // Red damage particles flowing representing core collision
            for (let i = 0; i < 5; i++) {
              state.particles.push({
                id: `${Date.now()}-${Math.random()}`,
                x: 150 + (Math.random() - 0.5) * 45,
                y: state.bossY - state.cameraY,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: "#EF4444",
                size: Math.random() * 8 + 4,
                alpha: 1,
              });
            }

            // Damage tags
            state.particles.push({
              id: `${Date.now()}-${Math.random()}`,
              x: 150,
              y: state.bossY - state.cameraY - 40,
              vx: (Math.random() - 0.5) * 3,
              vy: -3,
              color: "#EF4444",
              size: 24,
              alpha: 1,
              val: `-${tickPower}`,
            });

            if (state.snakeScore <= 0) {
              // Failed to beat boss before dying
              state.isPlaying = false;
              setIsPlaying(false);
              setIsGameOver(true);
              onLose(state.peakScore);
            }

            if (state.bossHp <= 0) {
              // DEFEATED BOSS! GLORIOUS EXPLOSION OF TREASURES!
              state.bossHp = 0;
              state.speed = 0;
              playSound("explosion");

              // Spawn huge reward explosions
              let totalBonusGold = Math.round(50 + stats.currentStage * 25);
              state.goldCollected += totalBonusGold;
              setRunGoldCollected(state.goldCollected);

              for (let i = 0; i < 50; i++) {
                state.particles.push({
                  id: `${Date.now()}-${Math.random()}`,
                  x: 150,
                  y: state.bossY - state.cameraY,
                  vx: (Math.random() - 0.5) * 15,
                  vy: -Math.random() * 12 - 4,
                  color: Math.random() > 0.4 ? "#FBBF24" : "#EF4444",
                  size: Math.random() * 8 + 4,
                  alpha: 1,
                });
              }

              // Winning trigger
              setTimeout(() => {
                state.isPlaying = false;
                setIsPlaying(false);
                setIsWon(true);
                onWin(state.goldCollected, state.gemsCollected, state.snakeScore);
              }, 1800);
            }
          }
        }
      }

      // BACKGROUND & GRID DRAWING
      // Futuristic Space Dark Background
      ctx.fillStyle = "#090A15";
      ctx.fillRect(0, 0, w, h);

      // Glowing starry elements in the upper sky (only top 45% for a majestic atmosphere)
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      for (let star = 0; star < 15; star++) {
        const sx = ((star * 37) % w);
        const sy = ((star * 123 + Math.round(state.cameraY * 0.3)) % (h * 0.45));
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Perspective projection helper function
      const project = (worldX: number, worldY: number) => {
        // worldX ranges from 0 to 300 (lane virtual coordinates)
        // worldY is the absolute coordinate along the road (from 0 to state.roadLength)
        const headWorldY = state.cameraY + (h - 180); // Y position of the snake head in world coordinates
        const depth = worldY - headWorldY; // positive is ahead of head, negative is behind

        // Perspective factor (Z)
        // At depth = 0 (snake head), z is 1
        // At depth = 800 (far horizon), z is e.g. 4
        // At depth = -150 (behind player), z is e.g. 0.5
        const z = Math.max(0.12, (depth / 260) + 1);
        const scale = 1 / z;

        const horizonY = h * 0.28; // vanishing point height
        const bottomY = h - 60; // base of the road, close to the screen
        const centerX = w / 2;
        const roadWidthBottom = Math.min(w - 40, 480);

        // Normalize worldX to -1 to 1 based on center 150
        const norX = (worldX - 150) / 150;

        const screenY = horizonY + (bottomY - horizonY) * scale;
        const screenX = centerX + (norX * (roadWidthBottom / 2) * scale);

        return { x: screenX, y: screenY, scale };
      };

      // Snake head projection coordinates computed once for this frame
      const headWorldY = state.cameraY + (h - 180);
      const headProj = project(state.snakeX, headWorldY);

      // 3D Perspective Road Bed Trapezoid
      const roadBL = project(0, state.cameraY - 100);
      const roadBR = project(300, state.cameraY - 100);
      const roadTL = project(0, state.cameraY + 1200);
      const roadTR = project(300, state.cameraY + 1200);

      // Draw dark semi-transparent road payment
      ctx.fillStyle = "rgba(10, 11, 26, 0.9)";
      ctx.beginPath();
      ctx.moveTo(roadBL.x, roadBL.y);
      ctx.lineTo(roadTL.x, roadTL.y);
      ctx.lineTo(roadTR.x, roadTR.y);
      ctx.lineTo(roadBR.x, roadBR.y);
      ctx.closePath();
      ctx.fill();

      // Outer safety wall borders (Neon glowing lines on left and right track boundaries!)
      ctx.strokeStyle = "rgba(239, 68, 68, 0.6)"; // Glowing Red
      ctx.lineWidth = 4;
      ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
      ctx.shadowBlur = 12;
      
      // Left border line
      ctx.beginPath();
      ctx.moveTo(roadBL.x, roadBL.y);
      ctx.lineTo(roadTL.x, roadTL.y);
      ctx.stroke();

      // Right border line
      ctx.beginPath();
      ctx.moveTo(roadBR.x, roadBR.y);
      ctx.lineTo(roadTR.x, roadTR.y);
      ctx.stroke();
      
      ctx.shadowBlur = 0; // Turn off shadow blur for inside elements

      // Inner lane dividers converging to the horizon in 3D
      ctx.strokeStyle = "rgba(147, 51, 234, 0.45)"; // Sleek Neon Purple
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 2; i++) {
        const laneX = i * 100;
        ctx.beginPath();
        let first = true;
        for (let d = -100; d <= 1200; d += 100) {
          const p = project(laneX, state.cameraY + (h - 180) + d);
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }

      // Horizontal speed markers (Scrolling 3D grid speed lines for a magnificent sense of depth and speed!)
      ctx.strokeStyle = "rgba(59, 130, 246, 0.25)"; // Glowing Neon Blue
      ctx.lineWidth = 1;
      const startGridY = Math.floor((state.cameraY - 100) / 80) * 80;
      for (let gridY = startGridY; gridY < state.cameraY + 1200; gridY += 80) {
        const pLeft = project(0, gridY);
        const pRight = project(300, gridY);
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.stroke();
      }

      // DRAW POWER-UPS & COINS ON Track
      // Coins
      state.coins.forEach((coin) => {
        if (!coin.collected) {
          const p = project(coin.lane * 100 + 50, coin.y);
          if (p.y > h * 0.2 && p.y < h + 50) {
            const size = 10 * p.scale;
            // Rotating golden circle coin
            ctx.shadowColor = "#FBBF24";
            ctx.shadowBlur = 10 * p.scale;
            ctx.fillStyle = "#FBBF24";
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Inner styling
            ctx.fillStyle = "#F59E0B";
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#FFF";
            ctx.font = `bold ${Math.round(9 * p.scale)}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("$", p.x, p.y);
          }
        }
      });

      // Special items
      state.powerups.forEach((pu) => {
        if (!pu.collected) {
          const p = project(pu.lane * 100 + 50, pu.y);
          if (p.y > h * 0.2 && p.y < h + 50) {
            if (pu.type === "shield") {
              // Glowing shield symbol
              ctx.shadowColor = "#3B82F6";
              ctx.shadowBlur = 12 * p.scale;
              ctx.fillStyle = "#1D4ED8";
              ctx.beginPath();
              ctx.arc(p.x, p.y, 14 * p.scale, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#60A5FA";
              ctx.font = `${Math.round(12 * p.scale)}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("🛡️", p.x, p.y);
            } else if (pu.type === "magnet") {
              // Magnet symbol
              ctx.shadowColor = "#EF4444";
              ctx.shadowBlur = 12 * p.scale;
              ctx.fillStyle = "#B91C1C";
              ctx.beginPath();
              ctx.arc(p.x, p.y, 14 * p.scale, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#FFF";
              ctx.font = `${Math.round(12 * p.scale)}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("🧲", p.x, p.y);
            } else if (pu.type === "gem") {
              // Violet Gem
              ctx.shadowColor = "#A855F7";
              ctx.shadowBlur = 15 * p.scale;
              ctx.fillStyle = "#7E22CE";
              ctx.beginPath();
              ctx.arc(p.x, p.y, 13 * p.scale, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#FFF";
              ctx.font = `${Math.round(12 * p.scale)}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("💎", p.x, p.y);
            }
            ctx.shadowBlur = 0;
          }
        }
      });

      // DRAW LOGIC GATES
      state.gates.forEach((gate) => {
        if (!gate.passed) {
          const p = project(gate.lane * 100 + 50, gate.y);
          if (p.y > h * 0.2 && p.y < h + 200) {
            const isGood = gate.type === "add" || gate.type === "mult";
            const gateWidth = (100 - 12) * p.scale;
            const gateHeight = 50 * p.scale;

            // Gate glass card backing with extreme neon styling
            ctx.shadowBlur = 15 * p.scale;
            ctx.shadowColor = isGood ? "#10B981" : "#EF4444";
            ctx.fillStyle = isGood ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.25)";
            ctx.strokeStyle = isGood ? "#10B981" : "#EF4444";
            ctx.lineWidth = Math.max(1, 3 * p.scale);

            // Rounded rectangle gate border
            ctx.beginPath();
            ctx.roundRect(p.x - gateWidth / 2, p.y - gateHeight / 2, gateWidth, gateHeight, Math.max(1, 10 * p.scale));
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Operator notation
            const symbol = gate.type === "add" ? `+${gate.value}` :
                           gate.type === "sub" ? `-${gate.value}` :
                           gate.type === "mult" ? `x${gate.value}` : `÷${gate.value}`;

            ctx.fillStyle = "#FFFFFF";
            ctx.font = `bold ${Math.round(22 * p.scale)}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(symbol, p.x, p.y);
          }
        }
      });

      // DRAW GIANT DRAGON BOSS
      if (state.bossActive) {
        const p = project(150, state.bossY);
        if (p.y > -200 && p.y < h + 200) {
          const size = 120 * p.scale;

          // Giant crown and dragon avatar
          ctx.shadowBlur = 24 * p.scale;
          ctx.shadowColor = "#F59E0B";

          // Core Boss Block body outer glow
          ctx.fillStyle = "rgba(220, 38, 38, 1)";
          ctx.beginPath();
          ctx.roundRect(p.x - size / 2, p.y - size / 2, size, size, Math.max(2, 15 * p.scale));
          ctx.fill();
          ctx.strokeStyle = "#F59E0B"; // Gold fire borders
          ctx.lineWidth = Math.max(1, 4 * p.scale);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Cute Monster face
          ctx.fillStyle = "#FFF";
          ctx.font = `${Math.round(16 * p.scale)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("👑", p.x, p.y - size * 0.35);

          ctx.fillStyle = "#FFF";
          ctx.font = `bold ${Math.round(45 * p.scale)}px Space Grotesk, sans-serif`;
          ctx.fillText("🦖", p.x, p.y + size * 0.08);

          // Health shield bar label
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(p.x - 45 * p.scale, p.y + 40 * p.scale, 90 * p.scale, 15 * p.scale);
          
          ctx.fillStyle = "#10B981";
          const pctHealth = Math.max(0, state.bossHp / state.maxBossHp);
          ctx.fillRect(p.x - 45 * p.scale, p.y + 40 * p.scale, 90 * p.scale * pctHealth, 15 * p.scale);

          ctx.fillStyle = "#FFF";
          ctx.font = `bold ${Math.round(11 * p.scale)}px Inter, sans-serif`;
          ctx.fillText(`HP: ${state.bossHp}`, p.x, p.y + 47 * p.scale);
        }
      }

      // DRAW THE Numeric GLOWING SNAKE (the star of the game)
      // Drawn as a sequence of segmented circles linked together
      const baseDiameter = 28;
      const segmentsCount = Math.min(35, Math.ceil(state.snakeScore * 0.25) + 3);

      ctx.lineWidth = 1;
      for (let s = segmentsCount - 1; s >= 0; s--) {
        const segmentPct = s / segmentsCount;
        
        // Snake tail nodes sway like wave motion
        const sway = Math.sin(state.cameraY * 0.08 + s * 0.4) * 8 * (segmentPct);
        
        // Project segment in 3D (s = 0 is head at bottom, s > 0 stretching deeper into horizon)
        const pSeg = project(state.snakeX + sway, headWorldY + s * 14);
        const radius = Math.max(3, baseDiameter * 0.5 * (1 - segmentPct * 0.4) * pSeg.scale);

        ctx.shadowColor = selectedSkinColor;
        ctx.shadowBlur = s === 0 ? 20 * pSeg.scale : 6 * pSeg.scale;
        ctx.fillStyle = selectedSkinColor;

        ctx.beginPath();
        ctx.arc(pSeg.x, pSeg.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Custom detailing decoration for tail
        if (s % 3 === 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.beginPath();
          ctx.arc(pSeg.x - 1.5 * pSeg.scale, pSeg.y - 1.5 * pSeg.scale, radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw the Head Crown / emoji
      ctx.fillStyle = "#FFF";
      ctx.font = `${Math.round(14 * headProj.scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(selectedSkinIcon, headProj.x, headProj.y - 14 * headProj.scale);

      // Main active big score number bubble above head
      ctx.shadowColor = "#FFF";
      ctx.shadowBlur = 10 * headProj.scale;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(headProj.x, headProj.y - 32 * headProj.scale, 16 * headProj.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#0F172A";
      ctx.font = `bold ${Math.round(13 * headProj.scale)}px Inter, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(`${state.snakeScore}`, headProj.x, headProj.y - 31 * headProj.scale);

      // Active Items shield bubble encircling head
      if (state.shieldActive) {
        ctx.strokeStyle = "#3B82F6";
        ctx.lineWidth = Math.max(1.5, 3 * headProj.scale);
        ctx.shadowColor = "#60A5FA";
        ctx.shadowBlur = 15 * headProj.scale;
        ctx.beginPath();
        ctx.arc(headProj.x, headProj.y, 26 * headProj.scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Magnet particle swirls
      if (state.magnetTimerActive > 0) {
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = Math.max(1, 1.5 * headProj.scale);
        ctx.beginPath();
        ctx.arc(headProj.x, headProj.y, (32 + Math.sin(state.cameraY * 0.1) * 4) * headProj.scale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // DRAW PARTICLES & IMPACT TEXT TAGS
      state.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;

        if (p.alpha <= 0) {
          state.particles.splice(idx, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          if (p.val) {
            // Drawn as flying text damage/addition label
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = p.color;
            ctx.font = `bold ${p.size}px Space Grotesk, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText(p.val, p.x, p.y);
          } else {
            // Regular kinetic chunk particle
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      });

      // Finish boundary line
      if (state.cameraY > state.roadLength - 1200) {
        const pLeft = project(0, state.roadLength);
        const pRight = project(300, state.roadLength);

        ctx.shadowColor = "#EAB308";
        ctx.shadowBlur = 20 * pLeft.scale;
        ctx.strokeStyle = "#EAB308";
        ctx.lineWidth = Math.max(2, 8 * pLeft.scale);
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#E4E4E7";
        ctx.font = `bold ${Math.round(13 * pLeft.scale)}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("🏁 FINISH - BOSS ALIVE 🏁", (pLeft.x + pRight.x) / 2, pLeft.y - 15 * pLeft.scale);
      }

      // Direct instructions Overlay inside gameplay if wait trigger
      if (!state.isPlaying && !isGameOver && !isWon) {
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.font = "bold 24px Space Grotesk, sans-serif";
        ctx.fillText("SWIPE OR DRAG", w / 2, h / 2 - 20);
        ctx.font = "14px Inter, sans-serif";
        ctx.fillStyle = "#9333EA";
        ctx.fillText("Avoid Red Doors 🛑 Get Green x Gates 💚", w / 2, h / 2 + 10);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isPlaying, isGameOver, isWon, stats, selectedSkinColor, selectedSkinIcon]);

  const handleStartRun = () => {
    playSound("gate-good");
    setIsPlaying(true);
    gameRef.current.isPlaying = true;
    // Notify parents or lock action
  };

  const handleRetryRun = () => {
    initLevel();
    setIsPlaying(true);
    gameRef.current.isPlaying = true;
  };

  return (
    <div className="relative w-full h-[580px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20" ref={containerRef}>
      {/* Target Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full cursor-pointer z-10" id="snakeRunnerCanvas" />

      {/* Top Hud Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between pointer-events-none">
        {/* Left indicators */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-yellow-500/30 px-3 py-1.5 rounded-full text-xs text-yellow-400 font-bold">
            <span className="text-yellow-500 font-sans">$</span>
            <span>{runGoldCollected}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-purple-500/30 px-3 py-1.5 rounded-full text-xs text-purple-300 font-bold">
            <span>💎</span>
            <span>{runGemsCollected}</span>
          </div>
        </div>

        {/* Right active timers */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="bg-black/60 backdrop-blur-md border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs text-emerald-400 font-black tracking-tight">
            STAGE {stats.currentStage}
          </div>
          <div className="flex gap-1">
            {activeShield && (
              <div className="bg-blue-600 border border-blue-400 p-1 rounded-full animate-pulse">
                <Shield className="w-4 h-4 text-white" />
              </div>
            )}
            {activeMagnet && (
              <div className="bg-red-600 border border-red-400 px-2 py-0.5 rounded-full text-[10px] text-white flex items-center gap-1">
                <Zap className="w-3 h-3 animate-bounce" /> Mag {magnetTimer}s
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic progress bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
        <div className="w-full bg-slate-800/80 backdrop-blur-md h-3.5 rounded-full border border-purple-500/20 overflow-hidden relative">
          <div className="bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 h-full rounded-full transition-all duration-100" style={{ width: `${runProgress}%` }} />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider select-none">
            {runProgress === 100 ? "BOSS FIGHT!" : `Crawl Progress: ${runProgress}%`}
          </span>
        </div>
      </div>

      {/* Tap Start Splash Screen */}
      {!isPlaying && !isGameOver && !isWon && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center mb-6 animate-bounce">
            <span className="text-5xl">{selectedSkinIcon}</span>
          </div>
          <h3 className="text-3xl font-black text-white font-sans tracking-tight mb-2 uppercase">
            Ready to Slither?
          </h3>
          <p className="text-slate-400 text-sm max-w-xs mb-6">
            Stage {stats.currentStage} has negative doors and obstacle blocks. Beat the Boss at the end for massive rewards!
          </p>

          <button
            onClick={handleStartRun}
            className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-lg rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-3 active:scale-95 transition-all outline-none"
            id="btnStartStage"
          >
            <Play className="w-6 h-6 fill-slate-950" /> START STAGE
          </button>
        </div>
      )}

      {/* Won Overlay Screen */}
      {isWon && (
        <div className="absolute inset-0 bg-emerald-950/95 z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-500 flex items-center justify-center mb-4 shadow-xl shadow-yellow-500/30">
            <Award className="w-10 h-10 text-emerald-950" />
          </div>
          <h3 className="text-4xl font-black text-yellow-400 tracking-tight font-sans mb-1 uppercase">
            VICTORY!
          </h3>
          <p className="text-emerald-200 text-sm mb-6">
            You successfully crushed the Dragon Boss and collected all level earnings!
          </p>

          <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-8">
            <div className="bg-emerald-900/50 border border-emerald-500/30 rounded-xl p-3">
              <span className="text-xs text-emerald-300 block">Gold Earned</span>
              <span className="text-xl font-extrabold text-yellow-400 font-mono">${runGoldCollected}</span>
            </div>
            <div className="bg-emerald-900/50 border border-emerald-500/30 rounded-xl p-3">
              <span className="text-xs text-emerald-300 block">Gems Found</span>
              <span className="text-xl font-extrabold text-purple-300 font-mono">💎 {runGemsCollected}</span>
            </div>
            <div className="bg-emerald-900/50 border border-emerald-500/30 rounded-xl p-3">
              <span className="text-xs text-emerald-300 block">End Score</span>
              <span className="text-xl font-extrabold text-[#10B981] font-mono">{snakeScore}</span>
            </div>
          </div>

          <div className="animate-pulse text-xs font-semibold text-yellow-300 uppercase tracking-widest mb-4">
            🔥 TikTok viral dopamine hit unlocked!
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="absolute inset-0 bg-rose-950/95 z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-rose-900 border border-rose-500 flex items-center justify-center mb-4">
            <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
          </div>
          <h3 className="text-4xl font-black text-rose-500 tracking-tight mb-2 uppercase">
            DEFEATED
          </h3>
          <p className="text-rose-300 text-sm max-w-xs mb-6">
            Your snake's score dropped to zero! Upgrade your gear and try again.
          </p>

          <div className="bg-slate-900/60 border border-rose-500/20 rounded-xl py-3 px-6 mb-8 flex justify-around gap-6">
            <div>
              <span className="text-xs text-rose-200 block text-left">Level Gold Keep</span>
              <span className="text-lg font-black text-yellow-400 font-mono text-left block">${runGoldCollected}</span>
            </div>
            <div>
              <span className="text-xs text-rose-200 block text-left">Loot Saved</span>
              <span className="text-lg font-black text-purple-300 font-mono text-left block">💎 {runGemsCollected}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleRetryRun}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 active:scale-95 transition-all outline-none"
              id="btnGameOverRetry"
            >
              <RotateCcw className="w-5 h-5" /> TRY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
