import { useVoiceStore } from '../stores/voiceStore';
import { translations, type TranslationKey, type LanguageCode } from './translations';

export function useTranslation() {
  const lang = useVoiceStore((s) => s.selectedLanguage) as LanguageCode;
  const t = translations[lang] ?? translations.en;

  function tr(key: TranslationKey, vars?: Record<string, string | number>): string {
    let text: string = t[key] ?? translations.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  }

  return { t: tr, lang };
}
