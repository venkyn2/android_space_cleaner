import React from "react";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "../theme";

export function Ring({ size = 140, stroke = 14, progress }: { size?: number; stroke?: number; progress: number }) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceTertiary} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={p > 0.9 ? colors.warning : colors.brandPrimary}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={circ * (1 - p)}
        strokeLinecap="round"
      />
    </Svg>
  );
}
