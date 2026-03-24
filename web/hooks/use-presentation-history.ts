"use client";

import { useCallback, useEffect, useState } from "react";

import {
  type PresentationDetail,
  type PresentationSummary,
  getPresentation,
  getPresentations,
} from "@/lib/api/backend";

export function usePresentationHistory(accessToken: string | null) {
  const [items, setItems] = useState<PresentationSummary[]>([]);
  const [selectedPresentation, setSelectedPresentation] =
    useState<PresentationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setSelectedPresentation(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getPresentations(accessToken);
      setItems(response.data.items);
      if (response.data.items.length === 0) {
        setSelectedPresentation(null);
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to load presentation history.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const selectPresentation = useCallback(
    async (presentationId: string) => {
      if (!accessToken) {
        return;
      }

      setDetailLoading(true);
      setError(null);
      try {
        const response = await getPresentation(accessToken, presentationId);
        setSelectedPresentation(response.data);
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Failed to load the presentation preview.",
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    selectedPresentation,
    loading,
    detailLoading,
    error,
    refresh,
    selectPresentation,
  };
}
