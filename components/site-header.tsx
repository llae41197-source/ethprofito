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
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 256 417" className="brand-mark-icon" role="img">
              <path fill="#d1d5db" d="M127.9 0L124.8 10.5V279.1L127.9 282.1L255.8 210.5z" />
              <path fill="#9ca3af" d="M127.9 0L0 210.5L127.9 282.1V151.7z" />
              <path fill="#6b7280" d="M127.9 306.4L126.1 308.6V416.3L127.9 421.4L255.9 234.8z" />
              <path fill="#4b5563" d="M127.9 421.4V306.4L0 234.8z" />
              <path fill="#111827" d="M127.9 282.1L255.8 210.5L127.9 151.7z" />
              <path fill="#374151" d="M0 210.5L127.9 282.1V151.7z" />
            </svg>
          </span>
          <span>ethprofito</span>
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
