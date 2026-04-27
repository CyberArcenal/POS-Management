// src/components/Shared/UpdateNotifier.tsx
import React, { useState, useEffect } from "react";
import { Download, RefreshCw, X, AlertCircle, CheckCircle } from "lucide-react";
import { useUpdater } from "../../hooks/useUpdater";
import Button from "../UI/Button";

const UpdateNotifier: React.FC = () => {
  const { state, updateInfo, progress, error, downloadUpdate, installUpdate } =
    useUpdater();
  const [showModal, setShowModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  // Reset local error when modal opens or state changes
  useEffect(() => {
    if (showModal) {
      setDownloadError(null);
      setInstallError(null);
    }
  }, [showModal]);

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      await downloadUpdate();
    } catch (err: any) {
      setDownloadError(err.message || "Failed to download update");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInstall = async () => {
    setInstallError(null);
    try {
      await installUpdate();
    } catch (err: any) {
      setInstallError(err.message || "Failed to install update");
    }
  };

  // Determine if we should show the notifier button
  if (
    state !== "available" &&
    state !== "downloading" &&
    state !== "downloaded"
  ) {
    return null;
  }

  const getIcon = () => {
    switch (state) {
      case "downloading":
        return <RefreshCw className="icon-sm animate-spin" />;
      default:
        return <Download className="icon-sm" />;
    }
  };

  const getBadge = () => {
    if (state === "available") {
      return (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
          !
        </span>
      );
    }
    if (state === "downloaded") {
      return (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-[10px] text-white flex items-center justify-center">
          ✓
        </span>
      );
    }
    return null;
  };

  // Get status message and color
  const getStatusInfo = () => {
    switch (state) {
      case "available":
        return { message: "New version ready to download", color: "text-blue-400" };
      case "downloading":
        return { message: "Downloading update...", color: "text-blue-400" };
      case "downloaded":
        return { message: "Update ready to install", color: "text-green-400" };
      default:
        return { message: "", color: "" };
    }
  };

  const statusInfo = getStatusInfo();

  // Helper to safely render HTML release notes
  const renderReleaseNotes = () => {
    if (!updateInfo?.releaseNotes) return null;
    
    const notes = updateInfo.releaseNotes;
    const isHtml = /<[a-z][\s\S]*>/i.test(notes);
    
    if (isHtml) {
      return (
        <div 
          className="release-notes-content text-sm text-[var(--text-secondary)] space-y-2"
          dangerouslySetInnerHTML={{ __html: notes }}
        />
      );
    }
    
    return (
      <pre className="text-xs whitespace-pre-wrap font-sans text-[var(--text-secondary)]">
        {notes}
      </pre>
    );
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="relative p-2 rounded-lg hover:bg-[var(--card-secondary-bg)] text-[var(--sidebar-text)] transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Update available"
      >
        {getIcon()}
        {getBadge()}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--card-secondary-bg)] transition-colors"
              aria-label="Close"
            >
              <X className="icon-sm" />
            </button>

            {/* Header with status badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${state === "downloaded" ? "bg-green-500/20" : "bg-blue-500/20"}
              `}>
                {state === "downloaded" ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Download className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--sidebar-text)]">
                  Update Available
                </h2>
                <p className={`text-xs ${statusInfo.color}`}>
                  {statusInfo.message}
                </p>
              </div>
            </div>

            {/* Error display */}
            {(error || downloadError || installError) && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-1 duration-200">
                <AlertCircle className="icon-sm text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-400">
                  {error || downloadError || installError}
                </span>
              </div>
            )}

            {/* Update info */}
            {updateInfo && (
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-lg font-semibold text-[var(--sidebar-text)]">
                    v{updateInfo.version}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Released: {new Date(updateInfo.releaseDate).toLocaleDateString()}
                  </p>
                </div>
                
                {updateInfo.releaseNotes && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-[var(--sidebar-text)] mb-2">
                      What's New:
                    </p>
                    <div className="p-3 bg-[var(--card-secondary-bg)] rounded-lg max-h-64 overflow-y-auto custom-scrollbar">
                      {renderReleaseNotes()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Download progress */}
            {progress && (state === "downloading" || isDownloading) && (
              <div className="mb-4 animate-in fade-in duration-300">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--text-secondary)]">Downloading...</span>
                  <span className="text-[var(--sidebar-text)] font-medium">
                    {Math.round(progress.percent)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--accent-blue)] transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress.percent}%` }}
                  >
                    <div className="h-full w-full animate-pulse bg-white/20" />
                  </div>
                </div>
                {progress.bytesPerSecond && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {Math.round(progress.bytesPerSecond / 1024)} KB/s
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-end mt-6">
              {state === "available" && (
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`
                    btn-primary btn-sm px-5 py-2.5 flex items-center gap-2 font-medium
                    transition-all duration-200 hover:scale-105 active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  `}
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="icon-sm animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="icon-sm" />
                      Download Update
                    </>
                  )}
                </Button>
              )}
              
              {state === "downloaded" && (
                <Button
                  onClick={handleInstall}
                  className="
                    btn-success btn-sm px-5 py-2.5 flex items-center gap-2 font-medium
                    transition-all duration-200 hover:scale-105 active:scale-95
                    bg-gradient-to-r from-green-500 to-emerald-600
                    hover:from-green-600 hover:to-emerald-700
                  "
                >
                  <RefreshCw className="icon-sm" />
                  Install & Restart
                </Button>
              )}
              
              <Button
                onClick={() => setShowModal(false)}
                className="
                  btn-secondary btn-sm px-5 py-2.5 font-medium
                  transition-all duration-200 hover:bg-[var(--card-secondary-bg)]
                "
              >
                Later
              </Button>
            </div>

            {/* Help text */}
            {state === "downloaded" && (
              <p className="text-xs text-[var(--text-tertiary)] mt-4 text-center">
                The application will restart after installation to apply the update.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add keyframe animations for modal transitions */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-bottom-4 {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation-duration: 0.2s;
          animation-fill-mode: both;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .slide-in-from-bottom-4 {
          animation-name: slide-in-from-bottom-4;
        }
        
        /* Release notes content styling */
        .release-notes-content {
          line-height: 1.5;
        }
        .release-notes-content h1,
        .release-notes-content h2,
        .release-notes-content h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: var(--sidebar-text);
        }
        .release-notes-content h1:first-child,
        .release-notes-content h2:first-child,
        .release-notes-content h3:first-child {
          margin-top: 0;
        }
        .release-notes-content ul,
        .release-notes-content ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .release-notes-content li {
          margin: 0.25rem 0;
        }
        .release-notes-content p {
          margin: 0.5rem 0;
        }
        .release-notes-content code {
          background: rgba(0,0,0,0.3);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.8125rem;
        }
        .release-notes-content a {
          color: var(--primary-color);
          text-decoration: underline;
        }
        .release-notes-content hr {
          margin: 0.75rem 0;
          border-color: var(--border-color);
        }
        
        /* Custom scrollbar for notes */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--card-bg);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--border-dark);
        }
      `}</style>
    </>
  );
};

export default UpdateNotifier;