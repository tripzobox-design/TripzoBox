import React, { useRef, useState } from 'react';
import { Camera, UploadCloud, X, FileText } from 'lucide-react';

export interface DropzoneProps {
  label?: string;
  subtext?: string;
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (fileUrls: string[]) => void;
  previewUrls?: string[];
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  label = 'Add photos or videos',
  subtext = 'Drag and drop or click to upload',
  accept = 'image/*',
  multiple = true,
  onFilesSelected,
  previewUrls = [],
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previews, setPreviews] = useState<string[]>(previewUrls);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      urls.push(objectUrl);
    }
    const updated = multiple ? [...previews, ...urls] : urls;
    setPreviews(updated);
    onFilesSelected(updated);
  };

  const handleRemove = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onFilesSelected(updated);
  };

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 text-center select-none
          ${
            isDragOver
              ? 'border-primary bg-accent/20 scale-[0.99]'
              : 'border-border hover:border-primary/60 hover:bg-light-bg'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-full bg-accent/30 text-primary flex items-center justify-center mb-3">
          <Camera className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-text">{label}</p>
        <p className="text-xs text-text-muted mt-1">{subtext}</p>
      </div>

      {/* Thumbnails preview */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-1">
          {previews.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-video sm:aspect-square rounded-xl overflow-hidden border border-border group bg-gray-50"
            >
              <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-text/70 text-white hover:bg-text transition-colors"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
