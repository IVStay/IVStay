import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, MessageCircle, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BUSINESS, whatsappLink } from '../config/contact';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Button } from '../components/ui/Button';
import { submitEnquiry, type EnquiryKind } from '../lib/db';
import { supabase } from '../lib/supabase';
import { isValidPhone, PHONE_ERROR, PHONE_REQUIRED } from '../lib/phone';

const field =
  'w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate';
const label = 'block text-xs font-semibold text-slate-600 mb-1.5';

export const ContactPage: React.FC = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [kind, setKind] = useState<EnquiryKind>(params.get('type') === 'list' ? 'list_property' : 'contact');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = 'Contact us | IvStay';
    return () => {
      document.title = 'IvStay | Luxury Villas, Boutique BnBs & Hotels';
    };
  }, []);

  useEffect(() => {
    setKind(params.get('type') === 'list' ? 'list_property' : 'contact');
  }, [params]);

  useEffect(() => {
    if (!user) return;
    setName((v) => v || user.full_name);
    setPhone((v) => v || user.phone || '');
    setEmail((v) => v || user.email);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isListing = kind === 'list_property';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError('Please enter your name.');
    if (!phone) return setError(PHONE_REQUIRED);
    if (!isValidPhone(phone)) return setError(PHONE_ERROR);
    if (message.trim().length < 5) {
      return setError(isListing ? 'Tell us a little about your property.' : 'Please write your message.');
    }
    if (!supabase) {
      // Browser-only mode (no database): hand over to WhatsApp instead
      window.open(whatsappLink(`${name.trim()} (${phone}): ${message.trim()}`), '_blank', 'noopener');
      setSent(true);
      return;
    }
    setBusy(true);
    try {
      await submitEnquiry({ kind, name: name.trim(), phone, email: email.trim(), message: message.trim() });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const channels = [
    {
      icon: Phone,
      title: 'Call us',
      detail: BUSINESS.phoneDisplay,
      href: `tel:${BUSINESS.phoneDisplay.replace(/\s/g, '')}`,
      note: 'Talk to our team directly',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      detail: 'Chat with our team',
      href: whatsappLink('Hi IvStay, I have a question.'),
      note: 'Quickest for booking questions',
      external: true,
    },
    {
      icon: Mail,
      title: 'Email',
      detail: BUSINESS.email,
      href: `mailto:${BUSINESS.email}`,
      note: 'Best for longer questions',
    },
  ];

  return (
    <div className="bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">Contact</p>
          <h1 className="font-serif text-4xl font-bold text-brand-slate mt-2">We're here to help</h1>
          <p className="text-slate-600 mt-3 leading-relaxed">
            Questions about a stay, a booking you've made, or a property you'd like to list with us? Reach us however
            suits you best.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {channels.map(({ icon: Icon, title, detail, href, note, external }) => (
            <a
              key={title}
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-slate transition-colors"
            >
              <Icon className="w-5 h-5 text-brand-gold" />
              <p className="font-semibold text-brand-slate mt-3">{title}</p>
              <p className="text-sm text-slate-700 group-hover:underline break-all">{detail}</p>
              <p className="text-xs text-slate-400 mt-1">{note}</p>
            </a>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8">
            {sent ? (
              <div className="text-center py-10 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h2 className="font-serif text-2xl font-bold text-brand-slate">Thank you, {name.split(' ')[0]}!</h2>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  We've received your message and will get back to you on {phone} soon.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setMessage('');
                  }}
                  className="text-xs font-semibold text-brand-gold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-5">
                <div className="grid grid-cols-2 bg-slate-100 rounded-full p-1 text-sm font-semibold" role="tablist">
                  {(
                    [
                      ['contact', 'Ask a question'],
                      ['list_property', 'List your property'],
                    ] as const
                  ).map(([value, text]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={kind === value}
                      onClick={() => setKind(value)}
                      className={`py-2 rounded-full transition-colors ${
                        kind === value ? 'bg-white text-brand-slate shadow-sm' : 'text-slate-500 hover:text-brand-slate'
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="c-name" className={label}>
                      Full name
                    </label>
                    <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
                  </div>
                  <div>
                    <label htmlFor="c-phone" className={label}>
                      Phone number
                    </label>
                    <PhoneInput id="c-phone" value={phone} onChange={setPhone} required />
                  </div>
                </div>
                <div>
                  <label htmlFor="c-email" className={label}>
                    Email <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="c-message" className={label}>
                    {isListing ? 'About your property' : 'Your message'}
                  </label>
                  <textarea
                    id="c-message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={4000}
                    placeholder={
                      isListing
                        ? 'Where is it, what type of property (villa, cottage, BnB, hotel), how many bedrooms, and a link to photos if you have one.'
                        : 'How can we help?'
                    }
                    className={`${field} resize-y`}
                  />
                </div>
                {error && (
                  <p role="alert" className="text-xs font-semibold text-rose-600">
                    {error}
                  </p>
                )}
                <Button type="submit" variant="primary" isLoading={busy} className="w-full sm:w-auto px-10">
                  {isListing ? 'Send property details' : 'Send message'}
                </Button>
              </form>
            )}
          </div>

          <aside className="bg-brand-slate text-white rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="font-serif text-2xl font-bold">List your property with IvStay</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Own a villa, cottage, BnB or boutique hotel? Tell us about it and our team will call you to talk through
              how listing with IvStay works.
            </p>
            <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
              <li>We handle guest enquiries, bookings and follow-ups.</li>
              <li>Your prices, house rules and blocked dates stay in your control.</li>
              <li>A real person to talk to, not a ticket queue.</li>
            </ul>
            {!isListing && (
              <button
                type="button"
                onClick={() => setKind('list_property')}
                className="text-sm font-semibold text-brand-gold hover:underline"
              >
                Tell us about your property →
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
