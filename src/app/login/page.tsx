// Host Login Page - Magic Link Authentication
'use client';

import { useState, FormEvent } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email' });
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Magic link sent! Check your email to sign in.',
      });
      setEmail('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send magic link',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#C4785E] to-[#D4A574] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to manage your weddings</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
          {message && (
            <div className={clsx(
              'p-4 rounded-xl flex items-center gap-3',
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            )}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <p>{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={clsx(
                    'w-full pl-10 pr-4 py-3 rounded-xl border',
                    'focus:outline-none focus:ring-2 focus:ring-[#C4785E] focus:border-transparent'
                  )}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={clsx(
                'w-full py-3.5 rounded-xl font-semibold text-lg',
                'bg-[#C4785E] text-white',
                'hover:bg-[#B06850] disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors flex items-center justify-center gap-2'
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Mail className="h-5 w-5" />
                  Send Magic Link
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            No password needed. We&apos;ll send you a secure link to sign in.
          </p>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-[#C4785E] hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-[#C4785E] hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}