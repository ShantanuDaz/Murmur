import { useState, useCallback, useEffect } from "react";

export interface UseCopyToClipboardOptions {
  timeout?: number;
}

export const useCopyToClipboard = (options: UseCopyToClipboardOptions = {}) => {
  const { timeout = 2000 } = options;
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), timeout);
    return () => clearTimeout(timer);
  }, [copied, timeout]);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!text) return false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!successful) throw new Error("Fallback copy command failed");
      }
      setCopied(true);
      setError(null);
      return true;
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      const e = err instanceof Error ? err : new Error("Failed to copy");
      setError(e);
      setCopied(false);
      return false;
    }
  }, []);

  return { copy, copied, error };
};

export default useCopyToClipboard;
