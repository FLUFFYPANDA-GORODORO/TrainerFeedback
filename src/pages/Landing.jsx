import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Shield,
  BarChart3,
  ClipboardCheck,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '../assets/logoo.webp';
import juspay from '../assets/juspay.png';
import bridgestone from '../assets/bridgestone.png';
import sas from '../assets/sas.png';
import hettich from '../assets/Hettich.jpeg';
import tvs from '../assets/TVS.jpeg';
import dataAxle from '../assets/dataaxle.png';
import persistent from '../assets/persistent.png';
import philips from '../assets/Philips.jpeg';
import rbu from '../assets/RBU.png';
import isc from '../assets/isc.jpeg';
import lead from '../assets/lead.png';
import igbs from '../assets/igbs.jpeg';
import { Instagram } from 'lucide-react';
import { Facebook } from 'lucide-react';
import { Linkedin } from 'lucide-react';
import { Youtube } from 'lucide-react';

const features = [
  {
    icon: ClipboardCheck,
    title: 'Anonymous Feedback',
    description:
      'Students can provide honest feedback through secure session links without revealing their identity.',
  },
  {
    icon: BarChart3,
    title: 'Comprehensive Analytics',
    description:
      'Detailed reports and visualizations help administrators understand training effectiveness.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description:
      'Secure multi-level dashboards for super admins, college admins, and trainers.',
  },
  {
    icon: Building2,
    title: 'Multi-College Support',
    description:
      'Manage multiple colleges and track trainer performance across institutions.',
  },
];

const whoIsThisFor = [
  {
    icon: Users,
    title: 'Students',
    description:
      'Share honest and anonymous feedback about trainers, courses, and learning experience.',
  },
  {
    icon: GraduationCap,
    title: 'Trainers',
    description:
      'Understand strengths, improvement areas, and overall training effectiveness.',
  },
  {
    icon: Shield,
    title: 'Administrators',
    description:
      'Monitor performance trends, generate reports, and make data-driven decisions.',
  },
];
const howItWorks = [
  {
    step: '01',
    title: 'Student Submits Feedback',
    description:
      'Students receive a secure feedback link and submit ratings and comments anonymously.',
  },
  {
    step: '02',
    title: 'Feedback Is Collected',
    description:
      'Responses are securely stored and grouped by trainer, course, and institution.',
  },
  {
    step: '03',
    title: 'Analytics Are Generated',
    description:
      'The system automatically generates insights, trends, and performance metrics.',
  },
  {
    step: '04',
    title: 'Admins Take Action',
    description:
      'Administrators review dashboards and make data-driven improvements.',
  },
];
const trustedPartners = [
  { name: 'Juspay', logo: juspay },
  { name: 'Bridgestone', logo: bridgestone },
  { name: 'SAS', logo: sas },
  { name: 'Hettich', logo: hettich },
  { name: 'TVS', logo: tvs },
  { name: 'Data Axle', logo: dataAxle },
  { name: 'Persistent', logo: persistent },
  { name: 'Philips', logo: philips },
  { name: 'RBU', logo: rbu },
  { name: 'Indira School of Communication', logo: isc },
  { name: 'LEAD', logo: lead },
  { name: 'Indira Global Business School', logo: igbs },
];

export const Landing = () => {
  return (
    <div className="min-h-screen bg-background">

      {/* ================= NAVBAR ================= */}
<nav className="
  fixed top-0 left-0 right-0 z-50
  bg-primary/80 backdrop-blur-xl
  border-b border-black/5 
">


        <div className="container mx-auto px-6 py-4 flex items-center justify-between ">
       <Link to="/" className="flex flex-col items-center leading-tight">
  <img
    src={logo}
    alt="Gryphon Feedback System"
    className="h-14 md:h-16 object-contain"
  />

  <span className="mt-1 text-white/80 text-xs md:text-sm font-medium tracking-wide">
    Feedback System
  </span>
</Link>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'About'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="relative text-sm font-medium text-white/80 hover:text-primary transition-colors"

              >
                {item}
              </a>
            ))}

            <Link to="/login">
             <Button
              size="lg"
              className="px-10 h-12 gap-2 gradient-hero text-primary-foreground
              hover:scale-[1.04] hover:shadow-xl transition-all"
            >
              <Users className="h-5 w-5" />
              Staff Login
            </Button>
            </Link>
          </div>
        </div>
      </nav> 

      {/* ================= HERO ================= */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">

       <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />


        <div className="container mx-auto relative text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-up">
            <Shield className="h-4 w-4" />
            Secure & Anonymous Feedback Platform
          </div>

         <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">

            Elevate Training Excellence Through
            <br />
            <span className="inline-block mt-4 px-5 py-3 rounded-3xl bg-primary text-white">
              Meaningful Feedback
            </span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 animate-fade-up">
            Empower your institution with a feedback system that bridges the gap
            between students and trainers.
          </p>

          <Link to="/login">
            <Button
              size="lg"
              className="px-10 h-12 gap-2 gradient-hero text-primary-foreground
              hover:scale-[1.04] hover:shadow-xl transition-all"
            >
              <Users className="h-5 w-5" />
              Staff Login
            </Button>
          </Link>
        </div>

        {/* Glow */}
        <div className="absolute top-1/2 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="py-32 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete feedback management solution for educational institutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="glass-card rounded-xl p-6 transition-all
                hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30"
              >
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center
  rounded-full
  bg-gradient-to-br from-indigo-500 to-purple-600
  text-white font-bold
  shadow-lg shadow-purple-500/30">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">
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

      {/* ================= WHO IS THIS FOR ================= */}
      <section className="py-32 px-6">
        <div className="container mx-auto text-center">
          <h2 className="font-display text-4xl font-bold mb-4">
            Who Is This For?
          </h2>
          <p className="text-muted-foreground mb-16 max-w-2xl mx-auto">
            Designed for every stakeholder in the training ecosystem
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {whoIsThisFor.map((item) => (
              <div
                key={item.title}
                className="glass-card rounded-xl p-10 transition-all
                hover:-translate-y-2 hover:shadow-2xl text-center"
              >
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center
  rounded-full
  bg-gradient-to-br from-indigo-500 to-purple-600
  text-white font-bold
  shadow-lg shadow-purple-500/30">
                  <item.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


{/* ================= HOW IT WORKS ================= */}
<section className="py-32 px-6 bg-secondary/20">
  <div className="container mx-auto">
    <div className="text-center mb-20">
      <h2 className="font-display text-4xl font-bold text-foreground mb-4">
        How It Works?
      </h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        A simple and transparent process designed for effective feedback collection
      </p>
    </div>

    <div className="grid md:grid-cols-4 gap-6">
      {howItWorks.map((item, index) => (
        <div
          key={item.step}
          className="glass-card rounded-xl p-8 text-center transition-all
          hover:-translate-y-2 hover:shadow-2xl"
        >
          {/* Step Number */}
          <div className=" mx-auto mb-6 flex h-12 w-12 items-center justify-center
  rounded-full
  bg-gradient-to-br from-indigo-500 to-purple-600
  text-white font-bold
  shadow-lg shadow-purple-500/30">
            {item.step}
          </div>

          <h3 className="font-display text-lg font-semibold text-foreground mb-3">
            {item.title}
          </h3>

          <p className="text-sm text-muted-foreground">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
    {/* Trusted Partners (same data, same pattern) */}
<section className="py-32 px-6 bg-secondary/20">
    <div className="mt-20">
      <div className="text-center mb-12">
        <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
          Trusted by Leading Institutions
        </h3>
        <p className="text-muted-foreground">
          Organizations partnering with Gryphon Academy
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {trustedPartners.map((partner) => (
          <div
            key={partner.name}
            className="glass-card rounded-xl p-6 h-24
                       flex items-center justify-center
                       transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className=" max-h-12
  opacity-60
  hover:opacity-100
  transition"
            />
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center mt-8">
        and many more institutions nationwide
      </p>
    </div>


</section>


      {/* ================= FOOTER ================= */}
<footer className="bg-primary/80 text-white pt-24 px-6">
  <div className="container mx-auto grid gap-12 md:grid-cols-4 pb-12 border-b border-white/20">

    {/* ---------- BRAND ---------- */}
    <div>
      <div className="mb-4">
  <img
    src={logo}
    alt="Gryphon Academy"
    className="h-20 object-contain"
  />
</div>


      <p className="text-white/80 text-sm leading-relaxed">
        Bridging the gap between industry and academia through
        structured training and meaningful feedback.
      </p>
    </div>

    {/* ---------- USEFUL LINKS ---------- */}
    <div>
      <h4 className="font-display text-lg font-semibold mb-4">
        Useful Links
      </h4>

      <ul className="space-y-2 text-sm text-white/80">
        <li><a href="#" className="hover:text-white">Contact Us</a></li>
        <li><a href="#" className="hover:text-white">About Us</a></li>
        <li><a href="#" className="hover:text-white">Learning & Development</a></li>
        <li><a href="#" className="hover:text-white">Campus Placement</a></li>
        <li><a href="#" className="hover:text-white">Blogs</a></li>
        <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
      </ul>
    </div>

    {/* ---------- CONTACT US ---------- */}
    <div>
      <h4 className="font-display text-lg font-semibold mb-4">
        Contact Us
      </h4>

      <ul className="space-y-3 text-sm text-white/80">
        <li className="flex gap-2">
          📍
          <span>
            9th Floor, Olympia Business House,<br />
            Mumbai–Bangalore Highway,<br />
            Pune – 411045
          </span>
        </li>

        <li className="flex gap-2">
          📞
          <span>+91 8956444509</span>
        </li>

        <li className="flex gap-2">
          ✉️
          <span>connect@gryphonacademy.co.in</span>
        </li>
      </ul>
    </div>

    {/* ---------- FOLLOW US ---------- */}
    <div>
      <h4 className="font-display text-lg font-semibold mb-4">
        Follow Us
      </h4>

      <div className="flex gap-4 text-2xl">
        <a href="https://www.facebook.com/gryphonnacademy" className="hover:text-white/80"><Facebook className="w-5 h-5" /></a>
        <a href="https://www.instagram.com/gryphon_academy/" className="hover:text-white/80"><Instagram className="w-5 h-5" /></a>
        <a href="https://www.linkedin.com/company/gryphonacademy/" className="hover:text-white/80"><Linkedin className="w-5 h-5" /></a>
        <a href="https://www.youtube.com/channel/UCVn2uVWEHg8cMFd8ht3CQBw" className="hover:text-white/80"><Youtube className="w-5 h-5" /></a>
      </div>
    </div>
  </div>

  {/* ---------- COPYRIGHT ---------- */}
  <div className="text-center py-6 text-sm text-white/70">
    © {new Date().getFullYear()} Gryphon Academy Pvt. Ltd. All rights reserved.
  </div>
</footer>

    </div>
  );
};
