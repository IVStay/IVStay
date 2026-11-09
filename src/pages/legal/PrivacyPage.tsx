import React from 'react';
import { Link } from 'react-router-dom';
import { PolicyLayout, Section } from './PolicyLayout';
import { BUSINESS } from '../../config/contact';

export const PrivacyPage: React.FC = () => (
  <PolicyLayout
    title="Privacy Policy"
    intro={
      <p>
        This policy explains what personal data IvStay collects when you use ivstay.vercel.app, why we collect it,
        who we share it with and the choices you have. It is written to meet India's Digital Personal Data
        Protection Act, 2023. By creating an account or sending a booking request you agree to the use of your data as
        described here.
      </p>
    }
  >
    <Section title="1. What we collect">
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address, phone number and password. Passwords are stored
          only in scrambled (hashed) form, so nobody at IvStay can read them. If you use "Continue with Google", Google
          shares your name, email address and profile picture with us.
        </li>
        <li>
          <strong>Booking requests:</strong> the stay, your dates, number of guests, any special requests, the price we
          quoted and the contact details you give in the form.
        </li>
        <li>
          <strong>Messages:</strong> what you send us on WhatsApp, by phone or by email.
        </li>
        <li>
          <strong>Technical data:</strong> our hosting providers record basic request information such as your IP
          address and browser type to keep the site running and secure. Your browser also keeps your sign-in and saved
          favourites on your own device.
        </li>
      </ul>
      <p>We do not use advertising or tracking cookies, and we do not collect payment card details on this website.</p>
    </Section>

    <Section title="2. Why we use it">
      <ul>
        <li>To answer and manage your booking requests, confirm stays with the property and keep you updated.</li>
        <li>To run your account, including sign-in codes and password resets.</li>
        <li>To contact you about your bookings by phone, WhatsApp or email.</li>
        <li>To keep the website secure and prevent misuse.</li>
        <li>To meet legal, tax and accounting obligations.</li>
      </ul>
      <p>
        We will only send you offers or newsletters if you separately agree to receive them, and you can stop them at
        any time.
      </p>
    </Section>

    <Section title="3. Who we share it with">
      <ul>
        <li>
          <strong>The property you are booking:</strong> your name, dates, number of guests and, where needed for
          check-in, your phone number.
        </li>
        <li>
          <strong>Service providers who run the website for us:</strong> Supabase (database and sign-in, with data
          stored in Mumbai, India), Vercel (website hosting), Google (email delivery and Google sign-in) and WhatsApp
          (when you message us). They may only use your data to provide their service to IvStay.
        </li>
        <li>
          <strong>Authorities</strong>, when the law requires it (for example guest registration rules at
          accommodation, or a valid legal request).
        </li>
      </ul>
      <p>We never sell your personal data.</p>
    </Section>

    <Section title="4. How long we keep it">
      <p>
        We keep your account details while your account is open. Booking and payment records are kept for as long as
        Indian tax and accounting laws require (generally up to 8 years). Booking requests that never became a stay
        are deleted or anonymised within 2 years. When you delete your account, we remove your profile and keep only
        what the law requires.
      </p>
    </Section>

    <Section title="5. Your rights">
      <p>You can ask us at any time to:</p>
      <ul>
        <li>tell you what personal data we hold about you and who we have shared it with;</li>
        <li>correct or update it (you can also edit your name and phone number in My account);</li>
        <li>delete your account and personal data, subject to records we must keep by law;</li>
        <li>withdraw your consent, which stops future use but doesn't undo use that already happened;</li>
        <li>nominate someone to exercise these rights for you if you are unable to.</li>
      </ul>
      <p>
        Email {BUSINESS.email} with your request. We respond within 30 days. If you are not satisfied with our answer,
        you can complain to the Data Protection Board of India.
      </p>
    </Section>

    <Section title="6. Security">
      <p>
        All connections to the website are encrypted (HTTPS). Access to customer data is limited to the IvStay team,
        and team accounts are protected with two-step verification. No system is perfectly secure, so please use a
        strong password and tell us straight away if you notice anything unusual. If a breach affects your data, we
        will inform you and the authorities as the law requires.
      </p>
    </Section>

    <Section title="7. Children">
      <p>
        Accounts and bookings are for adults aged 18 or over. Children may stay as part of a booking made by an adult.
        We do not knowingly collect data from children.
      </p>
    </Section>

    <Section title="8. Changes to this policy">
      <p>
        If we change this policy, we will update the date at the top of this page. For important changes we will also
        tell account holders by email. Please also read our <Link to="/terms" className="text-brand-gold font-semibold hover:underline">Terms of Use</Link>.
      </p>
    </Section>

    <Section title="9. Grievance contact">
      <p>
        For any privacy question or complaint, contact our grievance officer at {BUSINESS.email} or{' '}
        {BUSINESS.phoneDisplay}.
      </p>
    </Section>
  </PolicyLayout>
);
