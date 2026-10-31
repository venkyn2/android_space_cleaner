import React, { useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { BottomBar, Button, Checkbox, EmptyState, ScreenHeader, Thumb } from "@/src/components/ui";
import { PreviewModal } from "@/src/components/preview-modal";
import { formatAge, formatBytes } from "@/src/format";
import { useStore } from "@/src/store";
import { makeStyles } from "@/src/theme";
import type { CleanItem } from "@/src/types";

const THRESHOLDS = [10, 50, 100, 250, 500, 1000];

export default function LargeFiles() {
  const styles = useStyles();
  const router = useRouter();
  const s = useStore();
  const [preview, setPreview] = useState<CleanItem | null>(null);

  const renderItem = ({ item }: { item: CleanItem }) => (
    <View style={styles.row}>
      <Pressable
        testID={`large-item-preview-${item.id}`}
        onPress={() => setPreview(item)}
        style={({ pressed }) => [styles.rowBody, pressed && { opacity: 0.7 }]}
      >
        <Thumb item={item} size={52} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.meta}>
            {item.kind[0].toUpperCase() + item.kind.slice(1)} · {formatAge(item.modified)}
            {s.keeperIds.has(item.id) ? " · original" : s.dupKeyOf[item.id] ? " · duplicate" : ""}
          </Text>
        </View>
        <Text style={styles.size}>{formatBytes(item.size)}</Text>
      </Pressable>
      <Checkbox testID={`large-item-check-${item.id}`} checked={s.selected.has(item.id)} onPress={() => s.toggle(item.id)} />
    </View>
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Large files"
        subtitle={s.status === "done" ? `${s.largeFiles.length} files · ${formatBytes(s.largeBytes)}` : undefined}
      />
      <View style={styles.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {THRESHOLDS.map((t) => {
            const on = s.thresholdMB === t;
            return (
              <Pressable
                key={t}
                testID={`threshold-chip-${t}`}
                onPress={() => s.setThresholdMB(t)}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{t >= 1000 ? "> 1 GB" : `> ${t} MB`}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      {s.status !== "done" ? (
        <EmptyState
          testID="large-not-scanned"
          title="Scan first"
          body="Run a scan from the home screen to list your biggest files."
          action={<Button testID="large-go-home-button" label="Go to scan" onPress={() => router.back()} />}
        />
      ) : (
        <FlatList
          data={s.largeFiles}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <EmptyState
              testID="large-empty"
              title="No large files"
              body={`Nothing above ${s.thresholdMB} MB. Try a smaller size above.`}
            />
          }
        />
      )}
      {s.selected.size > 0 ? (
        <BottomBar>
          <Button
            testID="large-review-button"
            label={`Review ${s.selected.size} · ${formatBytes(s.selectedBytes)}`}
            icon="eye-outline"
            onPress={() => router.push("/review")}
          />
        </BottomBar>
      ) : null}
      <PreviewModal item={preview} onClose={() => setPreview(null)} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  chipRow: { height: 56, justifyContent: "center" },
  chips: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  chip: {
    height: 36,
    flexShrink: 0,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: c.surfaceSecondary,
    borderWidth: 1,
    borderColor: c.border,
    justifyContent: "center",
  },
  chipOn: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  chipText: { fontSize: 14, fontWeight: "600", color: c.onSurfaceSecondary },
  chipTextOn: { color: c.onBrandPrimary },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowBody: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  name: { fontSize: 14, fontWeight: "600", color: c.onSurface },
  meta: { fontSize: 12, color: c.muted, marginTop: 2 },
  size: { fontSize: 14, fontWeight: "800", color: c.onSurface, fontVariant: ["tabular-nums"] },
  sep: { height: 1, backgroundColor: c.divider },
}));
