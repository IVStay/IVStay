import React from 'react';
import styles from './Award.module.css';

export const Award = () => {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.content}>
          <svg className={styles.icon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <h2 className={styles.title}>The IVStay Standard</h2>
          <p className={styles.description}>
            We rigorously review every single home available. We only accept the top 3% in any destination. If it doesn't meet our exhaustive 150-point criteria, it's not an IVStay.
          </p>
          <button className={styles.button}>Read our criteria</button>
        </div>
      </div>
    </section>
  );
};
