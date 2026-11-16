import React, { useRef, useState } from "react";
import type { CapturedPhoto } from "../../types";
import { generateSampleKnobPhotos } from "../../lib/samplePartLoader";
import {
  UploadCloud,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ArrowRight,
  Info,
} from "lucide-react";

interface CaptureScreenProps {
  photos: CapturedPhoto[];
  onPhotosChange: (photos: CapturedPhoto[]) => void;
  onContinue: () => void;
}

export const CaptureScreen: React.FC<CaptureScreenProps> = ({
  photos,
  onPhotosChange,
  onContinue,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (files: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: CapturedPhoto[] = [];
    const allowedTypes = ["image/jpeg", "image/png"];
    const maxSizeBytes = 15 * 1024 * 1024; // 15MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check mime type and extension
      const isPngOrJpg =
        allowedTypes.includes(file.type) ||
        /\.(png|jpe?g)$/i.test(file.name);

      if (!isPngOrJpg) {
        setErrorMessage(
          `"${file.name}" was skipped. Only PNG and JPEG photos are supported.`
        );
        continue;
      }

      if (file.size > maxSizeBytes) {
        setErrorMessage(
          `"${file.name}" exceeds the 15MB size limit.`
        );
        continue;
      }

      validFiles.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type || "image/jpeg",
      });
    }

    if (validFiles.length === 0) return;

    const totalAllowed = 6;
    const combined = [...photos, ...validFiles];

    if (combined.length > totalAllowed) {
      setErrorMessage(`Maximum 6 photos allowed. Only the first ${totalAllowed} were retained.`);
      onPhotosChange(combined.slice(0, totalAllowed));
    } else {
      onPhotosChange(combined);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = ""; // Reset input
    }
  };

  const handleRemovePhoto = (id: string) => {
    const photoToRemove = photos.find((p) => p.id === id);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.previewUrl);
    }
    onPhotosChange(photos.filter((p) => p.id !== id));
    setErrorMessage(null);
  };

  const handleStartReplace = (index: number) => {
    replaceIndexRef.current = index;
    if (replaceInputRef.current) {
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = replaceIndexRef.current;
    if (index === null || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const allowedTypes = ["image/jpeg", "image/png"];
    const isPngOrJpg =
      allowedTypes.includes(file.type) || /\.(png|jpe?g)$/i.test(file.name);

    if (!isPngOrJpg) {
      setErrorMessage(`Replacement file must be a PNG or JPEG image.`);
      return;
    }

    // Revoke old URL
    URL.revokeObjectURL(photos[index].previewUrl);

    const updated = [...photos];
    updated[index] = {
      id: `replace-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type || "image/jpeg",
    };

    onPhotosChange(updated);
    replaceIndexRef.current = null;
    e.target.value = "";
  };

  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    setErrorMessage(null);
    try {
      const samplePhotos = await generateSampleKnobPhotos();
      onPhotosChange(samplePhotos);
    } catch {
      setErrorMessage("Could not load sample photos.");
    } finally {
      setIsLoadingSample(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasMinimumPhotos = photos.length >= 3;
  const countColor =
    photos.length >= 3
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : "text-amber-400 border-amber-500/30 bg-amber-500/10";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 w-full">
      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/png,image/jpeg"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceFile}
        accept="image/png,image/jpeg"
        className="hidden"
      />

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#2b2e37] gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f4f4f6]">
            Capture Broken Part
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#9ea3b0]">
            Upload 3 to 6 photos from multiple angles (top, underside, profile) with a coin or ruler for scale.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={isLoadingSample}
            className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md bg-[#212329] text-amber-400 hover:bg-[#2b2e37] border border-amber-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSample ? "animate-spin" : ""}`} />
            <span>{isLoadingSample ? "Loading..." : "Load Sample Part"}</span>
          </button>

          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono border ${countColor}`}>
            {hasMinimumPhotos ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Info className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>
              {photos.length}/6 photos ({photos.length < 3 ? `need ${3 - photos.length} more` : "ready"})
            </span>
          </span>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-md bg-red-950/40 border border-red-500/30 flex items-center space-x-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Drop Zone (when photos < 6) */}
      {photos.length < 6 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-6 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-amber-500 bg-amber-500/10"
              : "border-[#2b2e37] bg-[#18191e] hover:border-amber-500/40 hover:bg-[#1a1c22]"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-[#212329] border border-[#2b2e37] flex items-center justify-center text-amber-500">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#f4f4f6]">
                Drop photos here, or <span className="text-amber-400 underline underline-offset-2">browse</span>
              </p>
              <p className="text-xs text-[#9ea3b0] mt-1 font-mono">
                PNG or JPEG • 3 to 6 photos • Max 15MB each
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9ea3b0]">
              Captured Photos ({photos.length})
            </h2>
            {photos.length > 0 && (
              <button
                type="button"
                onClick={() => onPhotosChange([])}
                className="text-[11px] text-[#9ea3b0] hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative rounded-lg border border-[#2b2e37] bg-[#18191e] overflow-hidden flex flex-col hover:border-[#3e424f] transition-all"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-4/3 bg-[#121316] overflow-hidden flex items-center justify-center">
                  <img
                    src={photo.previewUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-[#121316]/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono font-medium text-amber-400 border border-[#2b2e37]">
                    #{index + 1}
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleStartReplace(index)}
                      title="Replace photo"
                      className="p-1 rounded bg-[#18191e]/90 text-[#9ea3b0] hover:text-amber-400 border border-[#2b2e37] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      title="Remove photo"
                      className="p-1 rounded bg-[#18191e]/90 text-[#9ea3b0] hover:text-red-400 border border-[#2b2e37] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Photo Metadata */}
                <div className="p-2.5 flex items-center justify-between text-xs">
                  <span className="truncate max-w-[180px] font-medium text-[#f4f4f6]" title={photo.name}>
                    {photo.name}
                  </span>
                  <span className="text-[11px] font-mono text-[#9ea3b0] shrink-0 ml-2">
                    {formatFileSize(photo.size)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Step Actions */}
      <div className="mt-8 pt-6 border-t border-[#2b2e37] flex items-center justify-between">
        <div className="text-xs text-[#9ea3b0]">
          {!hasMinimumPhotos && (
            <span>Add at least {3 - photos.length} more {photos.length === 2 ? "photo" : "photos"} to proceed to Analyse.</span>
          )}
          {hasMinimumPhotos && (
            <span className="text-emerald-400">Ready for hybrid triage and template identification.</span>
          )}
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={!hasMinimumPhotos}
          className={`inline-flex items-center space-x-2 px-5 py-2 text-xs font-semibold rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
            hasMinimumPhotos
              ? "bg-[#f59e0b] text-[#121316] hover:bg-[#d97706] cursor-pointer shadow-sm"
              : "bg-[#212329] text-[#6b7280] border border-[#2b2e37] cursor-not-allowed"
          }`}
        >
          <span>Proceed to Analyse</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
