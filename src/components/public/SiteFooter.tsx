import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { BUSINESS, whatsappLink } from '../../config/contact';
import { Logo } from '../brand/Logo';

const col = 'space-y-3 text-sm';
const heading = 'font-semibold text-ink';
const link = 'block text-ink-soft hover:underline underline-offset-4';

export const SiteFooter: React.FC = () => (
  <footer className="bg-surface-muted border-t border-line-soft mt-auto">
    <div className="shell py-12">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm text-ink-muted leading-relaxed max-w-xs">
            Hand-picked villas, BnBs and boutique hotels in India, booked with help from real people.
          </p>
        </div>

        <div className={col}>
          <p className={heading}>Explore</p>
          <Link to="/stays" className={link}>All stays</Link>
          <Link to="/villas" className={link}>Villas &amp; BnBs</Link>
          <Link to="/hotels" className={link}>Hotels &amp; resorts</Link>
          <Link to="/destinations" className={link}>Destinations</Link>
          <Link to="/blogs" className={link}>Travel guides</Link>
        </div>

        <div className={col}>
          <p className={heading}>IvStay</p>
          <Link to="/about" className={link}>About us</Link>
          <Link to="/contact?type=list" className={link}>List your property</Link>
          <Link to="/cancellation-policy" className={link}>Cancellation &amp; refunds</Link>
          <Link to="/privacy" className={link}>Privacy policy</Link>
          <Link to="/terms" className={link}>Terms of use</Link>
        </div>

        <div className={col}>
          <p className={heading}>Support</p>
          <a href={`tel:${BUSINESS.phoneDisplay.replace(/\s/g, '')}`} className={`${link} flex items-center gap-2`}>
            <Phone className="w-4 h-4" /> {BUSINESS.phoneDisplay}
          </a>
          <a
            href={whatsappLink('Hi IvStay, I have a question.')}
            target="_blank"
            rel="noopener noreferrer"
            className={`${link} flex items-center gap-2`}
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp us
          </a>
          <a href={`mailto:${BUSINESS.email}`} className={`${link} flex items-center gap-2`}>
            <Mail className="w-4 h-4" /> {BUSINESS.email}
          </a>
          <Link to="/contact" className={link}>Help centre</Link>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row justify-between gap-3 text-sm text-ink-soft">
        <p>
          © {new Date().getFullYear()} {BUSINESS.legalName || BUSINESS.name} ·{' '}
          <Link to="/privacy" className="hover:underline">Privacy</Link> ·{' '}
          <Link to="/terms" className="hover:underline">Terms</Link>
        </p>
        <p className="font-semibold text-ink">English (IN) · ₹ INR</p>
      </div>
    </div>
  </footer>
);
