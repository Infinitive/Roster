import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Video, PlaybackBridgeSettings } from '../types';
import { getPlaybackSettings, launchPlayback, buildShortcutUrl, DEFAULT_PLAYBACK_SETTINGS } from '../utils/playback';
import { Play, Settings as SettingsIcon, Copy, Check, ExternalLink, X, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlaybackContextType {
  playVideo: (video: Video) => Promise<void>;
  settings: PlaybackBridgeSettings;
  refreshSettings: () => Promise<void>;
  copyPath: (video: Video) => Promise<boolean>;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlaybackBridgeSettings>(DEFAULT_PLAYBACK_SETTINGS);
  const [unconfiguredVideo, setUnconfiguredVideo] = useState<Video | null>(null);
  const [launchedVideo, setLaunchedVideo] = useState<Video | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refreshSettings();
  }, []);

  async function refreshSettings() {
    const s = await getPlaybackSettings();
    setSettings(s);
  }

  const copyPath = async (video: Video): Promise<boolean> => {
    const pathText = video.relativePath || video.filename;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pathText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return true;
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
    return false;
  };

  const playVideo = async (video: Video) => {
    const s = await getPlaybackSettings();
    setSettings(s);

    if (!s.enabled || !s.shortcutName.trim()) {
      setUnconfiguredVideo(video);
      return;
    }

    const res = await launchPlayback(video);
    if (res.success) {
      setLaunchedVideo(video);
      setTimeout(() => setLaunchedVideo(null), 8000);
    } else if (res.needsSetup) {
      setUnconfiguredVideo(video);
    }
  };

  return (
    <PlaybackContext.Provider value={{ playVideo, settings, refreshSettings, copyPath }}>
      {children}

      {/* 1. Setup Required Modal (when playback is not configured) */}
      {unconfiguredVideo && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#121520] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Play size={20} className="fill-amber-400/20 translate-x-0.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Configure T9 Playback
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Connect T9 to your external drive via iOS Shortcuts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnconfiguredVideo(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5 text-xs">
              <span className="font-semibold text-zinc-200 block truncate">
                {unconfiguredVideo.performerDisplay ? `${unconfiguredVideo.performerDisplay} — ` : ''}
                {unconfiguredVideo.title || unconfiguredVideo.filename}
              </span>
              <p className="text-[11px] text-zinc-500 font-mono truncate">
                {unconfiguredVideo.relativePath || unconfiguredVideo.filename}
              </p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              T9 Registry does not copy or stream files. Set up a one-tap iOS Shortcut in Settings to automatically locate and launch this file on your external T9 drive in VLC.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <Link
                to="/settings#playback"
                onClick={() => setUnconfiguredVideo(null)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-950/30 transition-all active:scale-95"
              >
                <SettingsIcon size={14} />
                <span>Configure in Settings</span>
              </Link>

              <button
                type="button"
                onClick={async () => {
                  await copyPath(unconfiguredVideo);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Path Copied!' : 'Copy Path'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Playback Launched Floating Feedback Bar */}
      {launchedVideo && (
        <aside 
          aria-label="Playback Notification"
          className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg bg-[#141724] border border-amber-500/40 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center flex-none">
              <Play size={16} className="fill-zinc-950 translate-x-0.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                Handed to {settings.shortcutName || 'iOS Shortcut'}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {launchedVideo.performerDisplay || launchedVideo.title || launchedVideo.filename}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-none">
            <Link
              to={`/sessions/new?videoId=${launchedVideo.id}`}
              onClick={() => setLaunchedVideo(null)}
              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-zinc-950 transition-colors"
            >
              <Flame size={12} />
              <span>Log Session</span>
            </Link>

            <button
              type="button"
              onClick={() => setLaunchedVideo(null)}
              className="text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X size={15} />
            </button>
          </div>
        </aside>
      )}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return ctx;
}
