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
            <div className="flex h-16 items-center justify-between">
              import Image from "next/image"; import Link from "next/link"; ...
              <Link
                href="/"
                className="flex items-center gap-4 no-underline"
                style={{ textDecoration: "none" }}
              >
                {/* LOGO INÈS */}
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black">
                  <Image
                    src="/logo-ines.png"
                    alt="Inès Kerkour Photographie"
                    width={40}
                    height={40}
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
              <nav className="flex items-center gap-6">
                <NavLink href="/shop">Boutique</NavLink>
                <NavLink href="/cart">Panier</NavLink>
                <NavLink href="/admin">Admin</NavLink>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">{children}</main>

      <footer className="mx-auto max-w-6xl px-6 py-14 text-xs text-black/45">
        © {new Date().getFullYear()} photographi.nes
      </footer>
    </div>
  );
}
