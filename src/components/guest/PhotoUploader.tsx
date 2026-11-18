'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Image, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import imageCompression from 'browser-image-compression';

interface PhotoUploaderProps {
  weddingId: string;
  guestId: string;
  sessionToken: string;
  onClose: () => void;
  onUploadComplete?: () => void;
}

interface QueuedPhoto {
  id: string;
  file: File;
  preview: string;
  caption: string;
  status: 'pending' | 'compressing' | 'uploading' | 'complete' | 'error';
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;
const THUMBNAIL_MAX_DIMENSION = 400;
const THUMBNAIL_QUALITY = 0.7;

export function PhotoUploader({
  weddingId,
  guestId,
  sessionToken,
  onClose,
  onUploadComplete,
}: PhotoUploaderProps) {
  const [queue, setQueue] = useState<QueuedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = useCallback(
    async (file: File, maxDimension: number, quality: number): Promise<Blob> => {
      const options = {
        maxSizeMB: (maxDimension * maxDimension * 4) / (1024 * 1024), // Rough estimate
        maxWidthOrHeight: maxDimension,
        useWebWorker: true,
        initialQuality: quality,
        alwaysKeepResolution: true,
      };

      try {
        const compressedFile = await imageCompression(file, options);
        // Convert File to Blob
        return compressedFile as unknown as Blob;
      } catch (error) {
        console.error('Compression failed, falling back to canvas:', error);
        // Fallback to canvas-based compression
        return new Promise((resolve, reject) => {
          const img = document.createElement('img');
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context not available'));

            let { width, height } = img;
            if (width > height) {
              if (width > maxDimension) {
                height = (height * maxDimension) / width;
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = (width * maxDimension) / height;
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Compression failed'));
              },
              'image/jpeg',
              quality
            );
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(file);
        });
      }
    },
    []
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newItems: QueuedPhoto[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          newItems.push({
            id: crypto.randomUUID(),
            file,
            preview: '',
            caption: '',
            status: 'error',
            progress: 0,
            error: `File too large (max 10MB)`,
          });
          continue;
        }

        const id = crypto.randomUUID();
        const preview = URL.createObjectURL(file);

        newItems.push({
          id,
          file,
          preview,
          caption: '',
          status: 'pending',
          progress: 0,
        });
      }
      setQueue((prev) => [...prev, ...newItems]);
    },
    []
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      e.target.value = '';
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const updateCaption = useCallback((id: string, caption: string) => {
    setQueue((prev) =>
      prev.map((p) => (p.id === id ? { ...p, caption } : p))
    );
  }, []);

  const uploadPhoto = useCallback(
    async (item: QueuedPhoto) => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

      try {
        // Step 1: Compress main image
        setQueue((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: 'compressing', progress: 10 } : p
          )
        );

        let mainBlob: Blob;
        let thumbBlob: Blob;

        if (item.file.type.startsWith('image/')) {
          mainBlob = await compressImage(item.file, MAX_DIMENSION, JPEG_QUALITY);
          thumbBlob = await compressImage(item.file, THUMBNAIL_MAX_DIMENSION, THUMBNAIL_QUALITY);
        } else {
          // For videos, just use as-is
          mainBlob = item.file;
          thumbBlob = item.file;
        }

        // Step 2: Get signed upload URL
        setQueue((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: 'uploading', progress: 30 } : p
          )
        );

        const ext = item.file.name.split('.').pop() || 'jpg';
        const fileName = `${item.id}.${ext}`;

        const uploadUrlRes = await fetch(
          `/api/weddings/${weddingId}/guest/upload`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName,
              mimeType: mainBlob.type || item.file.type,
              fileSize: mainBlob.size,
            }),
          }
        );

        if (!uploadUrlRes.ok) {
          const err = await uploadUrlRes.json().catch(() => ({ message: 'Failed' }));
          throw new Error(err.message || 'Failed to get upload URL');
        }

        const { uploadUrl, storagePath, publicUrl, token } = await uploadUrlRes.json();

        setQueue((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, progress: 50 } : p
          )
        );

        // Step 3: Upload to Supabase Storage
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: mainBlob,
          headers: {
            'Content-Type': mainBlob.type,
            'x-upsert': 'true',
          },
        });

        if (!uploadRes.ok) throw new Error('Failed to upload file');

        // Step 4: Upload thumbnail
        const thumbExt = 'jpg';
        const thumbFileName = `${item.id}_thumb.${thumbExt}`;

        const thumbUploadUrlRes = await fetch(
          `/api/weddings/${weddingId}/guest/upload`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: thumbFileName,
              mimeType: 'image/jpeg',
              fileSize: thumbBlob.size,
            }),
          }
        );

        if (!thumbUploadUrlRes.ok) {
          const err = await thumbUploadUrlRes.json().catch(() => ({ message: 'Failed' }));
          throw new Error(err.message || 'Failed to get thumbnail upload URL');
        }

        const { uploadUrl: thumbUploadUrl, storagePath: thumbStoragePath } =
          await thumbUploadUrlRes.json();

        const thumbUploadRes = await fetch(thumbUploadUrl, {
          method: 'PUT',
          body: thumbBlob,
          headers: {
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true',
          },
        });

        if (!thumbUploadRes.ok) throw new Error('Failed to upload thumbnail');

        // Step 5: Complete upload - create photo record
        setQueue((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, progress: 80 } : p
          )
        );

        const completeRes = await fetch(
          `/api/weddings/${weddingId}/guest/upload`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              storagePath,
              width: mainBlob.type.startsWith('image/') ? MAX_DIMENSION : undefined,
              height: mainBlob.type.startsWith('image/') ? MAX_DIMENSION : undefined,
              fileSize: mainBlob.size,
              mimeType: mainBlob.type,
              caption: item.caption,
            }),
          }
        );

        if (!completeRes.ok) {
          const err = await completeRes.json().catch(() => ({ message: 'Failed' }));
          throw new Error(err.message || 'Failed to complete upload');
        }

        setQueue((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: 'complete', progress: 100 } : p
          )
        );

        onUploadComplete?.();

        // Remove from queue after delay
        setTimeout(() => {
          removeFromQueue(item.id);
        }, 1000);
      } catch (error) {
        console.error('Upload error:', error);
        setQueue((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : p
          )
        );
      }
    },
    [weddingId, compressImage, removeFromQueue, onUploadComplete]
  );

  const processQueue = useCallback(() => {
    const pendingItems = queue.filter(
      (p) => p.status === 'pending' || p.status === 'error'
    );
    pendingItems.forEach((item) => uploadPhoto(item));
  }, [queue, uploadPhoto]);

  useEffect(() => {
    processQueue();
  }, [processQueue]);

  const hasPending = queue.some((p) => p.status !== 'complete');
  const allComplete = queue.length > 0 && queue.every((p) => p.status === 'complete');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="uploader-title"
    >
      <div
        className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 id="uploader-title" className="text-lg font-semibold text-[var(--color-primary)]">
            Upload Photos
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-muted)] transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={clsx(
            'relative border-2 border-dashed rounded-[var(--radius-lg)] p-8 text-center transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
            isDragging
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
          )}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Drop zone for photo upload"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-hidden="true"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-[var(--color-primary)]/10">
              <Image className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
            <p className="font-medium text-[var(--color-primary)]">
              Drag & drop photos here, or click to browse
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Max 10MB per file • JPEG, PNG, WebP, HEIC, MP4
            </p>
          </div>
        </div>

        {/* Upload Queue */}
        {queue.length > 0 && (
          <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
            <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs">
                {queue.length} photo{queue.length !== 1 ? 's' : ''}
              </span>
            </h3>

            {queue.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  'relative p-3 rounded-[var(--radius-lg)] border transition-colors',
                  item.status === 'error'
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                    : 'border-[var(--color-border)] bg-[var(--color-muted)]/30'
                )}
              >
                <div className="flex gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-[var(--radius-md)] overflow-hidden">
                    {item.preview && (
                      <img
                        src={item.preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {item.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    {item.status === 'complete' && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                    )}
                    {item.status === 'error' && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <input
                        type="text"
                        value={item.caption}
                        onChange={(e) => updateCaption(item.id, e.target.value)}
                        placeholder="Add a caption..."
                        className="w-full px-2 py-1 text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] rounded text-[var(--color-primary)] placeholder:text-[var(--color-muted-foreground)]"
                        disabled={item.status === 'uploading' || item.status === 'compressing'}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          {(item.file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <button
                          onClick={() => removeFromQueue(item.id)}
                          className="p-1 rounded hover:bg-[var(--color-muted)] transition-colors text-[var(--color-muted-foreground)]"
                          aria-label="Remove from queue"
                          disabled={item.status === 'uploading' || item.status === 'compressing'}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {item.status === 'compressing' || item.status === 'uploading' ? (
                      <div className="mt-2 h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-primary)] transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    ) : null}

                    {item.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1">{item.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              {hasPending && (
                <button
                  onClick={processQueue}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-medium flex items-center justify-center gap-2"
                  disabled={queue.some((p) => p.status === 'uploading' || p.status === 'compressing')}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Upload All
                </button>
              )}

              {allComplete && (
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] border-2 border-[var(--color-border)] text-[var(--color-muted-foreground)] font-medium hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}