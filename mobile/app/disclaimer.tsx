import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomBar, Button, Checkbox, Icon } from "@/src/components/ui";
import { DISCLAIMER_KEY } from "@/src/consent";
import { storage } from "@/src/utils/storage";
import { makeStyles, useTheme } from "@/src/theme";

const POINTS = [
  "Phone Cleaner is free and has no ads, subscriptions or in-app purchases.",
  "The app is provided \"as is\", without any warranty of any kind.",
  "You decide what gets deleted. Deleted files are removed permanently and cannot be recovered by the app.",
  "Duplicate, large-file and AI suggestions can be wrong. Always review files before deleting them.",
  "Back up anything important (photos, videos, documents) before cleaning.",
  "The developer is not responsible or liable for any data loss, damage or other loss resulting from use of this app.",
];

export default function Disclaimer() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    storage.getItem(DISCLAIMER_KEY, false as boolean).then((v) => setAccepted(v === true));
  }, []);

  const agree = async () => {
    await storage.setItem(DISCLAIMER_KEY, true);
    router.replace("/");
  };

  return (
    <View style={styles.root} testID="disclaimer-screen">
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
        <View style={styles.badge}>
          <Icon name="gift-outline" size={18} color={colors.onBrandTertiary} />
          <Text style={styles.badgeText}>100% free · No ads</Text>
        </View>
        <Text style={styles.title}>Before you start</Text>
        <Text style={styles.lead}>Please read and accept these terms to use Phone Cleaner.</Text>
        <View style={styles.card}>
          {POINTS.map((p, i) => (
            <View key={i} style={styles.point}>
              <Icon name={i === 0 ? "check-circle-outline" : "alert-circle-outline"} size={20} color={i === 0 ? colors.success : colors.warning} />
              <Text style={styles.pointText}>{p}</Text>
            </View>
          ))}
        </View>
        {accepted ? (
          <Text style={styles.done} testID="disclaimer-accepted-text">
            You accepted these terms.
          </Text>
        ) : (
          <Pressable style={styles.agreeRow} onPress={() => setChecked((c) => !c)} testID="disclaimer-agree-row">
            <Checkbox testID="disclaimer-agree-checkbox" checked={checked} onPress={() => setChecked((c) => !c)} />
            <Text style={styles.agreeText}>
              I understand and agree that I use this app at my own risk and the developer is not responsible for any loss.
            </Text>
          </Pressable>
        )}
      </ScrollView>
      <BottomBar>
        {accepted ? (
          <Button testID="disclaimer-close-button" label="Close" variant="tonal" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
        ) : (
          <Button testID="disclaimer-accept-button" label="Accept & continue" icon="check" disabled={!checked || accepted === null} onPress={agree} />
        )}
      </BottomBar>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: c.brandTertiary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: { color: c.onBrandTertiary, fontSize: 12, fontWeight: "800" },
  title: { fontSize: 28, fontWeight: "800", color: c.onSurface, letterSpacing: -0.5 },
  lead: { fontSize: 14, color: c.muted },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: 20, padding: 16, gap: 14 },
  point: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  pointText: { flex: 1, fontSize: 14, lineHeight: 20, color: c.onSurfaceSecondary },
  agreeRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingRight: 8 },
  agreeText: { flex: 1, fontSize: 14, lineHeight: 20, color: c.onSurface, fontWeight: "600" },
  done: { fontSize: 14, color: c.success, fontWeight: "700", paddingHorizontal: 4 },
}));
