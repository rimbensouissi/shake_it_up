// Pure game physics: no React, no sensors, no rendering. The game screen feeds it
// a tilt vector every frame and reads the ball / basket state back.
//
// Coordinates are in board pixels, origin at the top-left, y pointing down.

export const BALL_R = 15;
export const BASKET_R = 34;
export const BUMPER_R = 18;
export const WALL = 4;
export const BASKET_POINTS = 10;
export const MAX_BUMPERS = 3;
export const BASKETS_PER_BUMPER = 3;
export const TRAIL_COUNT = 6;

const ACCEL_BASE = 2400; // px/s² produced by 1 g of tilt at sensitivity multiplier 1
const DAMPING = 2.2; // rolling friction (1/s)
const MAX_SPEED = 1000; // px/s
const WALL_REST = 0.45; // energy kept after hitting a wall
const BUMPER_REST = 0.85;
const CAPTURE_SPEED = 460; // faster than this and the ball skips over the basket
const DEADZONE = 0.03; // g
const MAX_TILT = 0.8; // g
const MIN_START_DIST = 150; // new ball spawns at least this far from the basket
const SINK_TIME = 0.28; // s
const POP_TIME = 0.28; // s

export const sensitivityMultiplier = (sensitivity) => 0.6 + (sensitivity - 1) * 0.2;

const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function shapeTilt(v) {
  const a = Math.abs(v);
  if (a < DEADZONE) return 0;
  return Math.sign(v) * Math.min(a - DEADZONE, MAX_TILT);
}

// Picks a random point that keeps `d` pixels away from every constraint {x, y, d}.
// If no point satisfies all of them it returns the least bad candidate.
function randomPoint(sim, margin, constraints) {
  let best = { x: sim.w / 2, y: sim.h / 2 };
  let bestSlack = -Infinity;
  const spanX = Math.max(0, sim.w - 2 * margin);
  const spanY = Math.max(0, sim.h - 2 * margin);
  for (let i = 0; i < 60; i += 1) {
    const x = margin + sim.rng() * spanX;
    const y = margin + sim.rng() * spanY;
    let slack = Infinity;
    for (const c of constraints) {
      slack = Math.min(slack, Math.hypot(x - c.x, y - c.y) - c.d);
    }
    if (slack >= 0) return { x, y };
    if (slack > bestSlack) {
      bestSlack = slack;
      best = { x, y };
    }
  }
  return best;
}

// Places a new basket, a fresh ball and (as the score grows) extra bumpers.
// Returns true when a bumper was added.
export function placeRound(sim) {
  const bumperZones = sim.obstacles.map((o) => ({ x: o.x, y: o.y, d: o.r + BASKET_R + 10 }));
  const basket = randomPoint(sim, BASKET_R + WALL + 14, bumperZones);
  sim.basket = basket;

  const ballZones = [
    { x: basket.x, y: basket.y, d: MIN_START_DIST },
    ...sim.obstacles.map((o) => ({ x: o.x, y: o.y, d: o.r + BALL_R + 14 })),
  ];
  const ball = randomPoint(sim, BALL_R + WALL + 10, ballZones);
  sim.x = ball.x;
  sim.y = ball.y;
  sim.vx = 0;
  sim.vy = 0;

  const wanted = Math.min(MAX_BUMPERS, Math.floor(sim.baskets / BASKETS_PER_BUMPER));
  let added = false;
  while (sim.obstacles.length < wanted) {
    const zones = [
      { x: basket.x, y: basket.y, d: BASKET_R + BUMPER_R + 36 },
      { x: ball.x, y: ball.y, d: BALL_R + BUMPER_R + 50 },
      ...sim.obstacles.map((o) => ({ x: o.x, y: o.y, d: o.r + BUMPER_R + 30 })),
    ];
    const p = randomPoint(sim, BUMPER_R + WALL + 12, zones);
    sim.obstacles.push({ id: `bumper-${sim.obstacles.length}`, x: p.x, y: p.y, r: BUMPER_R });
    added = true;
  }
  return added;
}

export function createSim(width, height, rng = Math.random) {
  const sim = {
    w: width,
    h: height,
    rng,
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    basket: { x: 0, y: 0 },
    obstacles: [],
    baskets: 0,
    score: 0,
    sink: null,
    pop: 0, // 0..1 entrance animation of ball + basket
    ballScale: 0,
    basketScale: 0,
    trail: new Array(TRAIL_COUNT * 2).fill(0),
  };
  placeRound(sim);
  resetTrail(sim);
  return sim;
}

export function resetTrail(sim) {
  for (let i = 0; i < TRAIL_COUNT; i += 1) {
    sim.trail[i * 2] = sim.x;
    sim.trail[i * 2 + 1] = sim.y;
  }
}

export function pushTrail(sim) {
  for (let i = TRAIL_COUNT * 2 - 1; i >= 2; i -= 1) {
    sim.trail[i] = sim.trail[i - 2];
  }
  sim.trail[0] = sim.x;
  sim.trail[1] = sim.y;
}

/**
 * One physics step while the ball is rolling.
 * tilt: { x, y } in g, already expressed in screen directions (+x right, +y down).
 * Returns { impact, captured } where impact is the strongest collision speed (px/s).
 */
export function stepSim(sim, dt, tilt, sensitivity) {
  const out = { impact: 0, captured: false };
  const k = ACCEL_BASE * sensitivityMultiplier(sensitivity);
  let ax = shapeTilt(tilt.x) * k;
  let ay = shapeTilt(tilt.y) * k;

  // Gentle pull towards the basket when the ball is close, plus extra friction
  // right above it so a careful player can settle the ball inside.
  const bx = sim.basket.x - sim.x;
  const by = sim.basket.y - sim.y;
  const bd = Math.hypot(bx, by);
  const pullRadius = BASKET_R * 1.6;
  let damping = DAMPING;
  if (bd < pullRadius && bd > 0.001) {
    const pull = (1 - bd / pullRadius) * 380;
    ax += (bx / bd) * pull;
    ay += (by / bd) * pull;
    if (bd < BASKET_R * 1.2) damping = 5;
  }

  sim.vx += ax * dt;
  sim.vy += ay * dt;
  const friction = Math.exp(-damping * dt);
  sim.vx *= friction;
  sim.vy *= friction;

  const speed = Math.hypot(sim.vx, sim.vy);
  if (speed > MAX_SPEED) {
    sim.vx *= MAX_SPEED / speed;
    sim.vy *= MAX_SPEED / speed;
  }

  sim.x += sim.vx * dt;
  sim.y += sim.vy * dt;

  // Walls
  const minX = BALL_R + WALL;
  const maxX = sim.w - BALL_R - WALL;
  const minY = BALL_R + WALL;
  const maxY = sim.h - BALL_R - WALL;
  if (sim.x < minX) {
    sim.x = minX;
    if (sim.vx < 0) {
      out.impact = Math.max(out.impact, -sim.vx);
      sim.vx = -sim.vx * WALL_REST;
    }
  } else if (sim.x > maxX) {
    sim.x = maxX;
    if (sim.vx > 0) {
      out.impact = Math.max(out.impact, sim.vx);
      sim.vx = -sim.vx * WALL_REST;
    }
  }
  if (sim.y < minY) {
    sim.y = minY;
    if (sim.vy < 0) {
      out.impact = Math.max(out.impact, -sim.vy);
      sim.vy = -sim.vy * WALL_REST;
    }
  } else if (sim.y > maxY) {
    sim.y = maxY;
    if (sim.vy > 0) {
      out.impact = Math.max(out.impact, sim.vy);
      sim.vy = -sim.vy * WALL_REST;
    }
  }

  // Bumpers (circle vs circle)
  for (const o of sim.obstacles) {
    const ox = sim.x - o.x;
    const oy = sim.y - o.y;
    const dist = Math.hypot(ox, oy);
    const minDist = BALL_R + o.r;
    if (dist < minDist && dist > 0.0001) {
      const nx = ox / dist;
      const ny = oy / dist;
      sim.x = o.x + nx * minDist;
      sim.y = o.y + ny * minDist;
      const vn = sim.vx * nx + sim.vy * ny;
      if (vn < 0) {
        out.impact = Math.max(out.impact, -vn);
        sim.vx -= (1 + BUMPER_REST) * vn * nx;
        sim.vy -= (1 + BUMPER_REST) * vn * ny;
      }
    }
  }

  // Basket: the ball must be over the hole and not rushing past it.
  const dBasket = Math.hypot(sim.basket.x - sim.x, sim.basket.y - sim.y);
  if (dBasket < BASKET_R - 10 && Math.hypot(sim.vx, sim.vy) < CAPTURE_SPEED) {
    sim.score += BASKET_POINTS;
    sim.baskets += 1;
    sim.sink = { t: 0, fromX: sim.x, fromY: sim.y };
    out.captured = true;
  }

  return out;
}

/**
 * Animates the ball dropping into the basket. When it finishes, a new round is
 * placed. Returns { done, newBumper }.
 */
export function stepSink(sim, dt) {
  const s = sim.sink;
  s.t += dt;
  const p = Math.min(1, s.t / SINK_TIME);
  const e = p * p;
  sim.x = s.fromX + (sim.basket.x - s.fromX) * e;
  sim.y = s.fromY + (sim.basket.y - s.fromY) * e;
  sim.ballScale = 1 - 0.85 * e;
  sim.basketScale = 1 + 0.18 * Math.sin(p * Math.PI);

  const result = { done: false, newBumper: false };
  if (p >= 1) {
    sim.sink = null;
    result.newBumper = placeRound(sim);
    resetTrail(sim);
    sim.pop = 0;
    sim.ballScale = 0;
    sim.basketScale = 0;
    result.done = true;
  }
  return result;
}

// Entrance animation of a fresh ball + basket (also used at the start of a game).
export function stepPop(sim, dt) {
  if (sim.pop >= 1) {
    sim.ballScale = 1;
    sim.basketScale = 1;
    return;
  }
  sim.pop = Math.min(1, sim.pop + dt / POP_TIME);
  const e = Math.max(0, easeOutBack(sim.pop));
  sim.ballScale = e;
  sim.basketScale = e;
}
