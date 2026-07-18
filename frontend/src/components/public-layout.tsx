import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { Menu, X, Globe, ExternalLink } from 'lucide-react';
import { ZeusLogo } from '@/components/zeus-logo';
import { useI18n, LANG_LABELS, LANG_NAMES, Lang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const langs = Object.keys(LANG_LABELS) as Lang[];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{LANG_LABELS[lang]}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-[140px]">
            {langs.map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); setOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors text-left',
                  l === lang ? 'text-primary font-medium bg-primary/5' : 'text-muted-foreground'
                )}
              >
                <span>{LANG_NAMES[l]}</span>
                <span className="font-mono text-xs opacity-60">{LANG_LABELS[l]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t, isRTL } = useI18n();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/about', label: t.nav.about },
    { href: '/team', label: t.nav.team },
    { href: '/docs', label: t.nav.docs },
    { href: '/contacts', label: t.nav.contacts },
    { href: '/dashboard', label: 'Insurance' },
    { href: '/escrow', label: 'Escrow' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <ZeusLogo size={28} textSize="text-lg" className="cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <span className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    )}>
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <LangSwitcher />
              <Link href="/dashboard">
                <Button size="sm" className="hidden md:flex font-mono text-xs uppercase tracking-wider gap-1.5">
                  {t.nav.launch_app}
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <span
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'block px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
                        isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      )}
                    >
                      {link.label}
                    </span>
                  </Link>
                );
              })}
              <Link href="/dashboard">
                <span
                  onClick={() => setMobileOpen(false)}
                  className="block mt-2 px-3 py-2 rounded-md text-sm font-medium text-center bg-primary text-primary-foreground cursor-pointer"
                >
                  {t.nav.launch_app}
                </span>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <ZeusLogo size={28} className="mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed">{t.footer.slogan}</p>
              <p className="text-xs text-muted-foreground/60 mt-2">Base Sepolia · Chain ID 84532</p>
            </div>
            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t.footer.product}</h4>
              <ul className="space-y-2">
                {[
                  { href: '/dashboard', label: 'Dashboard' },
                  { href: '/dashboard', label: t.nav.launch_app },
                  { href: '/docs', label: t.nav.docs },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>
                      <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t.footer.company}</h4>
              <ul className="space-y-2">
                {[
                  { href: '/about', label: t.nav.about },
                  { href: '/team', label: t.nav.team },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>
                      <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Connect */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t.footer.connect}</h4>
              <ul className="space-y-2">
                {[
                  { href: 'https://t.me/IvanovVII', label: 'Telegram' },
                  { href: 'mailto:zeusinsurance@mail.ru', label: 'Email' },
                  { href: 'https://github.com/igor-vii/Zeus-insurance-v2.1', label: 'GitHub' },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {l.label}
                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground/60">{t.footer.rights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
