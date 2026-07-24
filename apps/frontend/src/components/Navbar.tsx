import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', label: 'Analyze' },
  { path: '/calculator', label: 'Exit Calculator' },
  { path: '/monitor', label: 'Monitor' },
  { path: '/history', label: 'History' },
];

export function Navbar() {
  const location = useLocation();
  const { isAuthenticated, user, subscriptionStatus } = useAppStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-black/80 backdrop-blur-lg border-b border-[#333]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="Logo" className="w-8 h-8" />
          <span className="text-xl font-bold gradient-text">Crypto Shield</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'px-4 py-2 rounded-lg text-sm transition-all duration-200',
                location.pathname === item.path
                  ? 'text-brand-gold bg-brand-gold/10'
                  : 'text-brand-offwhite/60 hover:text-brand-offwhite hover:bg-white/5'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {subscriptionStatus === 'premium' && (
            <span className="text-xs text-brand-gold border border-brand-gold/30 px-2 py-1 rounded">
              PREMIUM
            </span>
          )}
          {isAuthenticated ? (
            <span className="text-sm text-brand-offwhite/70">{user?.email}</span>
          ) : (
            <Button variant="primary" size="sm">Connect Wallet</Button>
          )}
        </div>
      </div>
    </nav>
  );
}
