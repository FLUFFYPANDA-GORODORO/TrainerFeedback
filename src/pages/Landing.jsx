import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, Shield, BarChart3, ClipboardCheck, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: ClipboardCheck,
    title: 'Anonymous Feedback',
    description: 'Students can provide honest feedback through secure session links without revealing their identity.',
  },
  {
    icon: BarChart3,
    title: 'Comprehensive Analytics',
    description: 'Detailed reports and visualizations help administrators understand training effectiveness.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Secure multi-level dashboards for super admins, college admins, and trainers.',
  },
  {
    icon: Building2,
    title: 'Multi-College Support',
    description: 'Manage multiple colleges and track trainer performance across institutions.',
  },
];

export const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-xl font-semibold text-foreground">Gryphon</span>
                <span className="ml-2 text-sm text-muted-foreground">Feedback System</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Staff Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-up">
              <Shield className="h-4 w-4" />
              Secure & Anonymous Feedback Platform
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Elevate Training Excellence Through
              <br />
              <span className="text-white bg-primary rounded-3xl px-4 py-1 mt-4 inline-block">
                Meaningful Feedback
              </span>
            </h1>

            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Empower your institution with a comprehensive feedback system that bridges the gap between students and trainers, fostering continuous improvement in education.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/login">
                <Button size="lg" className="gap-2 px-8 h-12 gradient-hero text-primary-foreground hover:opacity-90">
                  <Users className="h-5 w-5" />
                  Staff Login
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete feedback management solution designed for educational institutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card rounded-xl p-6 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-hero mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="gradient-hero rounded-2xl p-12 text-center">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="animate-fade-up">
                <p className="font-display text-4xl font-bold text-primary-foreground mb-2">10,000+</p>
                <p className="text-primary-foreground/80">Feedback Submissions</p>
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
                <p className="font-display text-4xl font-bold text-primary-foreground mb-2">500+</p>
                <p className="text-primary-foreground/80">Trainers</p>
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <p className="font-display text-4xl font-bold text-primary-foreground mb-2">25+</p>
                <p className="text-primary-foreground/80">Partner Institutions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-hero">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-semibold text-foreground">Gryphon Academy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Gryphon Academy Pvt Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
