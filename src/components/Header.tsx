import Link from "next/link";
import DesktopHeaderNav from "@/components/DesktopHeaderNav";
import HeaderStrategyCallLink from "@/components/HeaderStrategyCallLink";
import MobileHeaderMenu from "@/components/MobileHeaderMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-dark-bg/90 backdrop-blur-xl border-b border-dark-border shadow-sm shadow-black/20">
      <nav className="container-wide flex items-center justify-between h-16 md:h-20">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-cyan shadow-glow flex items-center justify-center transition-transform group-hover:-translate-y-0.5">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <span className="text-xl font-bold text-primary hidden sm:block">
            Opzix
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-5 xl:gap-8">
          <DesktopHeaderNav />
          <HeaderStrategyCallLink className="btn-primary text-sm" />
        </div>

        <div className="lg:hidden">
          <MobileHeaderMenu />
        </div>
      </nav>
    </header>
  );
}
