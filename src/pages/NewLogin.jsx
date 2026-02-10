import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

export const NewLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 p-4 lg:p-8 overflow-hidden">
      <div className="flex w-full max-w-[1440px] h-[90vh] lg:h-[85vh] overflow-hidden rounded-[32px] bg-white shadow-2xl p-4 gap-4">
        
        {/* Left Panel - Visual */}
        <div className="hidden lg:flex lg:flex-[3] flex-col justify-center gradient-hero p-12 relative overflow-hidden rounded-2xl">
          {/* Abstract Background Elements */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20"></div>
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-[100px]"></div>
          <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]"></div>


          {/* Content Container */}
          <div className="relative z-10 mx-auto w-full max-w-2xl h-full flex flex-col items-center justify-between p-8">
              
              {/* Header Text */}
              <div className="text-center space-y-4">
                <h2 className="font-display font-bold text-3xl lg:text-4xl text-white leading-tight drop-shadow-md">
                    Transforming Education <br/> Through Feedback
                </h2>
              </div>

              {/* Vector Image */}
              <div className="flex-1 flex items-center justify-center w-full min-h-0 my-2">
                  <img 
                    src="/vector3.png" 
                    alt="Illustration" 
                    className="w-full h-full object-contain drop-shadow-2xl animate-fade-in hover:scale-105 transition-transform duration-500"
                  />
              </div>

              {/* Bottom Section - Avatar Group & Text */}
              <div className="flex flex-row items-center gap-4 w-full justify-center mt-4">
                <div className="flex -space-x-4">
                   {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-[#01224E] bg-white flex items-center justify-center overflow-hidden shadow-sm">
                         <img src="/shortlogo.png" alt="User" className="h-6 w-6 object-contain" />
                      </div>
                   ))}
                </div>
                <p className="text-sm font-medium text-white/90 whitespace-nowrap">
                  Trusted by trainers, shaped by student feedback.
                </p>
              </div>
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="flex w-full flex-col justify-center p-8 lg:flex-[2] lg:p-12 xl:p-16 relative rounded-2xl border border-gray-200 shadow-sm bg-white">
          
          <div className="w-full max-w-sm mx-auto flex flex-col justify-center h-full">
            
            <div className="mb-10 flex flex-col items-center text-center">
               <img src="/gryphon_logo.png" alt="Gryphon Logo" className="h-24 w-auto mb-6" />
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Welcome Back
              </h1>
              <p className="text-muted-foreground">
                Sign in to access your dashboard
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-primary">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="pl-10 h-12 bg-background border-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password <span className="text-primary">*</span></Label>
                    <button type="button" className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
                        Forgot Password?
                    </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-12 bg-background border-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button className="h-12 w-full text-base font-medium shadow-lg hover:shadow-xl transition-all bg-[#01224E] hover:bg-[#01224E]/90 text-white">
                Sign In
              </Button>
            </form>

            <div className="mt-8 text-center">
                <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
