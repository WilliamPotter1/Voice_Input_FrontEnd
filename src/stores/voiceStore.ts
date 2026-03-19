import { create } from 'zustand';

export interface VoiceState {
  transcribedText: string | null;
  setTranscribedText: (text: string | null) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
}

function loadInitialLanguage(): string {
  if (typeof window === 'undefined') return 'de';
  try {
    const stored = window.localStorage.getItem('awodo_language');
    if (!stored) return 'de';
    // Only accept known languages
    return ['de', 'en', 'it', 'fr', 'es'].includes(stored) ? stored : 'de';
  } catch {
    return 'de';
  }
}

export const useVoiceStore = create<VoiceState>((set) => ({
  transcribedText: null,
  setTranscribedText: (text) => set({ transcribedText: text }),
  selectedLanguage: loadInitialLanguage(),
  setSelectedLanguage: (lang) => {
    set({ selectedLanguage: lang });
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('awodo_language', lang);
      } catch {
        // ignore storage errors
      }
    }
  },
}));

