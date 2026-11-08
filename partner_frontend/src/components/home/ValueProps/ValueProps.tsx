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
              Each of our holiday rentals is chosen for its singularity, blending soul and character.
            </p>
          </div>
          
          <div className={styles.item}>
            <h2 className={styles.title}>
              TAILOR-MADE
              <span>STAYS</span>
            </h2>
            <p className={styles.description}>
              From everyday services to once-in-a-lifetime experiences, we personalise every detail of your stay.
            </p>
          </div>
          
          <div className={styles.item}>
            <h2 className={styles.title}>
              A LOCAL
              <span>CONCIERGE</span>
            </h2>
            <p className={styles.description}>
              Across dream destinations, our teams open the doors to highly exclusive locations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
