import React, { useState } from "react";
import { Linking, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon, IconName } from "@/src/components/ui";
import { Ring } from "@/src/components/ring";
import { formatBytes } from "@/src/format";
import { useStore } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";

export default function Home() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const s = useStore();
  const [sheet, setSheet] = useState(false);

  const scanned = s.status === "done";
  const scanning = s.status === "scanning";
  const reclaim = s.dupWasted + s.largeFiles.filter((f) => !s.dupKeyOf[f.id]).reduce((a, f) => a + f.size, 0);
  const used = s.disk ? s.disk.total - s.disk.free : 0;
  const isWeb = Platform.OS === "web";

  const startScan = async () => {
    if (isWeb || s.permission === "unavailable") return s.loadDemo();
    const p = await s.refreshPermission();
    if (p === "granted") return s.scanDevice();
    setSheet(true);
  };

  const allow = async () => {
    if (s.permission === "blocked") {
      Linking.openSettings();
      return;
    }
    const p = await s.requestPermission();
    if (p === "granted") {
      setSheet(false);
      s.scanDevice();
    }
  };

  const tiles: { key: string; icon: IconName; title: string; value: string; sub: string; route: any }[] = [
    {
      key: "duplicates",
      icon: "content-copy",
      title: "Duplicates",
      value: scanned ? formatBytes(s.dupWasted) : "—",
      sub: scanned ? `${s.groups.length} groups` : "Not scanned",
      route: "/duplicates",
    },
    {
      key: "large",
      icon: "file-chart-outline",
      title: "Large files",
      value: scanned ? formatBytes(s.largeBytes) : "—",
      sub: scanned ? `${s.largeFiles.length} over ${s.thresholdMB} MB` : "Not scanned",
      route: "/large",
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Phone Cleaner</Text>
            <Text style={styles.subtitle} testID="home-mode-label">
              {s.mode === "demo" ? "Showing demo data" : s.mode === "device" ? `${s.items.length} files scanned` : "Free · No ads"}
            </Text>
          </View>
          {s.mode === "demo" ? (
            <View style={styles.demoPill}>
              <Text style={styles.demoPillText}>DEMO</Text>
            </View>
          ) : null}
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.storageCard} testID="storage-card">
          <View style={styles.ringWrap}>
            <Ring progress={s.disk ? used / s.disk.total : 0} />
            <View style={styles.ringCenter}>
              <Text style={styles.ringPct} testID="storage-used-percent">
                {s.disk ? `${Math.round((used / s.disk.total) * 100)}%` : "—"}
              </Text>
              <Text style={styles.ringLabel}>used</Text>
            </View>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.cardLabel}>Storage</Text>
            <Text style={styles.bigNum} testID="storage-free-text">
              {s.disk ? formatBytes(s.disk.free) : "—"}
            </Text>
            <Text style={styles.cardSub}>{s.disk ? `free of ${formatBytes(s.disk.total)}` : "Scan to see details"}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.hero} testID="reclaim-card">
          <Text style={styles.heroLabel}>{scanned ? "You could free up" : "Find what's eating your space"}</Text>
          {scanned ? (
            <Text style={styles.heroNum} testID="reclaimable-bytes">
              {formatBytes(reclaim)}
            </Text>
          ) : null}
          {scanning ? (
            <View style={styles.progress} testID="scan-progress">
              <Text style={styles.progressText}>
                {s.progress.label}… {s.progress.done > 0 ? s.progress.done : ""}
              </Text>
            </View>
          ) : null}
          {s.status === "error" && s.error ? (
            <Text style={styles.errorText} testID="scan-error-text">
              {s.error}
            </Text>
          ) : null}
          <Button
            testID="scan-phone-button"
            label={scanned ? "Scan again" : s.status === "error" ? "Retry scan" : "Scan my phone"}
            icon="radar"
            onPress={startScan}
            loading={scanning}
            variant="primary"
            style={styles.heroBtn}
          />
          {s.status === "error" || isWeb ? (
            <Text style={styles.heroHint}>
              {isWeb ? "Web preview uses demo data. Open in Expo Go or an app build to scan your phone." : "Tip: you can try the demo below."}
            </Text>
          ) : null}
        </Animated.View>

        <View style={styles.tiles}>
          {tiles.map((t, i) => (
            <Animated.View key={t.key} entering={FadeInDown.delay(140 + i * 60).duration(400)} style={{ flex: 1 }}>
              <Pressable
                testID={`tile-${t.key}`}
                onPress={() => router.push(t.route)}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              >
                <View style={styles.tileIcon}>
                  <Icon name={t.icon} size={22} color={colors.brandPrimary} />
                </View>
                <Text style={styles.tileTitle}>{t.title}</Text>
                <Text style={styles.tileValue}>{t.value}</Text>
                <Text style={styles.tileSub}>{t.sub}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(260).duration(400)}>
          <Pressable
            testID="tile-ai-helper"
            onPress={() => router.push("/ai")}
            style={({ pressed }) => [styles.aiTile, pressed && styles.pressed]}
          >
            <View style={styles.aiIcon}>
              <Icon name="creation" size={24} color={colors.onBrandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tileTitle}>Smart AI helper</Text>
              <Text style={styles.tileSub}>Get suggestions on what&apos;s safe to delete</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.muted} />
          </Pressable>
        </Animated.View>

        <View style={styles.links}>
          {Platform.OS === "android" ? (
            <Pressable testID="scan-folder-button" onPress={s.scanFolder} style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
              <Icon name="folder-search-outline" size={22} color={colors.brandPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.linkText}>Scan a folder</Text>
                <Text style={styles.tileSub}>Downloads, Documents, WhatsApp…</Text>
              </View>
              <Icon name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
          ) : null}
          <Pressable testID="disclaimer-link" onPress={() => router.push("/disclaimer")} style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
            <Icon name="shield-alert-outline" size={22} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.linkText}>Terms & disclaimer</Text>
              <Text style={styles.tileSub}>Free, no ads · Use at your own risk</Text>
            </View>
            <Icon name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
          <Pressable testID="privacy-link" onPress={() => router.push("/privacy")} style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
            <Icon name="shield-lock-outline" size={22} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.linkText}>Privacy note</Text>
              <Text style={styles.tileSub}>Your files never leave your phone</Text>
            </View>
            <Icon name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
          <Pressable testID="load-demo-button" onPress={s.loadDemo} style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
            <Icon name="flask-outline" size={22} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.linkText}>Try with demo data</Text>
              <Text style={styles.tileSub}>Explore safely, nothing on your phone changes</Text>
            </View>
            <Icon name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
          {s.selected.size > 0 ? (
            <Button
              testID="home-review-selected-button"
              label={`Review ${s.selected.size} selected`}
              icon="eye-outline"
              variant="tonal"
              onPress={() => router.push("/review")}
            />
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)} statusBarTranslucent>
        <Pressable style={styles.scrim} onPress={() => setSheet(false)} testID="permission-sheet-scrim" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID="permission-sheet">
          <View style={styles.handle} />
          <Icon name="shield-check-outline" size={36} color={colors.brandPrimary} />
          <Text style={styles.sheetTitle}>Let Phone Cleaner see your media</Text>
          <Text style={styles.sheetBody}>
            {s.permission === "blocked"
              ? "Access is turned off. Open Settings and allow Photos, Videos and Music to find duplicates and large files."
              : "We read file sizes on your phone to find duplicates and space hogs. Nothing is deleted without your review, and files never leave your phone."}
          </Text>
          <Button
            testID="permission-allow-button"
            label={s.permission === "blocked" ? "Open Settings" : "Allow access"}
            icon={s.permission === "blocked" ? "cog-outline" : "check"}
            onPress={allow}
          />
          <Button
            testID="permission-demo-button"
            label="Use demo data instead"
            variant="ghost"
            onPress={() => {
              setSheet(false);
              s.loadDemo();
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { paddingHorizontal: 16, gap: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  title: { fontSize: 28, fontWeight: "800", color: c.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: c.muted, marginTop: 2 },
  demoPill: { backgroundColor: c.warning, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  demoPillText: { color: c.onWarning, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  storageCard: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ringWrap: { width: 140, height: 140, alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringPct: { fontSize: 28, fontWeight: "800", color: c.onSurface, fontVariant: ["tabular-nums"] },
  ringLabel: { fontSize: 12, color: c.muted },
  cardLabel: { fontSize: 12, color: c.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: "700" },
  bigNum: { fontSize: 24, fontWeight: "800", color: c.onSurface, fontVariant: ["tabular-nums"] },
  cardSub: { fontSize: 14, color: c.onSurfaceSecondary },
  hero: { backgroundColor: c.surfaceInverse, borderRadius: 20, padding: 24, gap: 8 },
  heroLabel: { color: c.brandSecondary, fontSize: 16, fontWeight: "600" },
  heroNum: { color: c.onSurfaceInverse, fontSize: 40, fontWeight: "800", letterSpacing: -1, fontVariant: ["tabular-nums"] },
  heroBtn: { marginTop: 8 },
  heroHint: { color: c.brandSecondary, fontSize: 12, lineHeight: 18 },
  progress: { paddingVertical: 4 },
  progressText: { color: c.onSurfaceInverse, fontSize: 14 },
  errorText: { color: c.onSurfaceInverse, backgroundColor: c.error, padding: 12, borderRadius: 12, fontSize: 14 },
  tiles: { flexDirection: "row", gap: 12 },
  tile: { backgroundColor: c.surfaceSecondary, borderRadius: 20, padding: 16, gap: 4, minHeight: 150 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tileTitle: { fontSize: 16, fontWeight: "700", color: c.onSurface },
  tileValue: { fontSize: 20, fontWeight: "800", color: c.brandPrimary, fontVariant: ["tabular-nums"] },
  tileSub: { fontSize: 12, color: c.muted },
  aiTile: {
    backgroundColor: c.brandTertiary,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: c.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  links: { gap: 8 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: c.surfaceSecondary,
  },
  linkText: { fontSize: 16, fontWeight: "600", color: c.onSurface },
  scrim: { flex: 1, backgroundColor: c.scrim },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: c.onSurface },
  sheetBody: { fontSize: 14, color: c.onSurfaceSecondary, lineHeight: 20, marginBottom: 8 },
}));
