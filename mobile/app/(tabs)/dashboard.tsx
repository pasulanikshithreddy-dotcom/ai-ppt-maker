import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { StatusBanner } from "@/components/ui/status-banner";
import { useHistory } from "@/hooks/use-history";
import { theme } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

export default function DashboardScreen() {
  const { accessToken, currentUser, plan } = useApp();
  const { items, loading, error } = useHistory(accessToken);

  return (
    <Screen scrollable>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Dashboard</Text>
        <Text style={styles.title}>Your mobile slide studio is ready.</Text>
        <Text style={styles.description}>
          Check plan access, daily topic allowance, and the latest saved decks from one place.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Plan</Text>
          <Text style={styles.statValue}>{plan?.current_plan.name ?? "Free"}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Topic quota</Text>
          <Text style={styles.statValue}>
            {plan?.remaining_topic_generations == null
              ? "Unlimited"
              : String(plan.remaining_topic_generations)}
          </Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.bodyText}>{currentUser?.email}</Text>
        <Text style={styles.mutedText}>
          {currentUser?.can_use_pro_features
            ? "Premium templates, Notes to PPT, and watermark-free exports are unlocked."
            : "Free plan active with topic generation limits and premium feature locks."}
        </Text>
      </Card>

      {error ? <StatusBanner tone="danger" title="History load failed" description={error} /> : null}

      <Card>
        <Text style={styles.sectionTitle}>Recent presentations</Text>
        {loading ? <Text style={styles.mutedText}>Loading recent decks...</Text> : null}
        {!loading && items.length === 0 ? (
          <Text style={styles.mutedText}>Your recent decks will appear here after generation.</Text>
        ) : null}
        {items.slice(0, 3).map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <Text style={styles.historyTitle}>{item.title}</Text>
            <Text style={styles.mutedText}>
              {item.source_type.toUpperCase()} • {item.template_name ?? item.template_id}
            </Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 12,
    marginBottom: 20,
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
  description: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  bodyText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  mutedText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  historyItem: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 12,
    paddingTop: 12,
  },
  historyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
});
