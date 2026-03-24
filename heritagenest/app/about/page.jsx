import Link from "next/link";
import styles from "./about.module.css";

export const metadata = {
  title: "About — HeritageNest",
  description: "Learn about the Regional Folk Art Digital Archive project",
};

export default function AboutPage() {
  const artForms = [
    { name: "Madhubani", state: "Bihar", desc: "Intricate geometric patterns depicting nature and mythology" },
    { name: "Warli", state: "Maharashtra", desc: "Tribal art using basic geometric forms to tell stories" },
    { name: "Gond", state: "Madhya Pradesh", desc: "Vivid depictions of nature, animals, and deities" },
    { name: "Phulkari", state: "Punjab", desc: "Vibrant embroidery meaning 'flower work'" },
    { name: "Pattachitra", state: "Odisha", desc: "Cloth-based scroll paintings with mythological themes" },
    { name: "Kalamkari", state: "Andhra Pradesh", desc: "Hand-painted or block-printed cotton textile art" },
  ];

  const features = [
    { icon: "📤", title: "Contribute", desc: "Upload images, videos of folk art, crafts, and performances from across India." },
    { icon: "🔍", title: "Discover", desc: "Search and filter by state, art form, community, or category." },
    { icon: "🔖", title: "Save", desc: "Bookmark items you love for future reference or research." },
    { icon: "📚", title: "Learn", desc: "Read descriptions, view media, and explore related art from the same region." },
  ];

  const stats = [
    { num: "28+", label: "States Covered" },
    { num: "25+", label: "Art Forms" },
    { num: "8", label: "Categories" },
    { num: "14+", label: "Communities" },
  ];

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.badge}>🏛 About the Project</span>
          <h1 className={styles.heroTitle}>Preserving India's Intangible Cultural Heritage</h1>
          <p className={styles.heroSub}>
            HeritageNest is a digital archive dedicated to documenting and preserving traditional folk arts,
            crafts, dance forms, and cultural performances from every corner of India — before they fade away.
          </p>
          <div className={styles.heroActions}>
            <Link href="/" className="btn-primary">Explore Archive</Link>
            <Link href="/upload" className="btn-secondary">Contribute</Link>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Stats */}
        <section className={styles.statsSection}>
          {stats.map((s) => (
            <div key={s.label} className={styles.statBox}>
              <span className={styles.statNum}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </section>

        {/* Problem & Mission */}
        <section className={styles.missionSection}>
          <div className={styles.missionGrid}>
            <div>
              <h2 className={styles.sectionTitle}>The Problem</h2>
              <p className={styles.body}>
                Traditional folk arts like Madhubani, Phulkari, Gond, and hundreds of regional dance
                forms are at serious risk of being forgotten. With the passing of each master artisan,
                centuries of knowledge vanish — and there is no structured, accessible digital record.
              </p>
              <p className={styles.body}>
                Students, researchers, and enthusiasts have no single platform to explore, learn, or
                contribute to preserving this incredible heritage.
              </p>
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Our Mission</h2>
              <p className={styles.body}>
                HeritageNest is built to create a structured, community-driven digital repository of
                India's intangible cultural heritage. Anyone can upload, explore, and help preserve
                folk art, crafts, dance, music, and heritage sites — completely free.
              </p>
              <p className={styles.body}>
                By tagging every entry with state, community, art form, and category, we make this
                knowledge searchable, shareable, and accessible to all.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className={styles.featuresSection}>
          <h2 className={`section-title ${styles.centeredTitle}`}>What You Can Do</h2>
          <p className={`section-subtitle ${styles.centeredSub}`}>HeritageNest is built for contributors, learners, and researchers alike</p>
          <div className={styles.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Art Forms */}
        <section className={styles.artFormsSection}>
          <h2 className={`section-title ${styles.centeredTitle}`}>Featured Art Forms</h2>
          <p className={`section-subtitle ${styles.centeredSub}`}>A glimpse into the diversity we're preserving</p>
          <div className={styles.artFormsGrid}>
            {artForms.map((a) => (
              <div key={a.name} className={styles.artCard}>
                <div className={styles.artCardTop}>
                  <span className={styles.artName}>{a.name}</span>
                  <span className={styles.artState}>📍 {a.state}</span>
                </div>
                <p className={styles.artDesc}>{a.desc}</p>
                <Link href={`/categories?cat=Folk Art`} className={styles.artLink}>Explore →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className={styles.techSection}>
          <h2 className={styles.sectionTitle}>Built With</h2>
          <div className={styles.techGrid}>
            {[
              { name: "Next.js 14", role: "Frontend Framework", icon: "▲" },
              { name: "Firebase Auth", role: "Authentication", icon: "🔐" },
              { name: "Firestore", role: "Database", icon: "🗄" },
              { name: "Supabase Storage", role: "Media Storage", icon: "📦" },
              { name: "Vercel", role: "Deployment", icon: "🚀" },
            ].map((t) => (
              <div key={t.name} className={styles.techCard}>
                <span className={styles.techIcon}>{t.icon}</span>
                <span className={styles.techName}>{t.name}</span>
                <span className={styles.techRole}>{t.role}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaBox}>
            <h2>Start Preserving Heritage Today</h2>
            <p>Join the community and help document India's incredible cultural legacy.</p>
            <div className={styles.ctaActions}>
              <Link href="/auth/login" className="btn-accent">Create Account</Link>
              <Link href="/" className="btn-secondary">Browse Archive</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
