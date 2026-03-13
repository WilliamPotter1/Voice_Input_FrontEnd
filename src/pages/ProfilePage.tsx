import { useEffect, useState } from 'react';
import { Loader2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, uploadAvatar, type UserProfile } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
  placeholder,
  full = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const [form, setForm] = useState<Omit<UserProfile, 'email' | 'avatarUrl'> & { taxRate: string }>({
    name: '',
    phone: '',
    taxRate: '',
    websiteUrl: '',
    companyName: '',
    companyAddress: '',
    bankName: '',
    blz: '',
    kto: '',
    iban: '',
    bic: '',
    taxNumber: '',
    taxOfficeName: '',
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formLoaded, setFormLoaded] = useState(false);

  useEffect(() => {
    if (profileQuery.data && !formLoaded) {
      const p = profileQuery.data;
      setForm({
        name: p.name,
        phone: p.phone,
        taxRate: p.taxRate != null ? String(p.taxRate) : '',
        websiteUrl: p.websiteUrl,
        companyName: p.companyName,
        companyAddress: p.companyAddress,
        bankName: p.bankName,
        blz: p.blz,
        kto: p.kto,
        iban: p.iban,
        bic: p.bic,
        taxNumber: p.taxNumber,
        taxOfficeName: p.taxOfficeName,
      });
      setAvatarUrl(p.avatarUrl);
      setFormLoaded(true);
    }
  }, [profileQuery.data, formLoaded]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const taxRateNum = Number(form.taxRate.replace(',', '.'));
      return updateProfile({
        name: form.name,
        phone: form.phone,
        taxRate: Number.isFinite(taxRateNum) && taxRateNum >= 0 && taxRateNum <= 1 ? taxRateNum : null,
        websiteUrl: form.websiteUrl,
        companyName: form.companyName,
        companyAddress: form.companyAddress,
        bankName: form.bankName,
        blz: form.blz,
        kto: form.kto,
        iban: form.iban,
        bic: form.bic,
        taxNumber: form.taxNumber,
        taxOfficeName: form.taxOfficeName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(t('profileSaved'));
    },
    onError: (e: Error) => toast.error(e.message || t('profileSaveFailed')),
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      setAvatarUrl(data.avatarUrl);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function set(key: keyof typeof form) {
    return (v: string) => setForm((prev) => ({ ...prev, [key]: v }));
  }

  function resolveAvatarSrc(): string | undefined {
    if (!avatarUrl) return undefined;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return avatarUrl.startsWith('/api') ? avatarUrl : `/api${avatarUrl}`;
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="size-10 animate-spin text-emerald-500" />
        <p className="text-sm font-medium text-slate-600">{t('saving')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {t('profileTitle')}
          </h1>
          <p className="text-sm text-slate-500">{t('profileDesc')}</p>
        </div>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              {t('profileSaving')}
            </>
          ) : (
            t('profileSave')
          )}
        </button>
      </div>

      {/* Avatar */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          {t('profileAvatar')}
        </h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            {resolveAvatarSrc() ? (
              <img
                src={resolveAvatarSrc()}
                alt="Avatar"
                className="size-20 rounded-full border-2 border-slate-200 object-cover"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-100 text-2xl font-bold text-slate-400">
                {form.name ? form.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700">
              <Camera className="size-4" />
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) avatarMutation.mutate(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">{t('profileChangeAvatar')}</p>
            <p className="text-xs text-slate-500">JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      </section>

      {/* Personal */}
      <Section title={t('profileSectionPersonal')}>
        <Field label={t('profileName')} value={form.name} onChange={set('name')} />
        <Field label={t('profilePhoneOptional')} value={form.phone} onChange={set('phone')} type="tel" />
        <Field label={t('profileEmail')} value={profileQuery.data?.email ?? ''} onChange={() => {}} disabled full />
      </Section>

      {/* Company */}
      <Section title={t('profileSectionCompany')}>
        <Field label={t('profileCompanyName')} value={form.companyName} onChange={set('companyName')} />
        <Field label={t('profileWebsiteOptional')} value={form.websiteUrl} onChange={set('websiteUrl')} type="url" />
        <Field label={t('profileCompanyAddress')} value={form.companyAddress} onChange={set('companyAddress')} full />
      </Section>

      {/* Bank */}
      <Section title={t('profileSectionBank')}>
        <Field label={t('profileBankName')} value={form.bankName} onChange={set('bankName')} />
        <Field label={t('profileBlz')} value={form.blz} onChange={set('blz')} />
        <Field label={t('profileKto')} value={form.kto} onChange={set('kto')} />
        <Field label={t('profileIban')} value={form.iban} onChange={set('iban')} />
        <Field label={t('profileBic')} value={form.bic} onChange={set('bic')} />
      </Section>

      {/* Tax */}
      <Section title={t('profileSectionTax')}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t('profileTaxRateOptional')}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={form.taxRate}
            onChange={(e) => setForm((p) => ({ ...p, taxRate: e.target.value }))}
            placeholder={t('profileTaxRateHint')}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
          <p className="mt-1 text-xs text-slate-500">{t('profileTaxRateHint')}</p>
        </div>
        <Field label={t('profileTaxNumber')} value={form.taxNumber} onChange={set('taxNumber')} />
        <Field label={t('profileTaxOffice')} value={form.taxOfficeName} onChange={set('taxOfficeName')} />
      </Section>

      {/* Bottom save button (mobile convenience) */}
      <div className="flex justify-end pb-4">
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              {t('profileSaving')}
            </>
          ) : (
            t('profileSave')
          )}
        </button>
      </div>
    </div>
  );
}
