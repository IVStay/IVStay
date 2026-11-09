import React from 'react';
import { PolicyLayout, Section } from './PolicyLayout';
import { BUSINESS } from '../../config/contact';

/** The three policies a property can have (properties.cancellation_policy). Keep in step with the stay page. */
export const CANCELLATION_RULES: Record<'Flexible' | 'Moderate' | 'Strict', { summary: string; rules: string[] }> = {
  Flexible: {
    summary: 'Full refund up to 24 hours before check-in.',
    rules: [
      'Cancel at least 24 hours before check-in: full refund.',
      'Cancel less than 24 hours before check-in: the first night is not refunded; the rest is.',
      'No-show: no refund.',
    ],
  },
  Moderate: {
    summary: 'Full refund up to 5 days before check-in.',
    rules: [
      'Cancel at least 5 days before check-in: full refund.',
      'Cancel less than 5 days before check-in: 50% of the nightly amount is refunded.',
      'No-show: no refund.',
    ],
  },
  Strict: {
    summary: '50% refund up to 7 days before check-in.',
    rules: [
      'Cancel within 48 hours of booking, if check-in is at least 14 days away: full refund.',
      'Cancel at least 7 days before check-in: 50% of the nightly amount is refunded.',
      'Cancel less than 7 days before check-in, or no-show: no refund.',
    ],
  },
};

export const CancellationPage: React.FC = () => (
  <PolicyLayout
    title="Cancellation & Refund Policy"
    intro={
      <p>
        Every stay on IvStay has one of three cancellation policies: <strong>Flexible</strong>,{' '}
        <strong>Moderate</strong> or <strong>Strict</strong>. You can see it on the property page before you send a
        request, and we repeat it when we confirm your booking.
      </p>
    }
  >
    <Section title="1. The three policies">
      <div className="grid gap-4">
        {(Object.keys(CANCELLATION_RULES) as (keyof typeof CANCELLATION_RULES)[]).map((name) => (
          <div key={name} className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="font-serif text-lg font-bold text-brand-slate">{name}</p>
            <p className="text-sm text-slate-500 mb-2">{CANCELLATION_RULES[name].summary}</p>
            <ul>
              {CANCELLATION_RULES[name].rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p>
        Times are counted back from the property's check-in time on your arrival date (12:00 noon if the property
        hasn't told you otherwise). Cleaning fees are refunded in full whenever you cancel before check-in.
      </p>
    </Section>

    <Section title="2. Requests that aren't confirmed yet">
      <p>
        A booking request costs nothing and can be withdrawn at any time before you pay. Just tell us; no charges
        apply.
      </p>
    </Section>

    <Section title="3. How to cancel">
      <p>
        Message us on WhatsApp, call or email with your booking reference (for example IVS-1003). The time we receive
        your message is the time of cancellation. We confirm every cancellation in writing.
      </p>
    </Section>

    <Section title="4. Refunds">
      <ul>
        <li>We start the refund within 5 working days of confirming your cancellation.</li>
        <li>
          Money goes back to the account or payment method you paid from. Your bank may take a further 5–7 working
          days to show it.
        </li>
        <li>Refunds are made in Indian rupees for the amount you paid IvStay.</li>
      </ul>
    </Section>

    <Section title="5. If we or the host cancel">
      <p>
        If the property becomes unavailable or we have to cancel your confirmed booking for any reason, you get a full
        refund, or, if you prefer, we help you move to a similar property for the same dates.
      </p>
    </Section>

    <Section title="6. Changing dates, leaving early">
      <ul>
        <li>
          Date changes depend on availability. If the new dates cost more, you pay the difference; if a change isn't
          possible, the request is treated as a cancellation under the policy above.
        </li>
        <li>Unused nights after you check in, including leaving early, are not refunded.</li>
      </ul>
    </Section>

    <Section title="7. Exceptional circumstances">
      <p>
        If a natural disaster, government travel restriction or similar serious event stops you from travelling, contact
        us. We look at these cases individually and, where possible, offer a refund or new dates even if the policy
        wouldn't normally allow it.
      </p>
    </Section>

    <Section title="8. Questions">
      <p>
        Email {BUSINESS.email} or call / WhatsApp {BUSINESS.phoneDisplay}, quoting your booking reference.
      </p>
    </Section>
  </PolicyLayout>
);
