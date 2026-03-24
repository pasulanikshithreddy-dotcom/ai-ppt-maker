import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useApp } from "@/providers/app-provider";
import { theme } from "@/lib/theme";

export default function TabsLayout() {
  const { authStatus } = useApp();

  if (authStatus === "loading") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (authStatus !== "authenticated") {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceStrong,
          borderTopColor: theme.colors.border,
          height: 70,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="create" options={{ title: "Create" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="pricing" options={{ title: "Pricing" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
