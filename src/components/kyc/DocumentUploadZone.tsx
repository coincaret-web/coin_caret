"use client";

import React, { useRef } from "react";
import { UploadCloud, CheckCircle2, FileText, X, AlertTriangle } from "lucide-react";
import { KycDocumentType } from "@prisma/client";

interface DocumentUploadZoneProps {
  label: string;
  description: string;
  documentType: KycDocumentType;
  selectedFile: File | null;
  onFileSelected: (file: File | null) => void;
  error?: string | null;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function DocumentUploadZone({
  label,
  description,
  documentType,
  selectedFile,
  onFileSelected,
  error,
}: DocumentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert("File size exceeds the 10 MB limit.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] || null;
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert("File size exceeds the 10 MB limit.");
      return;
    }

    onFileSelected(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label} <span className="text-rose-400">*</span>
        </label>
        <span className="text-[11px] text-slate-400">JPG, PNG, PDF (Max 10MB)</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {selectedFile ? (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 flex items-center justify-between transition-all">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-slate-200 truncate">{selectedFile.name}</p>
              <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
            <span className="inline-flex items-center text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Attached
            </span>
            <button
              type="button"
              onClick={() => {
                onFileSelected(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`p-6 rounded-xl border-2 border-dashed ${
            error
              ? "border-rose-500/50 bg-rose-500/5"
              : "border-slate-800 hover:border-amber-500/50 bg-slate-950/50 hover:bg-slate-900/50"
          } text-center cursor-pointer transition-all duration-200 group`}
        >
          <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-amber-400 mx-auto mb-2 transition-colors" />
          <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
            Click to upload or drag & drop
          </p>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
