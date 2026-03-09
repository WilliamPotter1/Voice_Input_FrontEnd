import { create } from 'zustand';

export interface VoiceState {
  transcribedText: string | null;
  setTranscribedText: (text: string | null) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  transcribedText: null,
  setTranscribedText: (text) => set({ transcribedText: text }),
  selectedLanguage: 'de',
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
}));
