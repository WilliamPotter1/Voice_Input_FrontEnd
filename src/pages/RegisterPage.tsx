import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { register } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n/useTranslation';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(t('passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await register(email, password);
      setAuth(token, user);
      toast.success(t('accountCreated'));
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('registrationFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[400px]">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/50">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('registerTitle')}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{t('registerDesc')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
          <div>
            <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t('password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder={t('passwordMinLength')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">{t('passwordMinLength')}</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {t('creatingAccount')}
              </>
            ) : (
              t('createAccount')
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
