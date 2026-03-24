import { Linking, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { StatusBanner } from "@/components/ui/status-banner";
import { useHistory } from "@/hooks/use-history";
import { theme } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

export default function HistoryScreen() {
  const { accessToken } = useApp();
  const { items, loading, error, refresh } = useHistory(accessToken);

  return (
    <Screen scrollable>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>History</Text>
        <Text style={styles.title}>Open saved decks and preview summaries.</Text>
      </View>

      {error ? <StatusBanner tone="danger" title="History failed" description={error} /> : null}

      <Button title="Refresh" variant="secondary" onPress={() => void refresh()} />

      {loading ? <Text style={styles.mutedText}>Loading presentation history...</Text> : null}
      {!loading && items.length === 0 ? (
        <Card>
          <Text style={styles.mutedText}>
            No saved presentations yet. Generate a deck from the Create tab first.
          </Text>
        </Card>
      ) : null}

      {items.map((item) => (
        <Card key={item.id}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.mutedText}>
            {item.source_type.toUpperCase()} • {item.template_name ?? item.template_id}
          </Text>
          <Text style={styles.mutedText}>
            {item.watermark_applied ? "Watermarked export" : "No watermark"}
          </Text>
          <View style={styles.previewGroup}>
            {item.content_preview.map((preview) => (
              <Text key={preview} style={styles.previewItem}>
                • {preview}
              </Text>
            ))}
          </View>
          {item.file_url ? (
            <Button
              title="Open download link"
              variant="ghost"
              onPress={() => void Linking.openURL(item.file_url!)}
            />
          ) : null}
        </Card>
      ))}
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
  cardTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  mutedText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  previewGroup: {
    gap: 6,
    marginTop: 12,
  },
  previewItem: {
    color: theme.colors.text,
    fontSize: 14,
  },
});
