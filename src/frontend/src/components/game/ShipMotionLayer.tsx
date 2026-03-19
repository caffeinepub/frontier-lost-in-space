import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { registerMotionLayer } from "../../motion/shipMotionEngine";

interface Props {
  factor: number;
  children: ReactNode;
  zIndex?: number;
  style?: CSSProperties;
  /** 0 = no cockpit lean applied (default). 1 = full lean applied. */
  leanMult?: number;
}

export default function ShipMotionLayer({
  factor,
  children,
  zIndex,
  style,
  leanMult = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return registerMotionLayer(ref.current, factor, leanMult);
  }, [factor, leanMult]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        zIndex,
        willChange: "transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
