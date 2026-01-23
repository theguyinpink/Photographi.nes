import Link from "next/link";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
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
              <Link href="/" className="flex items-center gap-3 no-underline" style={{ textDecoration: "none" }}>
                <div className="grid h-9 w-9 place-items-center rounded-2xl border border-black/10 bg-white">
                  <div className="h-2 w-2 rounded-full bg-black" />
                </div>
                <div className="leading-tight">
                  <div className="text-[15px] font-semibold tracking-tight">photographi.nes</div>
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
