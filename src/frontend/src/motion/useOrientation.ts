import { useEffect, useState } from "react";

export function useOrientation(): { isPortrait: boolean } {
  const [isPortrait, setIsPortrait] = useState(
    () => window.innerWidth < window.innerHeight,
  );

  useEffect(() => {
    const update = () => setIsPortrait(window.innerWidth < window.innerHeight);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return { isPortrait };
}
