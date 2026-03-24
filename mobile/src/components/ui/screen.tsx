import { ScrollView, StyleSheet, View } from "react-native";

import { theme } from "@/lib/theme";

export function Screen({
  children,
  scrollable = false,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  if (scrollable) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.container, styles.content]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    gap: 16,
    padding: theme.spacing.screen,
  },
});
