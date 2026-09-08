import { useState, useCallback } from "react";

export interface UseClipboardOptions {
  timeout?: number;
}

export function useClipboard(options: UseClipboardOptions = {}) {
  const { timeout = 2000 } = options;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        setError(new Error("Clipboard API not supported"));
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);
        setTimeout(() => setCopied(false), timeout);
        return true;
      } catch (err) {
        const errorObj =
          err instanceof Error ? err : new Error("Failed to copy");
        setError(errorObj);
        setCopied(false);
        return false;
      }
    },
    [timeout],
  );

  return { copied, copy, error };
}
