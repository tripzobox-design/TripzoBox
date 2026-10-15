import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Users, Shield, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const HowItWorksPage: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      num: '01',
      title: 'Discover or Create a Trip',
      shortDesc: 'Explore open trips or plan your own route, dates, and budget.',
      desc: 'Browse open itineraries organized by passionate travellers across scenic destinations like Munnar, Varkala, and Goa. Or initiate your own journey, set dates, estimated budget, and travel preferences.',
      icon: Compass,
    },
    {
      num: '02',
      title: 'Match with Compatible Travellers',
      shortDesc: 'Find people with shared interests and request to join their trip.',
      desc: 'View traveler profiles, communication languages, and preference fit scores. Request to join or review incoming requests. Group leaders confirm spots to ensure harmonious dynamics.',
      icon: Users,
    },
    {
      num: '03',
      title: 'Secure Your Travel Vault',
      shortDesc: 'Keep your original IDs, tickets, and bookings available offline.',
      desc: 'Keep digital copies of IDs, tickets, and bookings securely cached on your device. Easily share emergency contacts and verified documents with fellow companions without cloud leak risks.',
      icon: Shield,
    },
    {
      num: '04',
      title: 'Record & Share Your Diary',
      shortDesc: 'Save your memories and turn them into stories for other travellers.',
      desc: 'Log private impressions, secret trails, photo memories, and authentic costs during your trip. Whenever ready, compose them into inspiring public travel stories for the community.',
      icon: BookOpen,
    },
  ];

  return (
    <div className="flex flex-col text-left max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-12 space-y-5 lg:space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold text-primary tracking-wider uppercase font-heading">
          Simple, Transparent & Community-First
        </span>
        <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-text mt-2">
          How Tripzobox Works
        </h1>
        <p className="text-base text-text-muted mt-4 leading-relaxed">
          From finding the right trek companions to keeping your identity proofs handy offline, here is your roadmap to stress-free, memorable travel.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-8">
        {steps.map((step) => {
          const IconComp = step.icon;
          return (
            <div
              key={step.num}
              className="min-w-0 bg-white rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-8 border border-border shadow-card flex flex-col"
            >
              <div>
                <div className="flex items-center justify-between mb-3 lg:mb-6">
                  <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-accent/40 text-primary flex items-center justify-center">
                    <IconComp className="w-5 h-5 lg:w-6 lg:h-6 stroke-[2]" />
                  </div>
                  <span className="font-heading font-extrabold text-lg lg:text-2xl text-text-subtle">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-sm sm:text-base lg:text-xl text-text leading-snug">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-text-muted mt-2 lg:mt-3 leading-relaxed">
                  <span className="lg:hidden">{step.shortDesc}</span><span className="hidden lg:inline">{step.desc}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-3xl p-8 sm:p-12 text-center text-white">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl text-white">
          Ready to embark on your first journey?
        </h3>
        <p className="text-sm sm:text-base text-gray-100 max-w-lg mx-auto mt-2">
          Create your traveller profile today and explore open groups in South India and beyond.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button
            variant="outline-white"
            onClick={() => navigate('/signup')}
            className="bg-white text-primary border-transparent hover:bg-gray-100"
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
};
