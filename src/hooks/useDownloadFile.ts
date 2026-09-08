import { useCallback } from "react";

export type DownloadableData =
  | Blob
  | File
  | string
  | ArrayBuffer
  | Uint8Array
  | BlobPart[];

/**
 * Global hook to trigger a file download in the browser.
 * Supports strings (JSON, text, CSV), binary (ArrayBuffer, Uint8Array), Blobs, and Files.
 */
export function useDownloadFile() {
  const downloadFile = useCallback(
    (
      filename: string,
      data: DownloadableData,
      mimeType = "application/octet-stream",
    ) => {
      try {
        let blob: Blob;

        if (data instanceof Blob) {
          blob = data;
        } else if (Array.isArray(data)) {
          blob = new Blob(data, { type: mimeType });
        } else {
          blob = new Blob([data as unknown as BlobPart], { type: mimeType });
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      } catch (err) {
        console.error("Failed to download file:", err);
        return false;
      }
    },
    [],
  );

  return { downloadFile };
}
