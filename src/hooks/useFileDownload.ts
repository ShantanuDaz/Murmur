import { useState, useCallback } from "react";

export type DownloadableContent =
  | string
  | Blob
  | File
  | ArrayBuffer
  | Uint8Array
  | Record<string, unknown>;

export interface DownloadOptions {
  filename: string;
  mimeType?: string;
}

export const useFileDownload = () => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadFile = useCallback(
    async (
      content: DownloadableContent,
      filenameOrOptions: string | DownloadOptions,
      optionalMimeType?: string,
    ): Promise<boolean> => {
      setIsDownloading(true);
      setError(null);

      try {
        const filename =
          typeof filenameOrOptions === "string"
            ? filenameOrOptions
            : filenameOrOptions.filename;

        const mimeType =
          typeof filenameOrOptions === "object"
            ? filenameOrOptions.mimeType
            : optionalMimeType;

        let blob: Blob;

        if (content instanceof Blob) {
          blob = content;
        } else if (content instanceof File) {
          blob = content;
        } else if (
          content instanceof Uint8Array ||
          content instanceof ArrayBuffer
        ) {
          blob = new Blob([content as unknown as BlobPart], {
            type: mimeType || "application/octet-stream",
          });
        } else if (typeof content === "object") {
          // JSON object
          const jsonString = JSON.stringify(content, null, 2);
          blob = new Blob([jsonString], {
            type: mimeType || "application/json;charset=utf-8",
          });
        } else if (typeof content === "string") {
          // If it's a remote URL or data URL
          if (content.startsWith("http://") || content.startsWith("https://")) {
            const res = await fetch(content);
            blob = await res.blob();
          } else {
            // Plain text or CSV or custom string
            blob = new Blob([content], {
              type: mimeType || "text/plain;charset=utf-8",
            });
          }
        } else {
          throw new Error("Unsupported content type for file download");
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsDownloading(false);
        return true;
      } catch (err) {
        console.error("Failed to download file:", err);
        const e = err instanceof Error ? err : new Error("Download failed");
        setError(e);
        setIsDownloading(false);
        return false;
      }
    },
    [],
  );

  return { downloadFile, isDownloading, error };
};

export default useFileDownload;
