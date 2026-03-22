import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/deposit", label: "Deposit" }
];

export function SiteHeader() {
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">EP</span>
          <span>ethprofito.com</span>
        </Link>
        <nav className="nav">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
