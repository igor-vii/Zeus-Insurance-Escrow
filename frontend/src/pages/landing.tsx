import { Link } from 'wouter';
import { ArrowRight, Shield, Zap, Eye, Cpu, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ZeusLogoIcon } from '@/components/zeus-logo';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, delay },
});

export default function Landing() {
  const { t } = useI18n();

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Subtle background — only very faint grid, no glow blobs over text */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Grid pattern — very subtle */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(rgba(245,166,35,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.6) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
          {/* Glow only at the very bottom-right, away from text */}
          <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <motion.div {...fadeIn(0.05)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono text-primary uppercase tracking-wider">{t.hero.badge}</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.12)}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6"
            >
              <span className="text-foreground">{t.hero.title1}</span>
              <br />
              <span className="text-primary">{t.hero.title2}</span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.22)}
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl"
            >
              {t.hero.subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeUp(0.32)} className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="font-mono uppercase tracking-wider gap-2 text-sm px-8">
                  {t.hero.cta_buy}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="font-mono uppercase tracking-wider gap-2 text-sm px-8 border-border hover:border-primary/50">
                  {t.hero.cta_docs}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              {...fadeIn(0.5)}
              className="grid grid-cols-3 gap-6 mt-16 pt-8 border-t border-border/50"
            >
              {[
                { value: t.hero.stat_reserve, label: t.hero.stat_reserve_label },
                { value: t.hero.stat_policies, label: t.hero.stat_policies_label },
                { value: t.hero.stat_payout, label: t.hero.stat_payout_label },
              ].map((stat, i) => (
                <motion.div key={stat.label} {...fadeUp(0.5 + i * 0.1)}>
                  <div className="text-2xl sm:text-3xl font-bold text-primary font-mono">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Animated hero logo — right side, does NOT overlap text column */}
        <motion.div
          className="absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          {/* Slow breathing glow behind the logo */}
          <motion.div
            className="absolute w-64 h-64 bg-primary/20 rounded-full blur-[60px]"
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <ZeusLogoIcon size={280} className="relative" />
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.features.title}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.features.subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: t.features.f1_title, desc: t.features.f1_desc },
              { icon: Eye, title: t.features.f2_title, desc: t.features.f2_desc },
              { icon: Shield, title: t.features.f3_title, desc: t.features.f3_desc },
              { icon: Cpu, title: t.features.f4_title, desc: t.features.f4_desc },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                className="group relative p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-card/20 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.how.title}</h2>
            <p className="text-muted-foreground text-lg">{t.how.subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: '01', title: t.how.s1_title, desc: t.how.s1_desc },
              { num: '02', title: t.how.s2_title, desc: t.how.s2_desc },
              { num: '03', title: t.how.s3_title, desc: t.how.s3_desc },
              { num: '04', title: t.how.s4_title, desc: t.how.s4_desc },
            ].map(({ num, title, desc }, idx) => (
              <motion.div
                key={num}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
              >
                {idx < 3 && (
                  <div
                    className="hidden lg:block absolute top-8 h-px bg-gradient-to-r from-primary/30 to-transparent z-0"
                    style={{ width: 'calc(100% - 2rem)', left: 'calc(100% - 1rem)' }}
                  />
                )}
                <div className="relative z-10">
                  <div className="text-5xl font-bold text-primary/20 font-mono leading-none mb-4">{num}</div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="relative text-center py-20 px-8">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block mb-6"
              >
                <ZeusLogoIcon size={48} className="opacity-80" />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.cta.title}</h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">{t.cta.subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="font-mono uppercase tracking-wider gap-2 px-10">
                    {t.cta.btn}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="outline" className="font-mono uppercase tracking-wider border-primary/30 hover:border-primary/60 px-10">
                    {t.cta.docs}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
