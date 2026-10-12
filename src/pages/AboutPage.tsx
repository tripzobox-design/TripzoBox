import React from 'react';
import { Heart, Compass, Users } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="flex flex-col text-left max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div>
        <span className="text-xs font-bold text-primary tracking-wider uppercase font-heading">
          Our Story
        </span>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-text mt-2">
          About Tripzobox
        </h1>
        <p className="text-base text-text-muted mt-3 leading-relaxed">
          Tripzobox was founded with a singular conviction: travel is profoundly transformed not just by where you go, but by who you meet along the way.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-border p-8 shadow-card space-y-6 text-sm text-text-muted leading-relaxed">
        <h3 className="font-heading font-bold text-xl text-text">
          Our Brand Mission
        </h3>
        <p>
          Too many travel platforms focus solely on commercial bookings, luxury ads, and anonymous reviews. Tripzobox brings travel back to authentic human connection: small groups of compatible wanderers discovering misty mountain plantations in Munnar, shared cliffside dinners in Varkala, and real stories that give practical, truthful advice.
        </p>
        <p>
          Whether you are a solo traveler seeking like-minded companions, a seasoned trekker eager to lead small expeditions, or someone who loves journaling private moments and sharing them with the world, Tripzobox is your travel home.
        </p>

        <div className="pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <span className="font-heading font-extrabold text-3xl text-primary block">
              100%
            </span>
            <span className="text-xs text-text-muted mt-1 block">Community Powered</span>
          </div>
          <div>
            <span className="font-heading font-extrabold text-3xl text-primary block">
              8+
            </span>
            <span className="text-xs text-text-muted mt-1 block">Curated Destinations</span>
          </div>
          <div>
            <span className="font-heading font-extrabold text-3xl text-primary block">
              Private
            </span>
            <span className="text-xs text-text-muted mt-1 block">Default Vault Privacy</span>
          </div>
        </div>
      </div>

      <div id="contact" className="bg-light-bg rounded-2xl border border-border p-6 text-xs sm:text-sm text-text-muted">
        <h4 className="font-heading font-bold text-base text-text mb-2">Get in Touch</h4>
        <p>Have questions, ideas or feedback? Reach our team at <a href="mailto:hello@tripzobox.com" className="text-primary font-semibold hover:underline">hello@tripzobox.com</a>.</p>
      </div>
    </div>
  );
};
