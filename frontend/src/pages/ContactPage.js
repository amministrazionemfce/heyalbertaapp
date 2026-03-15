import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import {Link} from 'react-router-dom';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending
    setTimeout(() => {
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setForm({ name: '', email: '', subject: '', message: '' });
      setSending(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="contact-page">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl py-12">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-3">Contact Us</h1>
          <p className="text-base md:text-lg text-slate-500">Have questions? We'd love to hear from you.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5" data-testid="contact-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required className="mt-1" data-testid="contact-name" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required className="mt-1" data-testid="contact-email" />
                  </div>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} required className="mt-1" data-testid="contact-subject" />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} required rows={6} className="mt-1" data-testid="contact-message" />
                </div>
                <Button type="submit" disabled={sending} className="bg-spruce-700 hover:bg-spruce-800 text-white" data-testid="contact-submit-btn">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Message
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-heading font-semibold text-lg mb-4">Get in Touch</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-spruce-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a href="mailto:hello@heyalberta.ca" className="text-sm text-muted-foreground hover:text-spruce-700">hello@heyalberta.ca</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-spruce-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a href="tel:+14035550100" className="text-sm text-muted-foreground hover:text-spruce-700">(403) 555-0100</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-spruce-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">Calgary, Alberta, Canada</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-spruce-700 rounded-xl p-6 text-white">
              <h3 className="font-heading font-semibold text-lg mb-3">For Vendors</h3>
              <p className="text-sm text-spruce-100 leading-relaxed mb-4">
                Interested in listing your business? We offer free and premium plans to connect you with newcomers to Alberta.
              </p>
              <Button variant="secondary" className="text-spruce-700 hover:text-spruce-500 w-full" asChild>
                <Link to="/">Get Listed</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}