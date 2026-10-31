import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatAge, formatBytes } from "../format";
import { useStore } from "../store";
import { makeStyles, useTheme } from "../theme";
import type { CleanItem } from "../types";
import { Button, Icon } from "./ui";

export function PreviewModal({ item, onClose }: { item: CleanItem | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const { selected, toggle, keeperIds } = useStore();
  if (!item) return null;
  const isSel = selected.has(item.id);
  const isKeeper = keeperIds.has(item.id);
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]} testID="preview-modal">
        <View style={styles.top}>
          <Pressable testID="preview-close-button" onPress={onClose} style={styles.close} hitSlop={8}>
            <Icon name="close" size={26} color={colors.onSurfaceInverse} />
          </Pressable>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View style={styles.media}>
          {item.preview !== undefined ? (
            <Image
              source={typeof item.preview === "string" ? { uri: item.preview } : item.preview}
              style={styles.img}
              contentFit="contain"
            />
          ) : (
            <Icon
              name={item.kind === "video" ? "play-circle-outline" : item.kind === "audio" ? "music-note-outline" : "file-outline"}
              size={120}
              color={colors.brandSecondary}
            />
          )}
        </View>
        <View style={styles.meta}>
          <Text style={styles.size} testID="preview-size">
            {formatBytes(item.size)}
          </Text>
          <Text style={styles.sub}>
            {item.kind[0].toUpperCase() + item.kind.slice(1)} · {formatAge(item.modified)}
            {isKeeper ? " · Recommended to keep" : ""}
          </Text>
          <Button
            testID="preview-toggle-select-button"
            label={isSel ? "Keep this file" : "Mark for deletion"}
            icon={isSel ? "check-circle-outline" : "trash-can-outline"}
            variant={isSel ? "tonal" : "danger"}
            onPress={() => toggle(item.id)}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceInverse },
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 8 },
  close: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  name: { flex: 1, color: c.onSurfaceInverse, fontSize: 16, fontWeight: "600" },
  media: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  img: { width: "100%", height: "100%" },
  meta: { paddingHorizontal: 24 },
  size: { color: c.onSurfaceInverse, fontSize: 24, fontWeight: "800", fontVariant: ["tabular-nums"] },
  sub: { color: c.brandSecondary, fontSize: 14, marginTop: 4 },
}));
