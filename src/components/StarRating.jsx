import { useState } from "react";

export default function StarRating({ value = 3, onChange, max = 5 }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="starRating" onMouseLeave={() => setHover(0)}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            className={`star ${filled ? "starFilled" : ""}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            aria-label={`Rate ${star} of ${max}`}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
