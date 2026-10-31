import React, { useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { BottomBar, Button, Checkbox, EmptyState, ScreenHeader, Thumb } from "@/src/components/ui";
import { PreviewModal } from "@/src/components/preview-modal";
import { formatAge, formatBytes } from "@/src/format";
import { useStore } from "@/src/store";
import { makeStyles } from "@/src/theme";
import type { CleanItem, DupGroup } from "@/src/types";

export default function Duplicates() {
  const styles = useStyles();
  const router = useRouter();
  const s = useStore();
  const [preview, setPreview] = useState<CleanItem | null>(null);
  const extras = s.groups.flatMap((g) => g.items.slice(1).map((i) => i.id));
  const allExtrasSelected = extras.length > 0 && extras.every((id) => s.selected.has(id));

  const renderGroup = ({ item: g, index }: { item: DupGroup; index: number }) => {
    const groupExtras = g.items.slice(1).map((i) => i.id);
    const allSel = groupExtras.every((id) => s.selected.has(id));
    return (
      <View style={styles.group} testID={`dup-group-${index}`}>
        <View style={styles.groupHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupTitle} numberOfLines={1}>
              {g.items.length} copies · {g.items[0].name}
            </Text>
            <Text style={styles.groupSub}>Wasting {formatBytes(g.wasted)}</Text>
          </View>
          <Pressable
            testID={`dup-group-${index}-select-extras`}
            onPress={() => s.selectMany(groupExtras, !allSel)}
            style={({ pressed }) => [styles.smallBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.smallBtnText}>{allSel ? "Unselect" : "Select extras"}</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {g.items.map((it, i) => (
            <View key={it.id} style={styles.thumbCard}>
              <Pressable testID={`dup-item-preview-${it.id}`} onPress={() => setPreview(it)}>
                <Thumb item={it} size={112} radius={12} />
              </Pressable>
              <View style={styles.checkPos}>
                <Checkbox testID={`dup-item-check-${it.id}`} checked={s.selected.has(it.id)} onPress={() => s.toggle(it.id)} />
              </View>
              {i === 0 ? (
                <View style={styles.best}>
                  <Text style={styles.bestText}>Best</Text>
                </View>
              ) : null}
              <Text style={styles.thumbMeta} numberOfLines={1}>
                {formatAge(it.modified)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Duplicates"
        subtitle={s.groups.length ? `${s.groups.length} groups · ${formatBytes(s.dupWasted)} reclaimable` : undefined}
        right={
          extras.length ? (
            <Pressable
              testID="dup-select-all-button"
              onPress={() => s.selectMany(extras, !allExtrasSelected)}
              style={styles.headerAction}
              hitSlop={8}
            >
              <Text style={styles.headerActionText}>{allExtrasSelected ? "Clear" : "Select all"}</Text>
            </Pressable>
          ) : null
        }
      />
      {s.status !== "done" ? (
        <EmptyState
          testID="dup-not-scanned"
          title="Scan first"
          body="Run a scan from the home screen to find duplicate photos and files."
          action={<Button testID="dup-go-home-button" label="Go to scan" onPress={() => router.back()} />}
        />
      ) : (
        <FlatList
          data={s.groups}
          keyExtractor={(g) => g.key}
          renderItem={renderGroup}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            s.groups.length ? (
              <Text style={styles.hint}>The oldest copy is marked Best and kept. Tap a photo to preview it.</Text>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              testID="dup-empty"
              title="No duplicates found!"
              body="Your photos and files are nicely unique."
              action={<Button testID="dup-empty-home-button" label="Back home" onPress={() => router.back()} />}
            />
          }
        />
      )}
      {s.selected.size > 0 ? (
        <BottomBar>
          <Button
            testID="dup-review-button"
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
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  hint: { color: c.muted, fontSize: 12, marginBottom: 4, paddingHorizontal: 4 },
  group: { backgroundColor: c.surfaceSecondary, borderRadius: 20, paddingVertical: 16, gap: 12 },
  groupHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8 },
  groupTitle: { fontSize: 14, fontWeight: "700", color: c.onSurface },
  groupSub: { fontSize: 12, color: c.brandPrimary, fontWeight: "600", marginTop: 2 },
  smallBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: c.brandTertiary,
    justifyContent: "center",
  },
  smallBtnText: { color: c.onBrandTertiary, fontSize: 12, fontWeight: "700" },
  thumbRow: { paddingLeft: 16, paddingRight: 24, paddingTop: 6, gap: 12 },
  thumbCard: { width: 112 },
  checkPos: { position: "absolute", top: -4, right: -4 },
  best: {
    position: "absolute",
    left: 6,
    top: 6,
    backgroundColor: c.brandTertiary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bestText: { fontSize: 12, fontWeight: "800", color: c.onBrandTertiary },
  thumbMeta: { fontSize: 12, color: c.muted, marginTop: 4 },
  headerAction: { paddingHorizontal: 12, height: 44, justifyContent: "center" },
  headerActionText: { color: c.brandPrimary, fontWeight: "700", fontSize: 14 },
}));
