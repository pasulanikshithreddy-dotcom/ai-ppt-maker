import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { StatusBanner } from "@/components/ui/status-banner";
import {
  type GenerationResult,
  type TemplateDefinition,
  generateNotes,
  generateTopic,
} from "@/lib/api";
import { theme } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

type CreateMode = "topic" | "notes";

export default function CreateScreen() {
  const { accessToken, currentUser, plan, refreshAccount, templates } = useApp();
  const [mode, setMode] = useState<CreateMode>("topic");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Study");
  const [tone, setTone] = useState("focused");
  const [topicSlides, setTopicSlides] = useState("8");
  const [notes, setNotes] = useState("");
  const [notesTitle, setNotesTitle] = useState("");
  const [notesTopic, setNotesTopic] = useState("");
  const [notesSlides, setNotesSlides] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const isPaid = currentUser?.can_use_pro_features ?? plan?.is_paid ?? false;

  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      const nextTemplate =
        templates.find((item) => (isPaid ? true : !item.is_pro)) ?? templates[0];
      setSelectedTemplateId(nextTemplate.id);
    }
  }, [isPaid, selectedTemplateId, templates]);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  function handleTemplatePress(template: TemplateDefinition) {
    if (template.is_pro && !isPaid) {
      setUpgradePrompt(`Template "${template.name}" is available only on Pro.`);
      return;
    }
    setSelectedTemplateId(template.id);
    setUpgradePrompt(null);
  }

  async function handleGenerate() {
    if (!accessToken || !currentUser || !selectedTemplate) {
      setError("Sign in and choose a template before generating.");
      return;
    }

    if (mode === "notes" && !isPaid) {
      setUpgradePrompt("Notes to PPT is available only on Pro.");
      return;
    }

    if (selectedTemplate.is_pro && !isPaid) {
      setUpgradePrompt(`Template "${selectedTemplate.name}" is available only on Pro.`);
      return;
    }

    setLoading(true);
    setError(null);
    setUpgradePrompt(null);

    try {
      let response;
      if (mode === "topic") {
        response = await generateTopic(accessToken, {
          topic,
          subject,
          tone,
          slide_count: Number(topicSlides) || 8,
          user_id: currentUser.id,
          template_id: selectedTemplate.id,
        });
      } else {
        response = await generateNotes(accessToken, {
          notes,
          title: notesTitle || undefined,
          topic: notesTopic || undefined,
          slide_count: Number(notesSlides) || 10,
          user_id: currentUser.id,
          template_id: selectedTemplate.id,
        });
      }

      setResult(response.data);
      await refreshAccount();
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Generation failed.";
      setError(message);
      if (message.toLowerCase().includes("pro")) {
        setUpgradePrompt(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scrollable>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Create</Text>
        <Text style={styles.title}>Generate a deck from a topic or notes.</Text>
        <Text style={styles.description}>
          Topic to PPT works on Free. Notes to PPT and premium templates unlock with Pro.
        </Text>
      </View>

      <View style={styles.tabRow}>
        <Button
          title="Topic"
          variant={mode === "topic" ? "primary" : "ghost"}
          onPress={() => setMode("topic")}
          style={styles.tabButton}
        />
        <Button
          title="Notes"
          variant={mode === "notes" ? "primary" : "ghost"}
          onPress={() => {
            setMode("notes");
            if (!isPaid) {
              setUpgradePrompt("Notes to PPT is available only on Pro.");
            }
          }}
          style={styles.tabButton}
        />
      </View>

      {error ? <StatusBanner tone="danger" title="Generation failed" description={error} /> : null}
      {upgradePrompt ? (
        <StatusBanner tone="warning" title="Upgrade required" description={upgradePrompt} />
      ) : null}

      {mode === "topic" ? (
        <>
          <Field label="Topic" value={topic} onChangeText={setTopic} placeholder="AI study habits" />
          <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="Study" />
          <Field label="Tone" value={tone} onChangeText={setTone} placeholder="focused" />
          <Field
            label="Slide count"
            value={topicSlides}
            onChangeText={setTopicSlides}
            keyboardType="number-pad"
          />
        </>
      ) : (
        <>
          <Field
            label="Optional title"
            value={notesTitle}
            onChangeText={setNotesTitle}
            placeholder="Research summary"
          />
          <Field
            label="Optional topic"
            value={notesTopic}
            onChangeText={setNotesTopic}
            placeholder="Research"
          />
          <Field
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Paste or type notes here"
            multiline
          />
          <Field
            label="Slide count"
            value={notesSlides}
            onChangeText={setNotesSlides}
            keyboardType="number-pad"
          />
        </>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Choose a template</Text>
        <View style={styles.templateList}>
          {templates.map((template) => (
            <Pressable
              key={template.id}
              onPress={() => handleTemplatePress(template)}
              style={[
                styles.templateCard,
                selectedTemplateId === template.id && styles.templateCardActive,
              ]}
            >
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateMeta}>
                {template.is_pro ? "Pro" : "Free"} • {template.theme.font_family}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Button
        title={loading ? "Generating..." : "Generate presentation"}
        onPress={() => void handleGenerate()}
        disabled={loading}
      />

      <Card>
        <Text style={styles.sectionTitle}>Preview</Text>
        {!result ? (
          <Text style={styles.mutedText}>
            Run a generation to preview the title, outline, and download link here.
          </Text>
        ) : (
          <View style={styles.previewBlock}>
            <Text style={styles.previewTitle}>
              {result.content?.presentation_title ?? result.presentation.title}
            </Text>
            <Text style={styles.mutedText}>
              {result.presentation.watermark_applied ? "Watermarked" : "No watermark"} •{" "}
              {result.presentation.template_name}
            </Text>
            {(result.content?.slides ?? []).map((slide, index) => (
              <View key={`${slide.title}-${index}`} style={styles.previewItem}>
                <Text style={styles.previewItemTitle}>
                  {index + 1}. {slide.title}
                </Text>
                {slide.bullets.map((bullet) => (
                  <Text key={bullet} style={styles.mutedText}>
                    • {bullet}
                  </Text>
                ))}
              </View>
            ))}
            {result.presentation.file_url ? (
              <Button
                title="Open download link"
                variant="secondary"
                onPress={() => void Linking.openURL(result.presentation.file_url!)}
              />
            ) : null}
          </View>
        )}
      </Card>
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
  tabRow: {
    flexDirection: "row",
    gap: 12,
  },
  tabButton: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  templateList: {
    gap: 10,
  },
  templateCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 14,
    backgroundColor: theme.colors.surface,
  },
  templateCardActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surfaceStrong,
  },
  templateName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  templateMeta: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  previewBlock: {
    gap: 12,
  },
  previewTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  previewItem: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  previewItemTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  mutedText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
});
