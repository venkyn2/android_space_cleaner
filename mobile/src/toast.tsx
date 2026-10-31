import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles } from "./theme";

const ToastContext = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  const show = useCallback((m: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(m);
    timer.current = setTimeout(() => setMsg(null), 2800);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg ? (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOutDown}
          pointerEvents="none"
          style={[styles.toast, { bottom: insets.bottom + 96 }]}
          testID="toast-message"
        >
          <Text style={styles.text}>{msg}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const useStyles = makeStyles((c) => ({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: c.surfaceInverse,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  text: { color: c.onSurfaceInverse, fontSize: 14, fontWeight: "600" },
}));
