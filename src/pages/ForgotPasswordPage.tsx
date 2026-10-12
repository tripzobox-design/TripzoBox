import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid registered email');
      return;
    }

    setError('');
    setSubmitted(true);
    success('Password reset instructions sent to your email!', 'Reset Link Sent');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 text-left">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border p-8 shadow-card">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-accent/40 text-primary flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-text">Check Your Inbox</h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              We have dispatched password recovery instructions to <strong className="text-text">{email}</strong>.
            </p>
            <Button variant="primary" onClick={() => navigate('/login')} className="w-full mt-4">
              Return to Login
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="font-heading font-bold text-2xl text-text">Reset Password</h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1 mb-6">
              Enter your account email to receive a password recovery link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                leftIcon={<Mail className="w-4 h-4 text-text-subtle" />}
                required
              />

              <Button type="submit" variant="primary" size="lg" className="w-full font-semibold">
                Send Reset Link
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
