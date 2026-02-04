import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getRedirectPath } from '@/lib/mockAuth';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Handle navigation when user data becomes available after login
  useEffect(() => {
    if (user && !isLoading) {
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath);
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || 'Login failed');
      setIsSubmitting(false);
    }
    // On success, navigation will be handled by the useEffect above
  };

  const demoCredentials = [
    { role: 'Super Admin', email: 'superadmin@gryphonacademy.co.in', password: 'password123' },
    { role: 'College Admin (ICEM)', email: 'admin@icem.com', password: 'password123' },
    { role: 'Trainer', email: 'john.trainer@test.com', password: 'password123' },
  ];

  const fillCredentials = (email, password) => {
    setEmail(email);
    setPassword(password);
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
       
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-primary-foreground">Gryphon</h1>
              <p className="text-primary-foreground/70">Trainer Feedback System</p>
            </div>
          </div>

          <h2 className="font-display text-4xl font-bold text-primary-foreground leading-tight mb-6">
            Transforming Education Through Feedback
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Access your personalized dashboard to view feedback analytics, manage sessions, and drive continuous improvement in training excellence.
          </p>

          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-xs font-medium text-primary-foreground"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-primary-foreground/70">
              Join 500+ trainers already using our platform
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-hero">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">Gryphon</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-scale-in">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 gradient-hero text-primary-foreground hover:opacity-90"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Demo Credentials</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => fillCredentials(cred.email, cred.password)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary transition-colors text-sm"
                >
                  <span className="font-medium text-foreground">{cred.role}</span>
                  <span className="text-muted-foreground">{cred.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
