import { Linking, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { getPublicEnv } from "@/lib/env";
import { theme } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

export default function PricingScreen() {
  const { currentUser, plan } = useApp();
  const env = getPublicEnv();

  return (
    <Screen scrollable>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Pricing</Text>
        <Text style={styles.title}>Free for quick drafts. Pro for serious output.</Text>
        <Text style={styles.description}>
          The mobile app reflects your current plan and routes upgrades to the web checkout.
        </Text>
      </View>

      {(plan?.available_plans ?? []).filter((item) => item.code !== "team").map((item) => (
        <Card key={item.code}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.priceText}>
            {item.price === 0 ? "0" : `INR ${item.price}`}/{item.billing_cycle}
          </Text>
          {item.features.map((feature) => (
            <Text key={feature.key} style={styles.featureText}>
              {feature.included ? "Included" : "Locked"}: {feature.label}
            </Text>
          ))}
        </Card>
      ))}

      <Button
        title={currentUser?.can_use_pro_features ? "You're already on Pro" : "Open web upgrade page"}
        onPress={() => void Linking.openURL(env.EXPO_PUBLIC_WEB_APP_URL)}
        disabled={currentUser?.can_use_pro_features}
      />
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
  description: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 24,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  priceText: {
    color: theme.colors.accent,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  featureText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
});
