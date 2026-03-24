import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { theme } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

export default function ProfileScreen() {
  const { currentUser, plan, refreshAccount, signOut } = useApp();
  const initials = (currentUser?.name || currentUser?.email || "AI")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen scrollable>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Profile</Text>
        <Text style={styles.title}>Your account and plan details.</Text>
      </View>

      <Card>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{currentUser?.name ?? "AI PPT Maker User"}</Text>
            <Text style={styles.mutedText}>{currentUser?.email}</Text>
            <Text style={styles.planText}>{plan?.current_plan.name ?? "Free"} plan</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Plan features</Text>
        {(plan?.current_plan.features ?? []).map((feature) => (
          <Text key={feature.key} style={styles.featureText}>
            {feature.included ? "Included" : "Locked"}: {feature.label}
          </Text>
        ))}
      </Card>

      <Button title="Refresh account" variant="secondary" onPress={() => void refreshAccount()} />
      <Button title="Logout" variant="ghost" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 12,
    marginBottom: 16,
  },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  profileRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 24,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  avatarText: {
    color: "#021018",
    fontSize: 22,
    fontWeight: "800",
  },
  nameText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  mutedText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  planText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  featureText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
});
