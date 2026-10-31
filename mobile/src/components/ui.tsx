import React from "react";
import { ActivityIndicator, Pressable, Text, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, useTheme } from "../theme";
import type { CleanItem } from "../types";

export type IconName = React.ComponentProps<typeof MaterialDesignIcons>["name"];
export const Icon = MaterialDesignIcons;

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressable
        testID="header-back-button"
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Icon name="arrow-left" size={24} color={colors.onSurface} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  loading,
  disabled,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "tonal" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  testID: string;
  style?: ViewStyle;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const bg = {
    primary: colors.brandPrimary,
    tonal: colors.brandTertiary,
    danger: colors.error,
    ghost: "transparent",
  }[variant];
  const fg = {
    primary: colors.onBrandPrimary,
    tonal: colors.onBrandTertiary,
    danger: colors.onError,
    ghost: colors.brandPrimary,
  }[variant];
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : 1 },
        pressed && styles.btnPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} color={fg} /> : null}
          <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const kindIcon: Record<CleanItem["kind"], IconName> = {
  photo: "image-outline",
  video: "play-circle-outline",
  audio: "music-note-outline",
  file: "file-outline",
};

export function Thumb({ item, size = 56, radius = 12 }: { item: CleanItem; size?: number | "100%"; radius?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const box = { width: size, height: size, borderRadius: radius } as ViewStyle;
  if (item.preview !== undefined) {
    return (
      <Image
        source={typeof item.preview === "string" ? { uri: item.preview } : item.preview}
        style={[styles.thumb, box as any]}
        contentFit="cover"
        transition={150}
        recyclingKey={item.id}
      />
    );
  }
  return (
    <View style={[styles.thumb, styles.thumbIcon, box]}>
      <Icon name={kindIcon[item.kind]} size={typeof size === "number" ? size * 0.45 : 32} color={colors.brandPrimary} />
    </View>
  );
}

export function Checkbox({ checked, onPress, testID }: { checked: boolean; onPress: () => void; testID: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} hitSlop={10} style={styles.checkHit}>
      <View style={[styles.check, checked && styles.checkOn]}>
        {checked ? <Icon name="check" size={16} color={colors.onBrandPrimary} /> : null}
      </View>
    </Pressable>
  );
}

export function BottomBar({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  return <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>{children}</View>;
}

export function EmptyState({
  title,
  body,
  action,
  testID,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  testID: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.empty} testID={testID}>
      <Image source={require("../../assets/images/empty_clean.jpg")} style={styles.emptyImg} contentFit="cover" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: c.surface,
  },
  iconBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  pressed: { backgroundColor: c.surfaceTertiary },
  headerTitle: { fontSize: 20, fontWeight: "700", color: c.onSurface },
  headerSub: { fontSize: 12, color: c.muted, marginTop: 2 },
  btn: {
    minHeight: 52,
    borderRadius: 999,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  btnText: { fontSize: 16, fontWeight: "700" },
  thumb: { backgroundColor: c.surfaceTertiary },
  thumbIcon: { alignItems: "center", justifyContent: "center" },
  checkHit: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: c.borderStrong,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
  empty: { alignItems: "center", paddingHorizontal: 32, paddingTop: 32, gap: 12 },
  emptyImg: { width: 180, height: 180, borderRadius: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: c.onSurface, textAlign: "center" },
  emptyBody: { fontSize: 14, color: c.muted, textAlign: "center", lineHeight: 20, marginBottom: 8 },
}));
