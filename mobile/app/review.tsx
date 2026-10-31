import React, { useState } from "react";
import { FlatList, Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomBar, Button, EmptyState, Icon, ScreenHeader, Thumb } from "@/src/components/ui";
import { PreviewModal } from "@/src/components/preview-modal";
import { formatBytes } from "@/src/format";
import { useStore } from "@/src/store";
import { useToast } from "@/src/toast";
import { makeStyles, useTheme } from "@/src/theme";
import type { CleanItem } from "@/src/types";

export default function Review() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const s = useStore();
  const { width } = useWindowDimensions();
  const [preview, setPreview] = useState<CleanItem | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [freed, setFreed] = useState<{ count: number; bytes: number } | null>(null);
  const cell = Math.floor((Math.min(width, 600) - 16 * 2 - 8 * 2) / 3);
  const hasKeeper = s.selectedItems.some((i) => s.keeperIds.has(i.id));

  const doDelete = async () => {
    setDeleting(true);
    try {
      const r = await s.deleteSelected();
      setConfirm(false);
      if (r.count === 0) toast("Nothing was deleted");
      else {
        setFreed(r);
        toast(`Freed ${formatBytes(r.bytes)}`);
      }
    } catch (e: any) {
      setConfirm(false);
      toast(`Delete failed: ${e?.message ?? "unknown error"}`);
    } finally {
      setDeleting(false);
    }
  };

  if (freed) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="All done" />
        <EmptyState
          testID="review-success"
          title={`Freed ${formatBytes(freed.bytes)}`}
          body={
            s.mode === "demo"
              ? `${freed.count} demo ${freed.count === 1 ? "file" : "files"} removed. Your phone wasn't touched.`
              : `${freed.count} ${freed.count === 1 ? "file" : "files"} removed from your phone.`
          }
          action={<Button testID="review-done-button" label="Back home" icon="home-outline" onPress={() => router.dismissTo("/")} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Preview before deleting"
        subtitle={`${s.selectedItems.length} files · ${formatBytes(s.selectedBytes)}`}
        right={
          s.selectedItems.length ? (
            <Pressable testID="review-clear-button" onPress={s.clearSelection} style={styles.headerAction} hitSlop={8}>
              <Text style={styles.headerActionText}>Clear</Text>
            </Pressable>
          ) : null
        }
      />
      <FlatList
        data={s.selectedItems}
        keyExtractor={(i) => i.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 8 }}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          s.selectedItems.length ? (
            <View style={{ gap: 8, marginBottom: 4 }}>
              <Text style={styles.hint}>Tap to view full size. Tap × to keep a file.</Text>
              {hasKeeper ? (
                <View style={styles.warn} testID="review-keeper-warning">
                  <Icon name="alert-outline" size={18} color={colors.onWarning} />
                  <Text style={styles.warnText}>Some selected files are the last &quot;Best&quot; copy of a duplicate.</Text>
                </View>
              ) : null}
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={{ width: cell }}>
            <Pressable testID={`review-item-preview-${item.id}`} onPress={() => setPreview(item)}>
              <Thumb item={item} size={cell} radius={12} />
            </Pressable>
            <Pressable testID={`review-item-remove-${item.id}`} onPress={() => s.toggle(item.id)} style={styles.remove} hitSlop={8}>
              <Icon name="close" size={16} color={colors.onSurfaceInverse} />
            </Pressable>
            <Text style={styles.cellName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.cellSize}>{formatBytes(item.size)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            testID="review-empty"
            title="Nothing selected"
            body="Pick files from Duplicates, Large files or AI suggestions to review them here."
            action={<Button testID="review-back-button" label="Go back" onPress={() => router.back()} />}
          />
        }
      />
      {s.selectedItems.length ? (
        <BottomBar>
          <Button
            testID="review-delete-button"
            label={`Delete ${s.selectedItems.length} · ${formatBytes(s.selectedBytes)}`}
            icon="trash-can-outline"
            variant="danger"
            onPress={() => setConfirm(true)}
          />
        </BottomBar>
      ) : null}

      <PreviewModal item={preview} onClose={() => setPreview(null)} />

      <Modal visible={confirm} transparent animationType="slide" onRequestClose={() => setConfirm(false)} statusBarTranslucent>
        <Pressable style={styles.scrim} onPress={() => !deleting && setConfirm(false)} testID="confirm-sheet-scrim" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID="confirm-delete-sheet">
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Delete {s.selectedItems.length} files?</Text>
          <Text style={styles.sheetNum}>{formatBytes(s.selectedBytes)}</Text>
          <Text style={styles.sheetBody}>
            {s.mode === "demo"
              ? "Demo mode: only the demo list changes, nothing on your phone is touched."
              : "This permanently removes the files from your phone. Android may ask you to confirm once more."}
          </Text>
          <Text style={styles.sheetNote} testID="confirm-disclaimer-text">
            You are responsible for what you delete. The developer is not liable for any data loss.
          </Text>
          <Button testID="confirm-delete-button" label="Delete permanently" icon="trash-can-outline" variant="danger" loading={deleting} onPress={doDelete} />
          <Button testID="confirm-cancel-button" label="Cancel" variant="ghost" disabled={deleting} onPress={() => setConfirm(false)} />
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  grid: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  hint: { color: c.muted, fontSize: 12, paddingHorizontal: 4 },
  warn: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: c.warning, borderRadius: 12, padding: 12 },
  warnText: { color: c.onWarning, fontSize: 12, flex: 1, fontWeight: "600" },
  remove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.surfaceInverse,
    alignItems: "center",
    justifyContent: "center",
  },
  cellName: { fontSize: 12, color: c.onSurface, marginTop: 4 },
  cellSize: { fontSize: 12, color: c.muted, fontWeight: "700", fontVariant: ["tabular-nums"] },
  headerAction: { paddingHorizontal: 12, height: 44, justifyContent: "center" },
  headerActionText: { color: c.brandPrimary, fontWeight: "700", fontSize: 14 },
  scrim: { flex: 1, backgroundColor: c.scrim },
  sheet: { backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 8 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: c.onSurface },
  sheetNum: { fontSize: 32, fontWeight: "800", color: c.error, fontVariant: ["tabular-nums"] },
  sheetBody: { fontSize: 14, color: c.onSurfaceSecondary, lineHeight: 20 },
  sheetNote: { fontSize: 12, color: c.muted, lineHeight: 18, marginBottom: 8 },
}));
