import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  HelpCircle,
  PhoneCall,
  Clock,
  Send,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Trip Support');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      showToast('Your message has been received! We will reply within 2 hours.', 'success');
    }, 700);
  };

  const contactChannels = [
    {
      icon: MessageSquare,
      title: 'Community & Trip Support',
      desc: 'Questions about trip requests, leader verification, or travel diary stories.',
      email: 'support@tripzobox.com',
      responseTime: '< 2 Hours',
    },
    {
      icon: PhoneCall,
      title: 'Trust & Safety Hotline',
      desc: 'Urgent issues during active group trips or community code violations.',
      email: 'safety@tripzobox.com',
      responseTime: '24/7 Monitored',
    },
    {
      icon: Mail,
      title: 'Partnerships & Press',
      desc: 'Collaborations with eco-homestays, gear partners, and travel journalists.',
      email: 'partners@tripzobox.com',
      responseTime: 'Within 24 Hours',
    },
  ];

  return (
    <div className="flex flex-col text-left max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      {/* 1. HERO */}
      <div className="relative bg-gradient-to-br from-primary/10 via-accent/20 to-light-bg rounded-3xl p-8 sm:p-12 border border-border">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase font-heading mb-4">
            <HelpCircle className="w-4 h-4" />
            <span>Support & Assistance</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-text tracking-tight">
            Contact & Support
          </h1>
          <p className="text-sm sm:text-base text-text-muted mt-4 leading-relaxed font-body">
            Have questions about planning a trip, organizing your Travel Vault, or resolving a group inquiry? Our support specialists are here to help.
          </p>
        </div>
      </div>

      {/* 2. CHANNELS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contactChannels.map((channel) => {
          const Icon = channel.icon;
          return (
            <div
              key={channel.title}
              className="bg-white rounded-3xl border border-border p-6 shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-accent/35 text-primary flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 stroke-[1.75]" />
                </div>
                <h3 className="font-heading font-bold text-base text-text">{channel.title}</h3>
                <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{channel.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/80">
                <a
                  href={`mailto:${channel.email}`}
                  className="text-xs sm:text-sm font-semibold text-primary hover:underline block truncate"
                >
                  {channel.email}
                </a>
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-1">
                  <Clock className="w-3.5 h-3.5 text-text-subtle" />
                  <span>Avg Response: {channel.responseTime}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. SUPPORT FORM & FAQS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Support Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-card">
          <h3 className="font-heading font-bold text-xl sm:text-2xl text-text mb-2">
            Send Us a Message
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mb-6">
            Fill out the form below and a member of our community support team will reach out.
          </p>

          {isSent ? (
            <div className="p-8 text-center bg-light-bg rounded-2xl border border-border space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-lg text-text">Thank You, {name}!</h4>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Your message has been safely logged. We sent an acknowledgment email to <span className="font-semibold text-text">{email}</span>.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsSent(false);
                  setName('');
                  setEmail('');
                  setMessage('');
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya Sharma"
                    className="w-full bg-light-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-accent/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maya@example.com"
                    className="w-full bg-light-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-accent/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-light-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-accent/40"
                >
                  <option value="Trip Support">Trip Support & Joining Requests</option>
                  <option value="Travel Vault">Travel Vault & Security Inquiries</option>
                  <option value="Community Violation">Report Community Violation</option>
                  <option value="Account & Login">Account & Login Help</option>
                  <option value="Feedback">Product Feedback or Suggestion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                  Your Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or issue in detail..."
                  className="w-full bg-light-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-accent/40 resize-none"
                />
              </div>

              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isSubmitting}
                className="w-full py-3"
                icon={<Send className="w-4 h-4" />}
              >
                Send Message
              </Button>
            </form>
          )}
        </div>

        {/* Office & FAQ Aside */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-border p-6 shadow-card space-y-4">
            <h4 className="font-heading font-bold text-base text-text">
              Community Headquarters
            </h4>
            <div className="flex items-start gap-3 text-xs text-text-muted">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>Tripzobox Community Hub, Indiranagar, Bengaluru, Karnataka 560038</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-text-muted">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>Office Hours: Mon – Sat, 9:00 AM – 7:00 PM IST (Emergency Desk is 24/7)</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-border p-6 shadow-card space-y-4">
            <h4 className="font-heading font-bold text-base text-text">
              Quick FAQ
            </h4>
            <div className="space-y-3 text-xs text-text-muted">
              <div>
                <strong className="text-text block mb-0.5">How do I verify my profile?</strong>
                <span>Upload a valid phone number and government ID to earn the Verified Traveler badge.</span>
              </div>
              <div className="pt-2 border-t border-border/80">
                <strong className="text-text block mb-0.5">Can I cancel a trip I joined?</strong>
                <span>Yes, you can leave any trip at least 72 hours prior from your Trip Details page.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ContactPage;
