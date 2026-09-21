import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  File,
  Link2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileTypeInfo(attachment) {
  if (!attachment) return { category: "other", ext: "", label: "File", icon: <File size={16} /> };

  if (attachment.type === "link") {
    return {
      category: "link",
      ext: "link",
      label: "Web Link",
      icon: <Link2 size={16} className="text-blue-500" />,
    };
  }

  const filename = attachment.originalName || attachment.label || attachment.url || "";
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : "";
  const mime = (attachment.mimeType || "").toLowerCase();

  // Images
  if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)
  ) {
    return {
      category: "image",
      ext,
      label: ext.toUpperCase() || "IMAGE",
      icon: <ImageIcon size={16} className="text-emerald-500" />,
    };
  }

  // PDF
  if (mime === "application/pdf" || ext === "pdf") {
    return {
      category: "pdf",
      ext: "pdf",
      label: "PDF",
      icon: <FileText size={16} className="text-rose-500" />,
    };
  }

  // Word documents
  if (
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessingml") ||
    ["doc", "docx", "odt", "rtf"].includes(ext)
  ) {
    return {
      category: "word",
      ext,
      label: ext.toUpperCase() || "DOCX",
      icon: <FileText size={16} className="text-blue-600" />,
    };
  }

  // Code & Text & CSV & Data files (previewable in monospaced viewer)
  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/xml" ||
    mime === "text/csv" ||
    ["txt", "md", "json", "xml", "log", "js", "jsx", "ts", "tsx", "css", "html", "yml", "yaml", "sh", "sql", "csv"].includes(ext)
  ) {
    return {
      category: "text",
      ext: ext || "txt",
      label: ext.toUpperCase() || "TEXT",
      icon: <FileCode size={16} className="text-amber-600" />,
    };
  }

  // Spreadsheets / Excel (non-csv)
  if (
    mime.includes("excel") ||
    mime.includes("spreadsheet") ||
    ["xls", "xlsx", "ods"].includes(ext)
  ) {
    return {
      category: "spreadsheet",
      ext,
      label: ext.toUpperCase() || "SHEET",
      icon: <FileSpreadsheet size={16} className="text-emerald-600" />,
    };
  }

  // Archives
  if (
    mime.includes("zip") ||
    mime.includes("compressed") ||
    ["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)
  ) {
    return {
      category: "archive",
      ext,
      label: ext.toUpperCase() || "ZIP",
      icon: <FileArchive size={16} className="text-purple-600" />,
    };
  }

  return {
    category: "other",
    ext,
    label: ext.toUpperCase() || "FILE",
    icon: <File size={16} className="text-muted" />,
  };
}

export default function AttachmentPreviewModal({ isOpen, onClose, attachment }) {
  const [textContent, setTextContent] = useState(null);
  const [loadingText, setLoadingText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fileInfo = getFileTypeInfo(attachment);
  const isServerFile = attachment?.url?.startsWith("/uploads");
  const fullUrl = isServerFile
    ? `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "") : "http://localhost:5000"}${attachment.url}`
    : attachment?.url;

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch text file content for preview if text/csv/json/md
  useEffect(() => {
    if (!isOpen || !attachment || fileInfo.category !== "text") {
      setTextContent(null);
      return;
    }

    let isMounted = true;
    setLoadingText(true);

    fetch(fullUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load text content");
        return res.text();
      })
      .then((text) => {
        if (isMounted) {
          setTextContent(text);
          setLoadingText(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setTextContent(null);
          setLoadingText(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, attachment, fullUrl, fileInfo.category]);

  if (!isOpen || !attachment) return null;

  const handleCopyLink = () => {
    if (fullUrl) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const displayName = attachment.label || attachment.originalName || attachment.url;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Attachment preview"
      className="fixed inset-0 z-[80] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 md:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-line rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-pop overflow-hidden text-ink relative animate-in zoom-in-95 duration-150"
      >
        {/* Header Bar */}
        <div className="bg-surface px-4 sm:px-6 py-3.5 border-b border-line flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center shrink-0 shadow-xs">
              {fileInfo.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-sm sm:text-[15px] md:text-base font-bold text-stone-900 !text-stone-900 leading-snug break-words [overflow-wrap:anywhere] line-clamp-2 select-text"
                title={displayName}
              >
                {displayName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted mt-0.5 flex-wrap">
                <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-line text-stone-800 shrink-0">
                  {fileInfo.label}
                </span>
                {attachment.size > 0 && (
                  <span className="shrink-0">{formatFileSize(attachment.size)}</span>
                )}
                {attachment.createdAt && (
                  <span className="shrink-0">• {new Date(attachment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                )}
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-start sm:self-center ml-2">
            {attachment.type === "link" ? (
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy Link"
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-line text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span className="hidden sm:inline">{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>
            ) : (
              <a
                href={fullUrl}
                download={attachment.originalName || displayName}
                target="_blank"
                rel="noreferrer noopener"
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-line text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download file"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}

            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="p-1.5 sm:p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-surface-2 transition-colors cursor-pointer"
              title="Open in new tab"
              aria-label="Open in new tab"
            >
              <ExternalLink size={16} />
            </a>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-surface-2 transition-colors cursor-pointer ml-0.5"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body Container - Scaled & Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 bg-slate-50/50 flex flex-col items-center justify-center">
          {/* 1. Image Preview */}
          {fileInfo.category === "image" && !imgError && (
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <img
                src={fullUrl}
                alt={displayName}
                onError={() => setImgError(true)}
                className="max-w-full max-h-[calc(90vh-140px)] object-contain rounded-xl shadow-sm border border-line bg-white"
              />
            </div>
          )}

          {/* 2. PDF Preview */}
          {fileInfo.category === "pdf" && (
            <div className="w-full h-full flex flex-col min-h-[420px] sm:min-h-[520px]">
              <iframe
                src={`${fullUrl}#toolbar=1&navpanes=0`}
                title={displayName}
                className="w-full flex-1 rounded-xl border border-line bg-white shadow-sm"
              />
            </div>
          )}

          {/* 3. Text / Code / CSV / Markdown Preview */}
          {fileInfo.category === "text" && (
            <div className="w-full max-h-[calc(90vh-140px)] flex flex-col bg-white border border-line rounded-xl shadow-sm overflow-hidden">
              <div className="bg-surface-2 px-4 py-2 border-b border-line flex items-center justify-between text-xs text-muted font-mono">
                <span>{fileInfo.ext.toUpperCase()} PREVIEW</span>
                <span>{textContent ? `${textContent.split("\n").length} lines` : ""}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-ink whitespace-pre-wrap break-words leading-relaxed select-text">
                {loadingText ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-muted">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading preview…</span>
                  </div>
                ) : textContent !== null ? (
                  textContent
                ) : (
                  <div className="text-center py-8 text-muted">
                    <p>Unable to preview plain text directly.</p>
                    <a
                      href={fullUrl}
                      download={attachment.originalName || displayName}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold"
                    >
                      <Download size={14} />
                      <span>Download File</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Non-Previewable Documents (Word, Excel, Zip, etc.) or Image Fallback */}
          {(fileInfo.category === "word" ||
            fileInfo.category === "spreadsheet" ||
            fileInfo.category === "archive" ||
            fileInfo.category === "other" ||
            (fileInfo.category === "image" && imgError)) && (
            <div className="max-w-md w-full bg-white border border-line rounded-2xl p-6 sm:p-8 text-center shadow-sm space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-line mx-auto flex items-center justify-center shadow-inner">
                {fileInfo.icon && <div className="scale-150">{fileInfo.icon}</div>}
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-stone-900 break-words [overflow-wrap:anywhere] leading-snug">{displayName}</h4>
                <p className="text-xs text-muted mt-1">
                  {fileInfo.label} Document {attachment.size > 0 && `• ${formatFileSize(attachment.size)}`}
                </p>
                <p className="text-xs text-muted/80 mt-2 leading-relaxed">
                  Direct in-browser preview is not available for this format. You can download and open it in your desktop application.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <a
                  href={fullUrl}
                  download={attachment.originalName || displayName}
                  className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download size={15} />
                  <span>Download File</span>
                </a>
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-3.5 py-2 bg-surface-2 hover:bg-surface-3 border border-line text-ink rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>Open in Tab</span>
                </a>
              </div>
            </div>
          )}

          {/* 5. Link Preview */}
          {fileInfo.category === "link" && (
            <div className="max-w-md w-full bg-white border border-line rounded-2xl p-6 sm:p-8 text-center shadow-sm space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center shadow-inner">
                <Link2 size={28} className="text-blue-600" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-stone-900 break-words [overflow-wrap:anywhere] leading-snug">{displayName}</h4>
                <p className="text-xs text-blue-600 mt-1 break-all">{fullUrl}</p>
                <p className="text-xs text-muted mt-2">External Web Resource</p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <ExternalLink size={15} />
                  <span>Visit Link</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-surface-2 hover:bg-surface-3 border border-line text-ink rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedLink ? "Copied" : "Copy URL"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
