import Link from "next/link";
import { getOptionalSession } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";

export async function SiteHeader() {
  const session = await getOptionalSession();
  const links = [
    { href: "/", label: "Home" },
    { href: "/deposit", label: "Deposit" },
    ...(session ? [{ href: "/wallet", label: "Wallet" }] : []),
    ...(session ? [{ href: "/trade", label: "Trade" }] : [])
  ];

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
          {session ? null : <Link href="/login">Login</Link>}
          {session?.role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
          {session ? <LogoutButton /> : null}
        </nav>
      </div>
    </header>
  );
}
