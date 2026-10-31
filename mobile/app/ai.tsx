import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, EmptyState, Icon, ScreenHeader } from "@/src/components/ui";
import { fetchSuggestions } from "@/src/api";
import { formatBytes } from "@/src/format";
import { useStore } from "@/src/store";
import { makeStyles, useTheme } from "@/src/theme";
import type { AiResult } from "@/src/types";

export default function AiHelper() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const s = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);

  const ask = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await fetchSuggestions(s.items, s.groups, s.disk));
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const review = (ids: string[]) => {
    const existing = new Set(s.items.map((i) => i.id));
    s.clearSelection();
    s.selectMany(ids.filter((id) => existing.has(id)));
    router.push("/review");
  };

  const prColor = (p: string) => (p === "high" ? colors.error : p === "medium" ? colors.warning : colors.brandPrimary);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Smart AI helper" subtitle="Powered by Claude Sonnet 5.5" />
      {s.status !== "done" ? (
        <EmptyState
          testID="ai-not-scanned"
          title="Scan first"
          body="The AI helper needs a scan to look at your file list."
          action={<Button testID="ai-go-home-button" label="Go to scan" onPress={() => router.back()} />}
        />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.intro}>
            <Icon name="creation" size={28} color={colors.brandPrimary} />
            <Text style={styles.introText}>
              The AI only sees file names, sizes, types and dates, never your photos. You review everything before deleting.
            </Text>
          </View>

          {!result && !loading ? (
            <Button testID="ai-ask-button" label="Suggest what to delete" icon="creation" onPress={ask} />
          ) : null}

          {loading ? (
            <View style={styles.loading} testID="ai-loading">
              <ActivityIndicator color={colors.brandPrimary} size="large" />
              <Text style={styles.loadingText}>Looking through {s.items.length} files…</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox} testID="ai-error">
              <Text style={styles.errorText}>{error}</Text>
              <Button testID="ai-retry-button" label="Try again" variant="tonal" icon="refresh" onPress={ask} />
            </View>
          ) : null}

          {result && !loading ? (
            <>
              {result.summary ? (
                <Text style={styles.summary} testID="ai-summary">
                  {result.summary}
                </Text>
              ) : null}
              {result.suggestions.length === 0 ? (
                <EmptyState testID="ai-empty" title="Looking good!" body="Nothing obvious to delete right now." />
              ) : null}
              {result.suggestions.map((sg, i) => (
                <Animated.View
                  key={`${sg.title}-${i}`}
                  entering={FadeInDown.delay(i * 70).duration(350)}
                  style={styles.card}
                  testID={`ai-suggestion-${i}`}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.pr, { backgroundColor: prColor(sg.priority) }]}>
                      <Text style={styles.prText}>{sg.priority}</Text>
                    </View>
                    <Text style={styles.save}>{formatBytes(sg.bytes)}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{sg.title}</Text>
                  <Text style={styles.cardBody}>{sg.reason}</Text>
                  <View style={styles.cardFoot}>
                    <Text style={styles.count}>{sg.item_ids.length} {sg.item_ids.length === 1 ? "file" : "files"}</Text>
                    <Button
                      testID={`ai-suggestion-${i}-review-button`}
                      label="Review"
                      icon="eye-outline"
                      variant="tonal"
                      onPress={() => review(sg.item_ids)}
                      style={{ minHeight: 44 }}
                    />
                  </View>
                </Animated.View>
              ))}
              <Button testID="ai-refresh-button" label="Ask again" variant="ghost" icon="refresh" onPress={ask} />
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  intro: { flexDirection: "row", gap: 12, backgroundColor: c.brandTertiary, borderRadius: 20, padding: 16, alignItems: "center" },
  introText: { flex: 1, color: c.onBrandTertiary, fontSize: 14, lineHeight: 20 },
  loading: { alignItems: "center", gap: 12, paddingVertical: 32 },
  loadingText: { color: c.muted, fontSize: 14 },
  errorBox: { backgroundColor: c.surfaceSecondary, borderRadius: 20, padding: 16, gap: 12 },
  errorText: { color: c.error, fontSize: 14 },
  summary: { fontSize: 16, color: c.onSurface, fontWeight: "600", lineHeight: 22, paddingHorizontal: 4 },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: 20, padding: 16, gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pr: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  prText: { color: c.onError, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  save: { fontSize: 20, fontWeight: "800", color: c.brandPrimary, fontVariant: ["tabular-nums"] },
  cardTitle: { fontSize: 16, fontWeight: "700", color: c.onSurface },
  cardBody: { fontSize: 14, color: c.onSurfaceSecondary, lineHeight: 20 },
  cardFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  count: { fontSize: 12, color: c.muted },
}));
