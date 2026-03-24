import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { theme } from "@/lib/theme";

type ButtonVariant = "primary" | "secondary" | "ghost";

export function Button({
  title,
  onPress,
  disabled,
  variant = "primary",
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
    >
      <Text style={[styles.label, variant === "primary" ? styles.primaryLabel : null]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: theme.radius.pill,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: theme.colors.accent,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  primaryLabel: {
    color: "#021018",
  },
});
