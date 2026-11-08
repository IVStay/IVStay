import styles from './page.module.css';
import { Hero } from '@/components/home/Hero/Hero';
import { FeaturedVillas } from '@/components/home/FeaturedVillas/FeaturedVillas';
import { ValueProps } from '@/components/home/ValueProps/ValueProps';
import { Collections } from '@/components/home/Collections/Collections';
import { Award } from '@/components/home/Award/Award';

export default function Home() {
  return (
    <main className={styles.main}>
      <Hero />
      <ValueProps />
      <FeaturedVillas />
      <Award />
      <Collections />
    </main>
  );
}
