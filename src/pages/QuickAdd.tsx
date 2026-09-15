import React, { useState, useMemo } from 'react';
import { Storage } from '../storage/db';
import { createNewVideo, parseFilename } from '../engines/parser';
import { Save, AlertCircle, CheckCircle2, ArrowRight, PlusCircle, Film, User, Tag, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import TagChip from '../components/ui/TagChip';
import Badge from '../components/ui/Badge';

export default function QuickAdd() {
  const [filename, setFilename] = useState('');
  const [relativePath, setRelativePath] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live parsed preview
  const livePreview = useMemo(() => {
    if (!filename.trim()) return null;
    return parseFilename(filename, relativePath);
  }, [filename, relativePath]);

  const previewTags = useMemo(() => {
    if (!livePreview?.originalTags) return [];
    return livePreview.originalTags.split(',').map(t => t.trim()).filter(Boolean);
  }, [livePreview]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    
    if (!filename.trim()) {
      setErrorMsg('Filename is required.');
      return;
    }
    
    if (!relativePath.trim()) {
      setErrorMsg('Relative path is required to infer folder and participant hierarchy.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newVideo = createNewVideo(filename, relativePath);
      await Storage.saveVideo(newVideo);
      
      setSuccessMsg(newVideo.id);
      setFilename('');
      setRelativePath('');
      
      // Auto-hide success message after 10s
      setTimeout(() => setSuccessMsg(''), 10000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save video to local storage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <PageHeader
        title="Quick Add"
        icon={<PlusCircle size={24} className="text-amber-500" />}
        subtitle="Capture now. Enrich later. Add records under 60 seconds with live metadata parsing."
      />

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-300">
            <CheckCircle2 size={18} className="text-emerald-400 flex-none" />
            <span>Record created and indexed successfully in your local registry.</span>
          </div>
          <Link 
            to={`/video/${successMsg}`}
            className="flex items-center gap-1 font-bold bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            <span>Open Record</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
          <AlertCircle size={18} className="text-rose-400 flex-none" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              Physical Filename *
            </label>
            <input 
              type="text" 
              placeholder="e.g. Performer A | Descriptive Title | Tag A, Tag B [1080p]" 
              value={filename}
              onChange={e => setFilename(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 font-mono"
            />
            <p className="text-[11px] text-zinc-500">
              Convention: <span className="text-zinc-400 font-mono">Performers | Descriptive Title | Key Tags [Resolution]</span>
            </p>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              Relative Path *
            </label>
            <input 
              type="text" 
              placeholder="e.g. John's T9/XXX/2 Duo/Rough & Intense/" 
              value={relativePath}
              onChange={e => setRelativePath(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 font-mono"
            />
            <p className="text-[11px] text-zinc-500">
              Used to extract physical folder placement and participant hierarchy without altering the drive.
            </p>
          </div>

          {/* Live Parser Feedback */}
          {livePreview && (
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Sparkles size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                  Live Extraction Preview
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Performers:</span>
                  <span className="font-semibold text-zinc-200">
                    {livePreview.performerDisplay || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Title:</span>
                  <span className="font-semibold text-zinc-200">
                    {livePreview.title || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Folder & Participants:</span>
                  <span className="font-semibold text-zinc-200">
                    {livePreview.folder} ({livePreview.participantCount ?? '?'} participants)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Resolution:</span>
                  <span className="font-semibold text-zinc-200 font-mono">
                    {livePreview.resolution || 'Unknown'}
                  </span>
                </div>
              </div>

              {previewTags.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/60">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1.5">
                    Extracted Tags ({previewTags.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {previewTags.map((t, i) => (
                      <TagChip key={i} tag={t} size="xs" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-amber-950/30 transition-all active:scale-98 disabled:opacity-50"
          >
            <Save size={16} />
            <span>Save to Local Registry</span>
          </button>
        </form>
      </div>

      <div className="p-5 rounded-2xl bg-[#121520]/60 border border-zinc-800/60 space-y-2 text-xs">
        <h4 className="font-bold text-zinc-300 font-mono uppercase tracking-wider text-[11px]">
          The T9 Registry Philosophy
        </h4>
        <p className="text-zinc-400 leading-relaxed">
          Physical media files remain completely intact on your external T9 drive. The registry only manages structured metadata, memory, ratings, and behavioral intelligence.
        </p>
      </div>
    </div>
  );
}
