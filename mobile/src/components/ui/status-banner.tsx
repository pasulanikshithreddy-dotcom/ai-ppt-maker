import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/lib/theme";

type Tone = "warning" | "danger" | "success";

export function StatusBanner({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: Tone;
}) {
  return (
    <View
      style={[
        styles.base,
        tone === "warning" && styles.warning,
        tone === "danger" && styles.danger,
        tone === "success" && styles.success,
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  warning: {
    backgroundColor: "rgba(255,199,107,0.12)",
    borderColor: "rgba(255,199,107,0.18)",
  },
  danger: {
    backgroundColor: "rgba(255,142,159,0.12)",
    borderColor: "rgba(255,142,159,0.18)",
  },
  success: {
    backgroundColor: "rgba(149,255,112,0.12)",
    borderColor: "rgba(149,255,112,0.18)",
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  description: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
});
