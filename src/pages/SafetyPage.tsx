import React from 'react';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, Users } from 'lucide-react';

export const SafetyPage: React.FC = () => {
  return (
    <div className="flex flex-col text-left max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div>
        <span className="text-xs font-bold text-primary tracking-wider uppercase font-heading">
          Trust & Safety Center
        </span>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-text mt-2">
          Safety, Trust & Privacy Principles
        </h1>
        <p className="text-base text-text-muted mt-3 leading-relaxed">
          At Tripzobox, traveller safety is our guiding architecture. We design every interaction so you retain full control over your private records, identity, and group participation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-3">
          <div className="w-10 h-10 rounded-xl bg-accent/40 text-primary flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-text">
            Private By Default
          </h3>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Your Travel Vault documents and diary entries are strictly confidential. You explicitly select what items can be viewed by approved travel companions.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-3">
          <div className="w-10 h-10 rounded-xl bg-accent/40 text-primary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-text">
            Leader Review & Approval
          </h3>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Joining trips is not automatic open enrollment. Trip leaders inspect member profiles and mutual compatibility before confirming group membership.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-3">
          <div className="w-10 h-10 rounded-xl bg-accent/40 text-primary flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-text">
            Preference Fit, Not Safety Guarantee
          </h3>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Our compatibility score evaluates shared travel styles (such as hiking pace, budget, and culinary interests). It serves as a helpful compatibility indicator, not an infallible safety warranty.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-3">
          <div className="w-10 h-10 rounded-xl bg-accent/40 text-primary flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-text">
            Zero-Tolerance Community Rules
          </h3>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Harassment, discriminatory conduct, commercial spam, or deceptive profiles result in immediate account suspension. All members can report violations in one tap.
          </p>
        </div>
      </div>

      <div id="community-rules" className="bg-white rounded-3xl border border-border p-8 shadow-subtle space-y-6">
        <h3 className="font-heading font-bold text-xl text-text">
          Community Guidelines for Group Trips
        </h3>
        <ul className="space-y-4 text-sm text-text-muted">
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span><strong className="text-text">Respect Individual Boundaries:</strong> Group trips thrive on mutual courtesy. Respect quiet hours, personal space, and dietary choices.</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span><strong className="text-text">Share Emergency Details:</strong> Always keep at least one primary emergency contact up-to-date in your Travel Vault before setting off.</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span><strong className="text-text">Transparent Cost Splitting:</strong> All group expenses must be communicated openly in advance with no hidden commercial markups.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
