import { Storage } from '../storage/db';
import { Video, PlaybackBridgeSettings, CollectionSettings } from '../types';

export const DEFAULT_PLAYBACK_SETTINGS: PlaybackBridgeSettings = {
  enabled: false,
  type: 'shortcut',
  shortcutName: 'Play in VLC',
  playbackAppName: 'VLC',
  version: '1.0'
};

export async function getPlaybackSettings(): Promise<PlaybackBridgeSettings> {
  try {
    const settingsList = await Storage.getSettings();
    const defaultSettings = settingsList.find(s => s.id === 'default') || settingsList[0];
    if (defaultSettings && defaultSettings.playback) {
      return { ...DEFAULT_PLAYBACK_SETTINGS, ...defaultSettings.playback };
    }
    // Check localStorage fallback for instant sync across tabs
    const local = localStorage.getItem('t9_playback_settings');
    if (local) {
      try {
        return { ...DEFAULT_PLAYBACK_SETTINGS, ...JSON.parse(local) };
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Failed to load playback settings from storage:', err);
  }
  return DEFAULT_PLAYBACK_SETTINGS;
}

export async function savePlaybackSettings(settings: PlaybackBridgeSettings): Promise<void> {
  try {
    // Save to localStorage for instant client-side reactivity
    localStorage.setItem('t9_playback_settings', JSON.stringify(settings));

    const settingsList = await Storage.getSettings();
    let defaultSettings = settingsList.find(s => s.id === 'default') || settingsList[0];
    
    if (!defaultSettings) {
      defaultSettings = {
        id: 'default',
        vocabularies: {},
        thresholds: {},
        preferences: {},
        playback: settings,
        updatedAt: Date.now()
      };
    } else {
      defaultSettings.playback = settings;
      defaultSettings.updatedAt = Date.now();
    }
    
    await Storage.saveSettings(defaultSettings);
  } catch (err) {
    console.error('Failed to persist playback settings:', err);
  }
}

/**
 * Builds the iOS Shortcuts invocation URL.
 * URL scheme: shortcuts://run-shortcut?name=<NAME>&input=text&text=<PATH_OR_FILENAME>
 */
export function buildShortcutUrl(shortcutName: string, video: Video): string {
  const cleanShortcutName = (shortcutName || 'Play in VLC').trim();
  
  // Clean relative path without leading drive name or leading slashes
  let payload = video.relativePath || video.filename || '';
  if (payload.startsWith("John's T9/")) {
    payload = payload.substring("John's T9/".length);
  } else if (payload.startsWith("T9/")) {
    payload = payload.substring("T9/".length);
  }

  const encodedName = encodeURIComponent(cleanShortcutName);
  const encodedPayload = encodeURIComponent(payload);

  return `shortcuts://run-shortcut?name=${encodedName}&input=text&text=${encodedPayload}`;
}

export interface PlaybackLaunchResult {
  success: boolean;
  launchedUrl?: string;
  error?: string;
  needsSetup?: boolean;
}

/**
 * Executes playback for a video.
 */
export async function launchPlayback(video: Video): Promise<PlaybackLaunchResult> {
  const settings = await getPlaybackSettings();

  if (!settings.enabled || !settings.shortcutName.trim()) {
    return {
      success: false,
      needsSetup: true,
      error: 'Playback bridge is not configured or is disabled.'
    };
  }

  const targetPath = video.relativePath || video.filename;
  if (!targetPath) {
    return {
      success: false,
      error: 'Video record has no physical path or filename associated.'
    };
  }

  const url = buildShortcutUrl(settings.shortcutName, video);

  try {
    // Launch iOS Shortcut URL
    window.location.href = url;

    // Track last tested/used timestamp
    settings.lastTestedAt = Date.now();
    savePlaybackSettings(settings).catch(() => {});

    return {
      success: true,
      launchedUrl: url
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to trigger Shortcut URL scheme.'
    };
  }
}
