import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Users,
  Compass,
  PhoneCall,
  MapPin,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const SafetyPage: React.FC = () => {
  const safetyProtocols = [
    {
      icon: Users,
      title: 'Leader Vetting & Member Chemistry',
      description:
        'Trips are not open cattle-calls. Leaders review your public travel style, compatibility fit, and verified badges before accepting you into the expedition.',
    },
    {
      icon: Lock,
      title: 'Private-First Identity Vault',
      description:
        'Your contact numbers, emergency details, and passport copies are held in your Travel Vault and never made public to general internet search engines.',
    },
    {
      icon: Compass,
      title: 'Pre-Trip Alignment Calls',
      description:
        'Every confirmed group has an in-app group chat to discuss physical fitness expectations, gear requirements, acclimatization, and weather contingencies.',
    },
    {
      icon: AlertTriangle,
      title: 'Transparent Risk Disclosures',
      description:
        'Leaders specify terrain difficulty (e.g. altitude, river crossings, slippery monsoons) upfront so every participant can make informed decisions.',
    },
  ];

  const safeMeetingChecklist = [
    'Always conduct your initial group meetup in a public space (station, café, or hotel lobby).',
    'Share your live itinerary and lead contact with a family member or friend back home.',
    'Store local emergency police (112) and district hospital contacts in your Travel Vault.',
    'Keep your identification and essential medications on your person, not in checked bags.',
    'Trust your instincts: If a route or accommodation feels unsafe, communicate with the group immediately.',
  ];

  return (
    <div className="flex flex-col text-left max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      {/* 1. HERO */}
      <div className="relative bg-gradient-to-br from-primary/10 via-accent/20 to-light-bg rounded-3xl p-8 sm:p-12 border border-border">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase font-heading mb-4">
            <Shield className="w-4 h-4" />
            <span>Traveler Safety & Security</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-text tracking-tight">
            Safety Guidelines
          </h1>
          <p className="text-sm sm:text-base text-text-muted mt-4 leading-relaxed font-body">
            At Tripzobox, traveller safety is our foundational architecture. Learn how our verification, group matching, and emergency protocols safeguard every journey.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/community-rules">
              <Button variant="primary" size="md">
                Read Community Rules
              </Button>
            </Link>
            <Link to="/vault-security">
              <Button variant="secondary" size="md">
                Travel Vault Security
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. CORE SAFETY PROTOCOLS */}
      <div className="space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text">
            Our Multi-Layer Safety Architecture
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Built from the ground up for real-world travel conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safetyProtocols.map((protocol) => {
            const Icon = protocol.icon;
            return (
              <div
                key={protocol.title}
                className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-card flex flex-col gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/35 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 stroke-[1.75]" />
                </div>
                <h3 className="font-heading font-bold text-lg text-text">
                  {protocol.title}
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  {protocol.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SAFE TRAVEL CHECKLIST */}
      <div className="bg-white rounded-3xl border border-border p-8 sm:p-10 shadow-card space-y-6">
        <div>
          <span className="text-xs font-bold text-primary tracking-wider uppercase font-heading">
            Essential Traveler Best Practices
          </span>
          <h3 className="font-heading font-bold text-xl sm:text-2xl text-text mt-1">
            Pre-Departure & On-Trip Checklist
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
            Follow these five fundamental recommendations before embarking on any group or solo adventure:
          </p>
        </div>

        <div className="space-y-3.5">
          {safeMeetingChecklist.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-light-bg border border-border/80">
              <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm text-text leading-relaxed font-medium">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. EMERGENCY PROTOCOL & HELPLINE */}
      <div className="bg-primary/5 rounded-3xl border border-primary/20 p-8 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <PhoneCall className="w-5 h-5" />
              <span>Need Emergency or Incident Support?</span>
            </div>
            <h4 className="font-heading font-bold text-xl text-text mt-1.5">
              24/7 Safety Desk & Helpline
            </h4>
            <p className="text-xs sm:text-sm text-text-muted mt-2 max-w-xl leading-relaxed">
              If you encounter a medical emergency or feel unsafe during an active Tripzobox journey, contact local emergency services immediately and alert our incident team.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link to="/contact">
              <Button variant="primary" size="md">
                Contact Safety Desk
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SafetyPage;
