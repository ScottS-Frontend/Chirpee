import { useRef } from "react";

export default function useMinLoading(minMs = 800) {
  const startRef = useRef(Date.now());

  function finishLoading(setLoading) {
    const elapsed = Date.now() - startRef.current;
    const remaining = Math.max(0, minMs - elapsed);
    setTimeout(() => setLoading(false), remaining);
  }

  return finishLoading;
}
