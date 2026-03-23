import { useEffect, useRef } from "react";

export default function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  className,
  rows = 1,
  minHeight = 32,
  maxHeight = 260,
  ariaLabel,
}) {
  const ref = useRef(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.overflowY = "hidden";
    const next = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${next}px`;
  };

  useEffect(() => {
    resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={rows}
      placeholder={placeholder}
      aria-label={ariaLabel || placeholder}
      className={className}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
    />
  );
}
