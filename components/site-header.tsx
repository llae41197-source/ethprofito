import Link from "next/link";
import { getOptionalSession } from "@/lib/session";

export async function SiteHeader() {
  const session = await getOptionalSession();
  const links = [
    { href: "/", label: "Home" },
    { href: "/markets", label: "Markets" },
    { href: "/deposit", label: "Deposit" }
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
          {session ? <Link href="/dashboard">Dashboard</Link> : <Link href="/login">Login</Link>}
          {session?.role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
          {session ? <Link href="/logout">Logout</Link> : null}
        </nav>
      </div>
    </header>
  );
}
