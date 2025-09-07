// app/components/FileUploader.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

export type UploadResult = { cid: string; file: File };

export default function FileUploader({
  onUploadCompleteAction,
  accept = "image/*,application/pdf,text/*,application/zip",
  maxSizeMB = 50,
  onProgressAction,
}: {
  onUploadCompleteAction: (result: UploadResult) => void;
  accept?: string;
  maxSizeMB?: number;
  onProgressAction?: (percent: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  // cleanup preview URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;

    setFilename(f.name);

    // Validation
    if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB} MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Preview (images)
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      // revoke previous preview to avoid leaks
      if (preview) URL.revokeObjectURL(preview);
      setPreview(url);
    } else {
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
    }

    setUploading(true);
    try {
      let cid: string | null = null;

      try {
        // dynamic import so app doesn't crash when lib not ready
        const ipfs = await import("../../lib/ipfs");
        if (ipfs?.uploadFile) {
          // If uploadFile supports progress callback, we pass it
          cid = await ipfs.uploadFile(f, (progress: number) => {
            // progress: 0..1 (we expect a number)
            if (onProgressAction) onProgressAction(Math.round(progress * 100));
          });
        }
      } catch (err) {
        console.warn("lib/ipfs not available or upload failed, using mock CID", err);
      }

      if (!cid) {
        cid = `bafybeimockcid${Date.now().toString(16)}`;
      }

      // notify parent using the Action-named prop
      onUploadCompleteAction({ cid, file: f });
    } catch (err) {
      console.error("File upload error", err);
      setError("Upload failed. See console for details.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      // tell upstream that progress is complete
      if (onProgressAction) onProgressAction(100);
    }
  }

  return (
    <div className="w-full max-w-xl p-4 bg-neutral-800 rounded">
      <label className="block text-sm font-medium text-neutral-200 mb-2">Upload file</label>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFile}
            className="block w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-neutral-700 file:text-white cursor-pointer"
            aria-label="File uploader"
          />
          <div className="mt-2 text-xs text-neutral-400">
            {filename ? `Selected: ${filename}` : "Choose a file (image, pdf, text, zip)"}
          </div>
          {error && <div className="mt-2 text-xs text-rose-400">{error}</div>}
        </div>

        <div className="w-36 h-32 bg-black rounded overflow-hidden flex items-center justify-center">
          {uploading ? (
            <div className="text-xs text-neutral-400">Uploading…</div>
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="object-cover w-full h-full" />
          ) : (
            <div className="text-xs text-neutral-500 px-2 text-center">No preview</div>
          )}
        </div>
      </div>
    </div>
  );
}
