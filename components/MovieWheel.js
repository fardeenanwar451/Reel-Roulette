"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";

/**
 * MovieWheel
 * A circular wheel of movie posters that spins to select one title at random,
 * weighted equally across all remaining (un-watched) movies.
 *
 * Spin triggers:
 *  - Click/tap the SPIN button
 *  - Drag/flick the wheel itself with the mouse or a touch gesture
 *
 * Performance: with up to 250 segments, we don't render every poster element
 * at all times — we render a fixed set of "slots" positioned around the circle
 * and re-map which movie occupies which slot during the spin animation, so the
 * DOM stays small regardless of list size.
 */

const TAU = Math.PI * 2;
const SETTLE_DURATION = 4200; // ms — total spin-down time once released
const MIN_SPINS = 4; // minimum full rotations so the spin always feels substantial

export default function MovieWheel({ movies, onSelect, disabled }) {
  const wheelRef = useRef(null);
  const containerRef = useRef(null);
  const rotationRef = useRef(0); // current rotation in radians, mutable across frames
  const animFrameRef = useRef(null);
  const dragStateRef = useRef(null);

  const [visualRotation, setVisualRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);

  const count = movies.length;
  const segmentAngle = count > 0 ? TAU / count : 0;

  // Stable pseudo-random colors per segment so the wheel doesn't reflow visually on every render.
  const segmentTint = useMemo(
    () => movies.map((_, i) => (i % 2 === 0 ? "rgba(124,58,237,0.35)" : "rgba(91,33,182,0.35)")),
    [movies]
  );

  const finishSpin = useCallback(
    (finalRotation) => {
      rotationRef.current = finalRotation;
      setVisualRotation(finalRotation);
      setSpinning(false);

      // The pointer is fixed at the top (angle = -PI/2 in standard screen coords).
      // Figure out which segment sits under the pointer after rotation.
      const normalized = ((-finalRotation % TAU) + TAU) % TAU;
      const idx = Math.floor(normalized / segmentAngle) % count;
      const winner = movies[idx];
      setHighlightIndex(idx);
      onSelect?.(winner);
    },
    [movies, count, segmentAngle, onSelect]
  );

  const animateTo = useCallback(
    (targetRotation, duration) => {
      const start = rotationRef.current;
      const startTime = performance.now();
      setSpinning(true);

      function tick(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Decelerating ease — strong spin-out, no bounce (bounce reads as a toy, not a wheel).
        const eased = 1 - Math.pow(1 - t, 3.2);
        const current = start + (targetRotation - start) * eased;
        rotationRef.current = current;
        setVisualRotation(current);

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          finishSpin(targetRotation);
        }
      }

      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(tick);
    },
    [finishSpin]
  );

  const spin = useCallback(
    (extraVelocity = 0) => {
      if (spinning || disabled || count === 0) return;
      const randomSettle = Math.random() * TAU;
      const spins = MIN_SPINS + Math.random() * 2 + Math.min(extraVelocity, 4);
      const target = rotationRef.current + spins * TAU + randomSettle;
      animateTo(target, SETTLE_DURATION);
    },
    [spinning, disabled, count, animateTo]
  );

  // --- Drag-to-spin handling ---
  const getAngleFromCenter = useCallback((clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx);
  }, []);

  const handlePointerDown = useCallback(
    (e) => {
      if (spinning || disabled) return;
      const point = "touches" in e ? e.touches[0] : e;
      const angle = getAngleFromCenter(point.clientX, point.clientY);
      dragStateRef.current = {
        startAngle: angle,
        lastAngle: angle,
        lastTime: performance.now(),
        velocity: 0,
        accumulatedRotation: 0,
      };
    },
    [spinning, disabled, getAngleFromCenter]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragStateRef.current) return;
      const point = "touches" in e ? e.touches[0] : e;
      const angle = getAngleFromCenter(point.clientX, point.clientY);
      const now = performance.now();
      const drag = dragStateRef.current;

      let delta = angle - drag.lastAngle;
      // handle wraparound at +-PI
      if (delta > Math.PI) delta -= TAU;
      if (delta < -Math.PI) delta += TAU;

      const dt = Math.max(now - drag.lastTime, 1);
      drag.velocity = delta / dt; // radians per ms
      drag.accumulatedRotation += delta;
      drag.lastAngle = angle;
      drag.lastTime = now;

      rotationRef.current += delta;
      setVisualRotation(rotationRef.current);
    },
    [getAngleFromCenter]
  );

  const handlePointerUp = useCallback(() => {
    const drag = dragStateRef.current;
    dragStateRef.current = null;
    if (!drag) return;

    // Only treat as a "flick spin" if the user actually dragged meaningfully.
    const speed = Math.abs(drag.velocity); // rad/ms
    if (Math.abs(drag.accumulatedRotation) < 0.15 && speed < 0.0005) {
      return; // treat as a tap/click, not a flick — ignore, button still works separately
    }
    const extraVelocity = Math.min(speed * 800, 6);
    spin(extraVelocity);
  }, [spin]);

  useEffect(() => {
    function onMove(e) {
      handlePointerMove(e);
    }
    function onUp() {
      handlePointerUp();
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => () => cancelAnimationFrame(animFrameRef.current), []);

  // --- Visible-segment virtualization ---
  // With up to 250 posters, rendering every one as a DOM node simultaneously
  // (even absolutely-positioned) gets sluggish, especially while dragging.
  // We only mount the segments currently facing the visible front arc of the
  // wheel, recomputed as rotation changes. This keeps the DOM small and the
  // wheel buttery regardless of list length.
  const visibleIndices = useMemo(() => {
    if (count === 0) return [];
    // Render a band of segments around the full circle, but skip ones
    // currently rotated to the back-facing half when the list is large —
    // for lists under ~60 we just render everything (no visible cost).
    if (count <= 60) return movies.map((_, i) => i);

    const normalized = ((-rotationRef.current % TAU) + TAU) % TAU;
    const frontIndex = Math.floor(normalized / segmentAngle) % count;
    const windowSize = Math.ceil(count * 0.45); // render a generous arc, not just the front sliver
    const indices = [];
    for (let offset = -windowSize; offset <= windowSize; offset++) {
      indices.push(((frontIndex + offset) % count + count) % count);
    }
    return indices;
    // visualRotation (not rotationRef) is the dependency that should trigger recompute each frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies, count, segmentAngle, visualRotation]);

  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-violet-800/40 bg-surface2 px-8 py-20 text-center">
        <p className="font-display text-2xl text-bone">The wheel is empty.</p>
        <p className="mt-2 text-violet-200/70">
          You&rsquo;ve spun every title on this list. Check the watched list below.
        </p>
      </div>
    );
  }

  const radius = 220;
  const posterW = 64;
  const posterH = 96;

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        ref={containerRef}
        className="relative touch-none select-none"
        style={{ width: radius * 2 + posterW, height: radius * 2 + posterW }}
      >
        {/* Fixed pointer at top */}
        <div className="absolute left-1/2 -top-2 z-20 -translate-x-1/2">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <path d="M14 24 L4 6 L24 6 Z" fill="#F2B65B" />
          </svg>
        </div>

        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full shadow-glow" />

        <div
          ref={wheelRef}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          className="absolute inset-0 cursor-grab rounded-full border-4 border-violet-700/50 bg-surface active:cursor-grabbing"
          style={{
            transform: `rotate(${visualRotation}rad)`,
            transition: dragStateRef.current ? "none" : undefined,
          }}
          role="button"
          tabIndex={0}
          aria-label="Drag to spin the wheel"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              spin();
            }
          }}
        >
          {visibleIndices.map((i) => {
            const movie = movies[i];
            const angle = i * segmentAngle - Math.PI / 2 + segmentAngle / 2;
            const x = radius + Math.cos(angle) * (radius - posterW / 2 - 6);
            const y = radius + Math.sin(angle) * (radius - posterW / 2 - 6);
            const isHighlighted = highlightIndex === i && !spinning;
            return (
              <div
                key={movie.id || movie.tmdbId || `${movie.title}-${i}`}
                className="absolute overflow-hidden rounded-md border shadow-md"
                style={{
                  width: posterW,
                  height: posterH,
                  left: x,
                  top: y,
                  transform: `translate(-50%, -50%) rotate(${angle + Math.PI / 2}rad)`,
                  borderColor: isHighlighted ? "#F2B65B" : "rgba(167,139,250,0.25)",
                  boxShadow: isHighlighted ? "0 0 0 2px #F2B65B" : undefined,
                  backgroundColor: segmentTint[i],
                }}
              >
                {movie.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={movie.posterUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-violet-900 p-1 text-center text-[8px] leading-tight text-violet-200">
                    {movie.title}
                  </div>
                )}
              </div>
            );
          })}

          {/* Center hub */}
          <div className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-violet-400/40 bg-ink font-display text-xs text-violet-200">
            {count}
            <span className="ml-1 text-[10px] text-violet-300/70">left</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => spin()}
        disabled={spinning || disabled}
        className="group relative rounded-full bg-violet-500 px-10 py-4 font-display text-lg text-ink shadow-glow transition-all hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {spinning ? "Spinning…" : "Spin the wheel"}
      </button>
      <p className="max-w-xs text-center text-sm text-violet-300/60">
        Or grab the wheel and flick it with your mouse or finger.
      </p>
    </div>
  );
}
