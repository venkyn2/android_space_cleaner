import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { LogBox, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { StoreProvider } from "@/src/store";
import { ToastProvider } from "@/src/toast";
import { DISCLAIMER_KEY } from "@/src/consent";
import { storage } from "@/src/utils/storage";
import { useTheme } from "@/src/theme";

// Every route requires accepted terms; until consent is known nothing is shown.
function ConsentGate({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);
  const onDisclaimer = segments[0] === "disclaimer";

  useEffect(() => {
    storage.getItem(DISCLAIMER_KEY, false as boolean).then((v) => {
      if (v !== true && !onDisclaimer) router.replace("/disclaimer");
      else setReady(true);
    });
  }, [onDisclaimer, router]);

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      {children}
      {!ready && !onDisclaimer ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} /> : null}
    </View>
  );
}

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <StoreProvider>
              <ToastProvider>
                <StatusBar style="dark" />
                <ConsentGate>
                  <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
                </ConsentGate>
              </ToastProvider>
            </StoreProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
