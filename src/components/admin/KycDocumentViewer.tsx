import React from "react";
import { KycDocumentDto, KycDocumentType } from "@/types/user";
import { FileText, ExternalLink, AlertCircle, FileCheck, Shield } from "lucide-react";

interface KycDocumentViewerProps {
  documents?: KycDocumentDto[];
}

const REQUIRED_TYPES: Array<{
  type: KycDocumentType;
  label: string;
  description: string;
}> = [
  {
    type: "SSN_CARD",
    label: "1. Social Security Card",
    description: "Physical SSN Card scan / photo",
  },
  {
    type: "FEDERAL_ID",
    label: "2. Federal Government ID",
    description: "Passport, Military ID, or Federal Credential",
  },
  {
    type: "DRIVING_LICENSE",
    label: "3. State Driver's License",
    description: "State-issued Driver's License (front side)",
  },
];

export function KycDocumentViewer({ documents = [] }: KycDocumentViewerProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
            Identity Documentation (3 Slots)
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Attached: <strong className="text-white">{documents.length} / 3</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REQUIRED_TYPES.map((req) => {
          const doc = documents.find((d) => d.documentType === req.type);

          if (!doc) {
            return (
              <div
                key={req.type}
                className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-400">{req.label}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{req.description}</div>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Not uploaded</span>
                </div>
              </div>
            );
          }

          const uploadDate = new Date(doc.uploadedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={req.type}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between space-y-4 hover:border-cyan-500/30 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white">{req.label}</div>
                  <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                    <FileCheck className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono text-[11px]">
                  <div className="text-slate-200 truncate font-semibold">{doc.originalFileName}</div>
                  <div className="flex justify-between text-slate-400">
                    <span>{doc.mimeType}</span>
                    <span>{formatFileSize(doc.fileSizeBytes)}</span>
                  </div>
                  <div className="text-slate-500 text-[10px] pt-1 border-t border-slate-800">
                    Uploaded: {uploadDate}
                  </div>
                </div>
              </div>

              <a
                href={`/api/admin/kyc/document/${doc.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 text-xs font-semibold transition-colors"
              >
                <span>View Document</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
