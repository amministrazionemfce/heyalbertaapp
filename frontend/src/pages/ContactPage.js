import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ROUTES, DASHBOARD_ADD_LISTING } from '../constants';
import { useAuth } from '../lib/auth';
import { contactAPI, siteAPI } from '../lib/api';
import { useSEO } from '../hooks/useSEO';
import { getApiErrorLines } from '../lib/formatApiError';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';

/** Google Maps embed — Calgary, Alberta (no API key). */
const CALGARY_MAP_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d160032.71839949835!2d-114.3175681!3d51.0447334!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x537170039f843fd5%3A0xa266dfa8c666e924!2sCalgary%2C%20AB%2C%20Canada!5e0!3m2!1sen!2sca!4v1708646400000!5m2!1sen!2sca';

const emptyForm = () => ({
  name: '',
  businessName: '',
  email: '',
  businessAddress: '',
  subject: '',
  message: '',
});

export default function ContactPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inquiryType, setInquiryType] = useState('newcomer'); // 'newcomer' | 'business'
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [settings, setSettings] = useState(null);

  useSEO({
    title: 'Contact Us',
    description: 'Get in touch with Hey Alberta. Whether you\'re a newcomer looking for services or a business interested in partnering with us, we\'d love to hear from you.',
  });

  useEffect(() => {
    let cancelled = false;
    siteAPI
      .settings()
      .then((res) => {
        if (!cancelled) setSettings(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const DEFAULT_CONTACT_HERO = '/support.png';
  const heroRaw = settings?.contactHeroImage?.trim();
  const heroSrc = heroRaw ? resolveMediaUrl(heroRaw) || heroRaw : DEFAULT_CONTACT_HERO;

  const labels =
    inquiryType === 'business'
      ? {
          name: 'Your name',
          businessName: 'Business name',
          email: 'Email address',
          businessAddress: 'Business address',
          subject: 'Subject',
          message: 'Message',
        }
      : {
          name: 'Your name',
          email: 'Email address',
          subject: 'Subject',
          message: 'How can we help?',
        };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inquiryType === 'business') {
      if (!(form.businessName || '').trim() || !(form.businessAddress || '').trim()) {
        toast.error('Please fill in business name and business address.');
        return;
      }
    }
    setSending(true);
    try {
      await contactAPI.submit({
        inquiryType,
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        businessName: (form.businessName || '').trim(),
        businessAddress: (form.businessAddress || '').trim(),
      });
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setForm(emptyForm());
    } catch (err) {
      const lines = getApiErrorLines(err);
      toast.error(lines[0] || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleAddListingsClick = () => {
    if (!user) {
      navigate(ROUTES.REGISTER);
      return;
    }
    if (user.role === 'vendor' || user.role === 'admin') {
      navigate(DASHBOARD_ADD_LISTING);
      return;
    }
  };

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-slate-50" data-testid="contact-page">
      <section className="relative flex min-h-[340px] items-center overflow-hidden md:min-h-[400px] lg:min-h-[460px]">
        <img src={heroSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
        
      </section>

      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm shadow-slate-900/5 p-6 md:p-9">
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                <div>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 leading-[1.35] md:leading-[1.4]">
                    What can we help you with?
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">Choose one option — the form fields update below.</p>
                </div>

                <fieldset className="space-y-3 border-0 p-0 m-0">
                  <legend className="sr-only">I am a</legend>
                  <label className="flex items-start gap-3 cursor-pointer group rounded-xl border border-transparent p-2 -m-2 hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="inquiry-type"
                      checked={inquiryType === 'newcomer'}
                      onChange={() => setInquiryType('newcomer')}
                      className="mt-1 h-4 w-4 shrink-0 accent-spruce-700 border-slate-300"
                    />
                    <span className="text-sm md:text-base text-slate-800 leading-snug">
                      I&apos;m a newcomer / user needing help
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group rounded-xl border border-transparent p-2 -m-2 hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="inquiry-type"
                      checked={inquiryType === 'business'}
                      onChange={() => setInquiryType('business')}
                      className="mt-1 h-4 w-4 shrink-0 accent-spruce-700 border-slate-300"
                    />
                    <span className="text-sm md:text-base text-slate-800 leading-snug">
                      I&apos;m a local company / business partner
                    </span>
                  </label>
                </fieldset>

                <div className="h-px bg-slate-100" aria-hidden />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="contact-name">{labels.name}</Label>
                    <Input
                      id="contact-name"
                      value={form.name}
                      onChange={setField('name')}
                      required
                      className="mt-1.5 h-11"
                      data-testid="contact-name"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email">{labels.email}</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={setField('email')}
                      required
                      className="mt-1.5 h-11"
                      data-testid="contact-email"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {inquiryType === 'business' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <Label htmlFor="contact-business-name">{labels.businessName}</Label>
                      <Input
                        id="contact-business-name"
                        value={form.businessName}
                        onChange={setField('businessName')}
                        required
                        className="mt-1.5 h-11"
                        data-testid="contact-business-name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="contact-business-address">{labels.businessAddress}</Label>
                      <Input
                        id="contact-business-address"
                        value={form.businessAddress}
                        onChange={setField('businessAddress')}
                        required
                        className="mt-1.5 h-11"
                        data-testid="contact-business-address"
                        placeholder="Street, city, postal code"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="contact-subject">{labels.subject}</Label>
                  <Input
                    id="contact-subject"
                    value={form.subject}
                    onChange={setField('subject')}
                    required
                    className="mt-1.5 h-11"
                    data-testid="contact-subject"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-message">{labels.message}</Label>
                  <Textarea
                    id="contact-message"
                    value={form.message}
                    onChange={setField('message')}
                    required
                    rows={6}
                    className="mt-1.5 min-h-[140px] resize-y"
                    data-testid="contact-message"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="bg-spruce-700 hover:bg-spruce-800 text-white h-11 px-6"
                  data-testid="contact-submit-btn"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send message
                </Button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 md:p-7">
              <h3 className="font-heading font-semibold text-lg mb-5 text-slate-900">Get in touch</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-spruce-50 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-spruce-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Email</p>
                    <a href="mailto:hello@heyalberta.ca" className="text-sm text-slate-600 hover:text-spruce-700">
                      hello@heyalberta.ca
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-spruce-50 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-spruce-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Phone</p>
                    <a href="tel:+14035550100" className="text-sm text-slate-600 hover:text-spruce-700">
                      (403) 555-0100
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-spruce-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-spruce-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Location</p>
                    <p className="text-sm text-slate-600">Calgary, Alberta, Canada</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-spruce-800 to-spruce-900 rounded-2xl p-6 md:p-7 text-white shadow-lg shadow-spruce-900/20">
              <h3 className="font-heading font-semibold text-lg mb-3">For vendors</h3>
              <p className="text-sm text-spruce-100/95 leading-relaxed mb-5">
                Interested in listing your business? We offer free and premium plans to connect you with newcomers to Alberta.
              </p>
              <Button
                type="button"
                onClick={handleAddListingsClick}
                variant="secondary"
                className="w-full bg-white text-spruce-900 hover:bg-spruce-50"
              >
                Get listed
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section className="w-full border-t border-slate-200 bg-slate-100/80" aria-label="Map of Calgary">
        <div className="w-full h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px]">
          <iframe
            title="Calgary, Alberta on Google Maps"
            src={CALGARY_MAP_EMBED_SRC}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>
    </div>
  );
}
