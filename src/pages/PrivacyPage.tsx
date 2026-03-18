import { useTranslation } from '../i18n/useTranslation';

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {t('privacyTitle') ?? 'Privacy Policy'}
      </h1>
      <p className="text-sm text-slate-500">
        {t('privacyIntro') ??
          'Below you can find the full privacy policy describing how your data is processed.'}
      </p>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-800">
        {/* TODO: Paste your prepared Privacy Policy text here (from the DOCX). */}
        <p className="italic text-slate-500">
          Privacy Policy content to be inserted here by the site owner.
        </p>
      </div>
    </div>
  );
}

