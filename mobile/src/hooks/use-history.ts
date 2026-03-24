import { useCallback, useEffect, useState } from "react";

import { type PresentationSummary, getPresentations } from "@/lib/api";

export function useHistory(accessToken: string | null) {
  const [items, setItems] = useState<PresentationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getPresentations(accessToken);
      setItems(response.data.items);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to load history.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
