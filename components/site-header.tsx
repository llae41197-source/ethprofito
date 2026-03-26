import Link from "next/link";
import { getOptionalSession } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";

export async function SiteHeader() {
  const session = await getOptionalSession();
  const links = [
    {
      href: "/",
      label: "Home",
      tone: "home",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 11.5L12 5l8 6.5V20h-5.5v-5h-5v5H4z" fill="currentColor" />
        </svg>
      )
    },
    {
      href: "/deposit",
      label: "Deposit",
      tone: "deposit",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5zm4 4h6m-3-3v6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    },
    ...(session
      ? [
          {
            href: "/wallet",
            label: "Wallet",
            tone: "wallet",
            icon: (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 8.5A2.5 2.5 0 0 1 6.5 6h10A2.5 2.5 0 0 1 19 8.5V10h1v7a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5zM15 13.5h3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )
          },
          {
            href: "/trade",
            label: "Trade",
            tone: "trade",
            icon: (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 16l4-4 3 3 7-7M14 8h5v5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )
          }
        ]
      : [])
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
            <Link key={link.href} href={link.href} className={`nav-item nav-item-${link.tone}`}>
              <span className="nav-item-icon">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
          {session ? null : (
            <Link href="/login" className="nav-item nav-item-login">
              <span className="nav-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M15 8l4 4-4 4M19 12H9M11 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>Login</span>
            </Link>
          )}
          {session?.role === "ADMIN" ? (
            <Link href="/admin" className="nav-item nav-item-admin">
              <span className="nav-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7zM9.5 12l1.5 1.5L14.5 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>Admin</span>
            </Link>
          ) : null}
          {session ? <LogoutButton /> : null}
        </nav>
      </div>
    </header>
  );
}
