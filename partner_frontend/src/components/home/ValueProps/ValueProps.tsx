import React from 'react';
import styles from './ValueProps.module.css';

export const ValueProps = () => {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.item}>
            <h2 className={styles.title}>
              UNIQUE
              <span>HOMES</span>
            </h2>
            <p className={styles.description}>
              Every stay is chosen by our team for its character, comfort and setting. No endless lists.
            </p>
          </div>
          
          <div className={styles.item}>
            <h2 className={styles.title}>
              TAILOR-MADE
              <span>STAYS</span>
            </h2>
            <p className={styles.description}>
              Tell us what you need, from early check-in to a bonfire night, and we arrange it with the host.
            </p>
          </div>
          
          <div className={styles.item}>
            <h2 className={styles.title}>
              A REAL
              <span>PERSON</span>
            </h2>
            <p className={styles.description}>
              Questions before or during your stay? Call or WhatsApp us and talk to someone who knows the place.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
