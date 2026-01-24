import Link from "next/link";
import Image from "next/image";

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="text-sm font-medium text-black/70 hover:text-black transition"
  >
    {children}
  </Link>
);

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      <header className="sticky top-0 z-30">
        <div className="border-b border-black/10 bg-white/70 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6">
            {/* ✅ Mobile: colonne + spacing / Desktop: comme avant */}
            <div className="flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
              <Link
                href="/"
                className="flex items-center gap-4 no-underline"
                style={{ textDecoration: "none" }}
              >
                {/* LOGO INÈS */}
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
                  <Image
                    src="/logo-ines.png"
                    alt="Inès Kerkour Photographie"
                    width={58}
                    height={58}
                    className="object-contain"
                    priority
                  />
                </div>

                {/* TEXTE */}
                <div className="leading-tight">
                  <div className="text-[15px] font-semibold tracking-tight text-black">
                    photographi.nes
                  </div>
                  <div className="text-xs text-black/45">Gallery · Store</div>
                </div>
              </Link>

              {/* ✅ Petite séparation en mobile (premium & discret) */}
              <div className="h-px w-full bg-black/5 sm:hidden" />

              {/* ✅ Nav: wrap en mobile pour éviter superposition */}
              <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:flex-nowrap sm:gap-6">
                <NavLink href="/shop">Boutique</NavLink>
                <NavLink href="/cart">Panier</NavLink>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">{children}</main>

      <footer className="mx-auto max-w-6xl px-6 py-14 text-xs text-black/45">
  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      © {new Date().getFullYear()} photographi.nes
    </div>

    <Link
      href="/admin"
      className="text-xs text-black/40 hover:text-black/70 transition"
    >
      Accès photographe
    </Link>
  </div>
</footer>
    </div>
  );
}
