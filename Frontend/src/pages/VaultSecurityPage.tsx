import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Key,
  FileCheck,
  EyeOff,
  WifiOff,
  Share2,
  HardDriveDownload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const VaultSecurityPage: React.FC = () => {
  const securityPillars = [
    {
      icon: Lock,
      title: 'Zero-Knowledge Architecture',
      description:
        'Your sensitive records—passports, visa stamps, national IDs, and tickets—are encrypted on your device. Even Tripzobox system administrators cannot view your raw document files.',
    },
    {
      icon: EyeOff,
      title: 'Strictly Private by Default',
      description:
        'Every uploaded document is marked 100% private. Nothing is ever indexed publicly or shared with other travelers unless you explicitly select it and grant timed access.',
    },
    {
      icon: Share2,
      title: 'Granular, Revocable Sharing',
      description:
        'When a trek or national park permit requires proof of ID, share only that specific permit document with your confirmed trip leader. Revoke access with a single tap anytime.',
    },
    {
      icon: WifiOff,
      title: 'Offline Emergency Cache',
      description:
        'Traveling through high Himalayan passes or remote Kerala tea valleys with no cell reception? Your Vault caches emergency medical notes, insurance policies, and ICE contacts offline.',
    },
  ];

  const documentTypes = [
    {
      name: 'Passports & National IDs',
      badge: 'High Security',
      desc: 'Encrypted storage with optional watermarking for hotel check-ins and forest checkposts.',
    },
    {
      name: 'Visas, Permits & Inner Line Passes',
      badge: 'Protected',
      desc: 'Organized with validity alerts so you never get stranded at border crossings.',
    },
    {
      name: 'Flight, Train & Bus Tickets',
      badge: 'Travel Transit',
      desc: 'Instant QR code and PNR retrieval accessible with zero internet connectivity.',
    },
    {
      name: 'Emergency Medical & Insurance Policies',
      badge: 'Critical ICE',
      desc: 'Blood type, allergies, policy numbers, and emergency hospital hotline numbers.',
    },
  ];

  return (
    <div className="flex flex-col text-left max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-14 space-y-4 lg:space-y-12">
      {/* 1. HERO */}
      <div className="relative bg-gradient-to-br from-primary/10 via-accent/20 to-light-bg rounded-3xl p-5 sm:p-6 lg:p-12 border border-border">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase font-heading mb-4">
            <Shield className="w-4 h-4" />
            <span>Bank-Grade Travel Privacy</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-text tracking-tight">
            Travel Vault Security
          </h1>
          <p className="text-sm sm:text-base text-text-muted mt-4 leading-relaxed font-body">
            Keep your critical travel identity documents, boarding passes, and emergency numbers safe in one protected, offline-ready vault.
          </p>
          <div className="mt-4 lg:mt-8 flex flex-wrap gap-3 lg:gap-4">
            <Link to="/app/vault">
              <Button variant="primary" size="md">
                Open My Travel Vault
              </Button>
            </Link>
            <Link to="/safety">
              <Button variant="secondary" size="md">
                Safety Guidelines
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. SECURITY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white rounded-2xl border border-border p-5 text-center shadow-card">
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-primary block">
            AES-256
          </span>
          <span className="text-xs text-text-muted mt-1 block">Storage Standard</span>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 text-center shadow-card">
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-primary block">
            0%
          </span>
          <span className="text-xs text-text-muted mt-1 block">Data Sold or Monetized</span>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 text-center shadow-card">
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-primary block">
            100%
          </span>
          <span className="text-xs text-text-muted mt-1 block">Offline Capable</span>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 text-center shadow-card">
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-primary block">
            1-Tap
          </span>
          <span className="text-xs text-text-muted mt-1 block">Revoke Sharing Access</span>
        </div>
      </div>

      {/* 3. CORE ARCHITECTURE PILLARS */}
      <div className="space-y-3 lg:space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text">
            How Your Documents Are Protected
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Built with strict client-side boundaries to protect your travel paperwork across all journeys.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {securityPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="min-w-0 bg-white rounded-2xl lg:rounded-3xl border border-border p-3 sm:p-4 lg:p-8 shadow-card flex flex-col gap-3 lg:gap-4"
              >
                <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-accent/35 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6 stroke-[1.75]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm sm:text-base lg:text-lg text-text leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed mt-2">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DOCUMENT CATEGORIES */}
      <div className="bg-white rounded-3xl border border-border p-8 sm:p-10 shadow-card space-y-6">
        <div>
          <h3 className="font-heading font-bold text-xl sm:text-2xl text-text">
            Organized Specifically for Travel Realities
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Standard cloud drives are cluttered folders. Travel Vault categorizes paperwork for instant verification at border control and check-in desks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documentTypes.map((doc) => (
            <div key={doc.name} className="p-4 rounded-2xl bg-light-bg border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-heading font-bold text-sm text-text">{doc.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/40 text-primary">
                    {doc.badge}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{doc.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. PRIVACY FAQ */}
      <div className="bg-white rounded-3xl border border-border p-8 sm:p-10 shadow-card space-y-6">
        <h3 className="font-heading font-bold text-xl text-text">
          Security Frequently Asked Questions
        </h3>

        <div className="divide-y divide-border text-left">
          <div className="py-4">
            <h4 className="font-heading font-semibold text-sm text-text">
              Does Tripzobox sell my passport or identification info?
            </h4>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              Never. We do not monetize personal data or share user identity files with advertisers, third-party brokers, or data aggregators under any circumstances.
            </p>
          </div>

          <div className="py-4">
            <h4 className="font-heading font-semibold text-sm text-text">
              What happens if I lose my phone on a trek?
            </h4>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              Your offline copies remain protected by your device PIN/biometrics. You can log into Tripzobox on any authorized browser to access your documents and remote-wipe active sessions.
            </p>
          </div>

          <div className="py-4">
            <h4 className="font-heading font-semibold text-sm text-text">
              Can trip companions see all my documents?
            </h4>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              No. Travel companions only see documents you explicitly select and share with that specific trip. Your remaining documents remain entirely private.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VaultSecurityPage;
