// Design tokens for this app (light theme, Moss Green Material You palette).
// Keys match the "color" block of /app/design_guidelines.json.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#F7FAF7",
  onSurface: "#121A14",
  surfaceSecondary: "#EAF2EB",
  onSurfaceSecondary: "#1A2D20",
  surfaceTertiary: "#DDEADA",
  onSurfaceTertiary: "#122117",
  surfaceInverse: "#213526",
  onSurfaceInverse: "#F7FAF7",
  muted: "#5B7061",

  brand: "#4A7C59",
  onBrand: "#FFFFFF",
  brandPrimary: "#4A7C59",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#B8D8BE",
  onBrandSecondary: "#122117",
  brandTertiary: "#CDE5D2",
  onBrandTertiary: "#122117",

  success: "#386641",
  onSuccess: "#FFFFFF",
  warning: "#B57B2A",
  onWarning: "#FFFFFF",
  error: "#993B32",
  onError: "#FFFFFF",
  info: "#4A7C59",
  onInfo: "#FFFFFF",

  border: "#CDE5D2",
  borderStrong: "#4A7C59",
  divider: "#CDE5D2",
  scrim: "rgba(18,26,20,0.55)",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = (system === "light" || system === "dark") && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
