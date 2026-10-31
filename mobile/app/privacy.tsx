import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, IconName, ScreenHeader } from "@/src/components/ui";
import { PRIVACY_SECTIONS, PRIVACY_UPDATED } from "@/src/privacy-text";
import { makeStyles, useTheme } from "@/src/theme";

const ICONS: IconName[] = ["cellphone-lock", "creation", "account-off-outline", "shield-key-outline", "trash-can-outline", "email-outline"];

export default function Privacy() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root} testID="privacy-screen">
      <ScreenHeader title="Privacy note" subtitle={`Last updated ${PRIVACY_UPDATED}`} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.hero} testID="privacy-hero">
          <Icon name="shield-check" size={28} color={colors.onBrandTertiary} />
          <Text style={styles.heroText}>Your files never leave your phone.</Text>
        </View>
        {PRIVACY_SECTIONS.map((s, i) => (
          <View key={s.title} style={styles.card} testID={`privacy-section-${i}`}>
            <View style={styles.cardHead}>
              <Icon name={ICONS[i] ?? "information-outline"} size={20} color={colors.brandPrimary} />
              <Text style={styles.cardTitle}>{s.title}</Text>
            </View>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.brandTertiary, borderRadius: 20, padding: 16 },
  heroText: { flex: 1, fontSize: 16, fontWeight: "800", color: c.onBrandTertiary },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: 20, padding: 16, gap: 8 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: c.onSurface, flex: 1 },
  cardBody: { fontSize: 14, lineHeight: 20, color: c.onSurfaceSecondary },
}));
