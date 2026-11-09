import React from 'react';
import { Link } from 'react-router-dom';
import { PolicyLayout, Section } from './PolicyLayout';
import { BUSINESS } from '../../config/contact';

const link = 'text-brand-gold font-semibold hover:underline';

export const TermsPage: React.FC = () => (
  <PolicyLayout
    title="Terms of Use"
    intro={
      <p>
        These terms apply when you use the IvStay website, create an account or request a booking. Please read them
        together with our{' '}
        <Link to="/privacy" className={link}>
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link to="/cancellation-policy" className={link}>
          Cancellation &amp; Refund Policy
        </Link>
        . By using the website you accept these terms.
      </p>
    }
  >
    <Section title="1. About IvStay">
      <p>
        IvStay lists hand-picked villas, BnBs, home stays and hotels in India that are owned or run by independent
        property owners ("hosts"), and arranges bookings with them on your behalf. The host is responsible for the
        property and the stay itself; IvStay handles your request, confirmation, payment collection and support.
      </p>
    </Section>

    <Section title="2. Your account">
      <ul>
        <li>You must be at least 18 years old to create an account or make a booking.</li>
        <li>Give accurate details, including a phone number we can reach you on, and keep them up to date.</li>
        <li>
          Keep your password private. You are responsible for activity on your account; tell us immediately if you
          think someone else has used it.
        </li>
        <li>
          We may suspend or close accounts that give false information, misuse the website or break these terms.
        </li>
      </ul>
    </Section>

    <Section title="3. How booking works">
      <ul>
        <li>
          <strong>Request.</strong> Sending a booking request does not reserve the property. We check availability with
          the host and contact you by phone, WhatsApp or email.
        </li>
        <li>
          <strong>Hold.</strong> If the dates are available we may hold them while you complete payment. Holds are
          temporary and are released if payment isn't made within the time we tell you.
        </li>
        <li>
          <strong>Confirmation.</strong> Your booking is confirmed only when we confirm it to you in writing (WhatsApp
          or email) and the agreed payment has been received.
        </li>
      </ul>
    </Section>

    <Section title="4. Prices and payment">
      <ul>
        <li>
          Prices are in Indian rupees (₹) and depend on dates and number of guests: some properties charge more on
          Friday and Saturday nights, and for guests above the base number. Cleaning and service fees are shown before
          you send a request.
        </li>
        <li>
          The total shown on the website is a quote. The final amount, including any applicable taxes, is confirmed
          before you pay.
        </li>
        <li>We tell you the accepted payment methods when we confirm availability.</li>
      </ul>
    </Section>

    <Section title="5. Cancellations and changes">
      <p>
        Each property shows its cancellation policy (Flexible, Moderate or Strict). The rules and refund timelines are
        in our{' '}
        <Link to="/cancellation-policy" className={link}>
          Cancellation &amp; Refund Policy
        </Link>
        .
      </p>
    </Section>

    <Section title="6. During your stay">
      <ul>
        <li>
          Follow the property's house rules, including check-in and check-out times, quiet hours and the maximum number
          of guests.
        </li>
        <li>
          Carry valid government photo ID for every adult guest. Indian law requires accommodation providers to
          register guests; foreign nationals must show their passport and visa.
        </li>
        <li>
          You are responsible for damage caused by you or your group beyond normal wear and tear, and the host may
          charge for repairs or extra cleaning.
        </li>
        <li>The host may refuse entry or end a stay for illegal activity or serious breaches of house rules.</li>
      </ul>
    </Section>

    <Section title="7. Listings">
      <p>
        Photos, descriptions and amenities come from hosts and our own visits. We work to keep them accurate, but
        small differences can occur. If a property is materially different from its listing, contact us during your
        stay so we can help put it right.
      </p>
    </Section>

    <Section title="8. Using the website fairly">
      <p>
        Don't misuse the website: no false or fraudulent bookings, no attempts to access other people's data or our
        systems, and no copying of listings, photos or content for commercial use without our written permission.
      </p>
    </Section>

    <Section title="9. Our responsibility">
      <p>
        We arrange bookings with care, but the host is responsible for the condition and services of the property. To
        the extent the law allows, IvStay is not liable for indirect losses, or for events outside our reasonable
        control such as natural disasters, government orders or travel disruption. If we are found liable, our
        liability is limited to the amount you paid IvStay for the booking concerned. Nothing in these terms limits
        your rights under the Consumer Protection Act, 2019.
      </p>
    </Section>

    <Section title="10. Changes and governing law">
      <p>
        We may update these terms; the date at the top shows the latest version, and bookings already confirmed keep
        the terms that applied when they were made. These terms are governed by the laws of India, and disputes are
        subject to the courts of India.
      </p>
    </Section>

    <Section title="11. Contact">
      <p>
        Questions about these terms: {BUSINESS.email} or {BUSINESS.phoneDisplay}.
      </p>
    </Section>
  </PolicyLayout>
);
