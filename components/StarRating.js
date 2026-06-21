"use client";

import { useState, useCallback } from "react";

/**
 * StarRating
 * Renders 5 stars supporting half-star precision (0, 0.5, 1, 1.5 ... 5),
 * filled in gold like Letterboxd's rating treatment. Clicking the left half
 * of a star sets a half-point, the right half sets a full point.
 */
export default function StarRating({ value, onChange, readOnly = false, size = 22 }) {
  const [hoverValue, setHoverValue] = useState(null);
  const displayValue = hoverValue ?? value ?? 0;

  const computeValueFromEvent = useCallback((e, starIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    return starIndex + (isLeftHalf ? 0.5 : 1);
  }, []);

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHoverValue(null)}
      role={readOnly ? undefined : "slider"}
      aria-label="Rating"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value ?? 0}
    >
      {[0, 1, 2, 3, 4].map((starIndex) => {
        const fillAmount = Math.max(0, Math.min(1, displayValue - starIndex));
        return (
          <button
            key={starIndex}
            type="button"
            disabled={readOnly}
            className={`star-fill-wrap ${readOnly ? "cursor-default" : "cursor-pointer"}`}
            style={{ width: size, height: size }}
            onMouseMove={(e) => {
              if (readOnly) return;
              setHoverValue(computeValueFromEvent(e, starIndex));
            }}
            onClick={(e) => {
              if (readOnly) return;
              const newValue = computeValueFromEvent(e, starIndex);
              onChange?.(newValue === value ? null : newValue); // click same value again clears it
            }}
            aria-label={`Rate ${starIndex + 1} star${starIndex === 0 ? "" : "s"}`}
          >
            <StarSvg className="star-bg" size={size} fill="rgba(245,243,255,0.12)" />
            <span
              className="star-fg"
              style={{ width: `${fillAmount * 100}%`, height: size }}
            >
              <StarSvg size={size} fill="#F2B65B" />
            </span>
          </button>
        );
      })}
      {value != null && (
        <span className="ml-2 font-mono text-xs text-violet-300/70">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function StarSvg({ size, fill, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2.5l2.9 6.1 6.6.7-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.7L12 2.5z"
        fill={fill}
      />
    </svg>
  );
}
