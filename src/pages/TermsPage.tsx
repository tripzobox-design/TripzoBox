import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="flex flex-col text-left max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="font-heading font-extrabold text-3xl text-text">
          Terms of Service
        </h1>
        <p className="text-xs text-text-muted mt-1">Last Updated: October 2026</p>
      </div>

      <div className="bg-white rounded-3xl border border-border p-8 shadow-card space-y-6 text-sm text-text-muted leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text">1. Acceptance of Terms</h3>
          <p>
            By accessing or using Tripzobox, you agree to be bound by these Terms of Service. If you disagree with any portion of these terms, you may not use our community services.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text">2. Community Conduct</h3>
          <p>
            Tripzobox facilitates group travel discovery and personal travel journaling. Users agree to engage with respect and honesty. You may not impersonate others, submit fraudulent identification proofs, or harass any community members.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text">3. Travel Risk Assumption</h3>
          <p>
            Travel inherently carries physical and environmental risks. Tripzobox does not provide tour operator services, emergency medical dispatch, or transportation guarantees. Participants are responsible for their own safety and insurance.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text">4. Limitation of Liability</h3>
          <p>
            In no event shall Tripzobox or its contributors be liable for personal injury, lost property, travel delays, or disputes arising between independent travellers.
          </p>
        </section>
      </div>
    </div>
  );
};
