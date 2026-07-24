export function Footer() {
  return (
    <footer className="border-t border-[#333] py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
            <span className="text-sm text-brand-offwhite/50">
              &copy; {new Date().getFullYear()} Crypto Shield. All rights reserved.
            </span>
          </div>
          <div className="flex gap-6 text-sm text-brand-offwhite/50">
            <a href="#" className="hover:text-brand-gold transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Docs</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
