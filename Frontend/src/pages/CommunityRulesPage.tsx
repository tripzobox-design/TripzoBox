import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  HeartHandshake,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Flag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const CommunityRulesPage: React.FC = () => {
  const coreRules = [
    {
      title: 'Authentic Identity & Zero Impersonation',
      description:
        'Every profile must represent a real individual. Using fake photos, deceptive bios, or pretending to be an organization or licensed tour agency is strictly prohibited.',
      dos: [
        'Use genuine profile pictures and honest travel bio',
        'Accurately state your travel style, pace, and interests',
      ],
      donts: [
        'No stock photos, celebrity images, or impersonation',
        'No creating duplicate or spam accounts',
      ],
    },
    {
      title: 'Respectful Group Chemistry & Boundaries',
      description:
        'Tripzobox brings diverse individuals together. Group trips require emotional maturity, consideration of personal space, and proactive respect for differing cultures and backgrounds.',
      dos: [
        'Respect quiet hours, private accommodations, and personal boundaries',
        'Communicate open-mindedly when group preferences differ',
      ],
      donts: [
        'Zero tolerance for discriminatory speech, racism, sexism, or hate',
        'No non-consensual photography or intrusive behavior',
      ],
    },
    {
      title: 'Transparent & Fair Cost Splitting',
      description:
        'Trips on Tripzobox are collaborative community adventures, not commercial tour packages with unannounced surcharges. Financial clarity keeps groups trustworthy.',
      dos: [
        'Agree on shared costs (cabs, homestays, meals) prior to departure',
        'Keep clear records and settle shared expenses promptly',
      ],
      donts: [
        'No hidden commercial markups by trip leaders without full disclosure',
        'No pressuring members into unplanned expensive activities',
      ],
    },
    {
      title: 'Reliability & Punctuality',
      description:
        'When you commit to joining a trip or accepting members as a leader, other travelers plan their schedules and bookings around you.',
      dos: [
        'Inform your leader and group at least 72 hours prior if your plans change',
        'Arrive promptly at agreed meetup spots, railway stations, or trailheads',
      ],
      donts: [
        'No ghosting trip members on departure day',
        'No leaving the group in hazardous terrain without leader agreement',
      ],
    },
  ];

  const zeroToleranceItems = [
    {
      title: 'Harassment & Unsolicited Advances',
      desc: 'Any unwanted sexual attention, persistent unreciprocated messaging, stalking, or intimidation leads to an instant, permanent account ban.',
    },
    {
      title: 'Financial Extortion & Fraud',
      desc: 'Soliciting loans, running deceptive investment pitches, or asking members to transfer money outside agreed travel expenses is banned.',
    },
    {
      title: 'Commercial Spam & Unauthorized Tours',
      desc: 'Tripzobox is for real travelers. Commercial tour operators masquerading as organic community leaders are barred without verified commercial partner status.',
    },
    {
      title: 'Endangering Group Safety',
      desc: 'Bringing illicit substances, brandishing weapons, or recklessly endangering others on treks or watersports results in immediate removal and local authority escalation.',
    },
  ];

  return (
    <div className="flex flex-col text-left w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10">
      {/* 1. HEADER HERO */}
      <div className="relative bg-gradient-to-br from-primary/10 via-accent/20 to-light-bg rounded-3xl p-6 sm:p-10 border border-border grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase font-heading mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Community Standards</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-text tracking-tight">
            Tripzobox Community Rules
          </h1>
          <p className="text-sm sm:text-base text-text-muted mt-4 leading-relaxed font-body">
            Tripzobox is founded on mutual trust and real camaraderie. These guidelines define the commitments every member makes so all journeys remain welcoming, safe, and memorable.
          </p>
        </div>
        <div className="rounded-2xl bg-white/85 border border-white p-5 sm:p-6 shadow-subtle">
          <div className="flex items-center gap-2 text-primary mb-4">
            <HeartHandshake className="w-5 h-5" />
            <h2 className="font-heading font-bold text-base">A better journey starts with us</h2>
          </div>
          <ul className="space-y-3 text-sm text-text">
            {[
              'Be honest about who you are and how you travel.',
              'Agree on plans, costs, and boundaries together.',
              'Look out for your group and respect local communities.',
            ].map((commitment) => (
              <li key={commitment} className="flex items-start gap-2.5 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-1" />
                <span>{commitment}</span>
              </li>
            ))}
          </ul>
          <Link to="/safety" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover mt-5">
            Explore our safety guidelines <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <section aria-labelledby="travel-checklist-title" className="space-y-4">
        <div>
          <h2 id="travel-checklist-title" className="font-heading font-bold text-xl sm:text-2xl text-text">Good habits for every adventure</h2>
          <p className="text-sm text-text-muted mt-1">Small steps that help everyone travel with confidence.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Users, title: 'Before you join', description: 'Introduce yourself, discuss the itinerary and fitness expectations, and confirm what the shared budget includes.' },
            { icon: HeartHandshake, title: 'While you travel', description: 'Ask before taking or sharing photos, check in with your companions, and leave shared spaces and trails clean.' },
            { icon: Sparkles, title: 'After the trip', description: 'Settle agreed expenses, share honest and constructive feedback, and ask permission before posting group memories.' },
          ].map(({ icon: Icon, title, description }) => (
            <article key={title} className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
              <div className="rounded-xl bg-primary/10 text-primary p-2.5 shrink-0"><Icon className="w-5 h-5" /></div>
              <div>
                <h3 className="font-heading font-bold text-base text-text">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed mt-2">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 2. THE 4 PILLARS */}
      <div className="space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text">
            Four Core Standards of Conduct
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Expected from every traveler and trip leader across all interactions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coreRules.map((rule, idx) => (
            <div
              key={rule.title}
              className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-xl bg-primary text-white font-heading font-bold text-sm flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="font-heading font-bold text-lg text-text">
                    {rule.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
                  {rule.description}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/80">
                {rule.dos.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-xs text-text">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
                {rule.donts.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-xs text-red-600">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ZERO TOLERANCE POLICY */}
      <div className="bg-red-50/60 rounded-3xl border border-red-200/80 p-8 sm:p-10 space-y-6">
        <div className="flex items-center gap-3 text-red-700">
          <AlertOctagon className="w-6 h-6 shrink-0" />
          <h3 className="font-heading font-bold text-xl sm:text-2xl text-red-900">
            Zero-Tolerance Violations
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-red-800 leading-relaxed max-w-3xl">
          The following behaviors result in immediate account suspension, permanent removal from ongoing trips, and referral to law enforcement when appropriate.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {zeroToleranceItems.map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-5 border border-red-100 shadow-xs">
              <h4 className="font-heading font-bold text-sm text-red-900">{item.title}</h4>
              <p className="text-xs text-red-700/90 mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. ENFORCEMENT & REPORTING */}
      <div className="bg-white rounded-3xl border border-border p-8 sm:p-10 shadow-card grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <span className="text-xs font-bold text-primary tracking-wider uppercase font-heading">
            Accountability & Safety
          </span>
          <h3 className="font-heading font-bold text-2xl text-text mt-1.5">
            How Violations Are Handled
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mt-3 leading-relaxed">
            Every member has the power to keep our community safe. If someone behaves inappropriately before or during a trip, reporting takes less than 30 seconds.
          </p>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3">
              <Flag className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-semibold text-text">1-Tap In-App Flagging</h5>
                <p className="text-xs text-text-muted">Report any message, profile, or trip directly from the app interface.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-semibold text-text">Human Review Within 2 Hours</h5>
                <p className="text-xs text-text-muted">Our safety response moderators evaluate reports 24/7 with strict confidentiality.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-light-bg rounded-2xl border border-border p-6 text-left flex flex-col justify-between h-full">
          <div>
            <h4 className="font-heading font-bold text-base text-text">
              Have an Incident to Report?
            </h4>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              If you experienced a violation of our community standards on a recent trip or via private chat, reach our dedicated Trust & Safety desk immediately.
            </p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link to="/contact">
              <Button variant="primary" size="sm" className="w-full sm:w-auto">
                Contact Safety Team
              </Button>
            </Link>
            <Link to="/safety">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                Read Safety Guidelines
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CommunityRulesPage;
