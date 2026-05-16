import { useState, useCallback } from 'react';
import { Upload, X, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface ObstaclePhotoUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

/**
 * File drop + preview for obstacle photo upload.
 *
 * - Accepts image files only
 * - Max 5 MB with inline error
 * - Shows thumbnail preview with remove button
 * - Keyboard accessible via hidden file input + visible button
 */
export function ObstaclePhotoUpload({ file: _file, onChange, disabled }: ObstaclePhotoUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = useCallback(
    (selected: File) => {
      setError(null);

      if (!selected.type.startsWith('image/')) {
        setError('Please upload an image file (JPEG, PNG, WebP).');
        return;
      }

      if (selected.size > MAX_SIZE_BYTES) {
        setError(`File too large. Max ${MAX_SIZE_MB} MB allowed.`);
        return;
      }

      onChange(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [disabled, handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile],
  );

  const clear = useCallback(() => {
    onChange(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
  }, [onChange]);

  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="relative rounded-md border border-border overflow-hidden bg-surface-offset">
          <img
            src={previewUrl}
            alt="Obstacle preview"
            className="w-full h-40 object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 bg-surface/80 hover:bg-surface text-text-muted hover:text-status-error"
            onClick={clear}
            aria-label="Remove photo"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-surface-offset p-6 text-center transition-colors hover:border-brand-primary/40 focus-within:border-brand-primary"
        >
          <div className="rounded-full bg-surface p-2">
            <Upload className="h-5 w-5 text-text-muted" aria-hidden="true" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm text-text-primary font-medium">
              Drag & drop or{' '}
              <label className="cursor-pointer text-brand-primary hover:underline focus-within:outline-none focus-within:ring-1 focus-within:ring-brand-primary rounded-sm">
                browse
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleInputChange}
                  disabled={disabled}
                />
              </label>
            </p>
            <p className="text-xs text-text-faint">JPEG, PNG, WebP up to {MAX_SIZE_MB} MB</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-status-error">
          <ImageOff className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  );
}
