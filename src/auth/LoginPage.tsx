import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { C } from '../lib/theme';

const schema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { session } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) setAuthError(error.message);
  };

  // Un utilisateur déjà authentifié ne doit pas rester sur /login.
  if (session) return <Navigate to="/" replace />;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: C.bgSoft }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-lg p-10"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: C.primary }}
          >
            Hans Coffrage
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: C.textMuted }}>
            ERP — Espace de travail
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: C.text }}
            >
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-label="email"
              className="block w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2"
              style={{
                borderColor: errors.email ? C.danger : C.border,
                color: C.text,
                backgroundColor: C.bg,
              }}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs" style={{ color: C.danger }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5"
              style={{ color: C.text }}
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-label="password"
              className="block w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2"
              style={{
                borderColor: errors.password ? C.danger : C.border,
                color: C.text,
                backgroundColor: C.bg,
              }}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: C.danger }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {authError && (
            <p
              className="rounded-lg px-4 py-3 text-sm"
              style={{ backgroundColor: C.dangerSoft, color: C.danger }}
              role="alert"
            >
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ backgroundColor: C.primary }}
          >
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
