import { useEffect } from "react";

export function useDebouncedEffect(effect, deps, delay) {
  useEffect(() => {
    const id = setTimeout(() => effect(), delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
