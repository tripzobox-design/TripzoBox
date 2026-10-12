import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="flex flex-col text-left max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="font-heading font-extrabold text-3xl text-text">
          Privacy Policy
        </h1>
        <p className="text-xs text-text-muted mt-1">Last Updated: October 2026</p>
      </div>

      <div className="bg-white rounded-3xl border border-border p-8 shadow-card space-y-6 text-sm text-text-muted leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text">1. Privacy by Architecture</h3>
          <p>
            Tripzobox is built around privacy-first defaults. Documents added to your Travel Vault (passports, identity cards, boarding passes) are stored on your local device and are never automatically shared with third-party advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text">2. Information You Choose to Share</h3>
          <p>
            When you join public trips or publish travel stories, your public profile name, bio, and chosen travel photographs become visible to the community. You can modify profile visibility in your Account Settings at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text">3. Travel Vault Security</h3>
          <p>
            Travel Vault documents can be designated as private, trusted-contacts, or offline-available. Offline cached items reside solely in your client browser storage.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text">4. Data Deletion</h3>
          <p>
            You have the right to erase your local data and reset all stored preferences using the Delete Account option in your Profile Settings.
          </p>
        </section>
      </div>
    </div>
  );
};
