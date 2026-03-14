import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError('Check your email for the confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-foreground rounded-xl mb-4">
            <span className="text-background font-bold text-3xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">TallyFlow ERP</h1>
          <p className="text-gray-500 text-sm mt-2 uppercase tracking-widest">Enterprise Management System</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  required
                  value={email || ''}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-foreground text-sm focus:outline-none focus:border-foreground/20 transition-colors"
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="password"
                  required
                  value={password || ''}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-foreground text-sm focus:outline-none focus:border-foreground/20 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg text-xs font-mono",
                error.includes('confirmation') ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
              )}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background font-bold py-3 rounded-lg text-sm uppercase tracking-widest hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isSignUp ? 'Register' : 'Enter System'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gray-500 text-[10px] uppercase tracking-widest hover:text-foreground transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[9px] text-gray-700 uppercase tracking-[0.3em]">Secure Enterprise Access • v2.4.0</p>
        </div>
      </div>
    </div>
  );
};
