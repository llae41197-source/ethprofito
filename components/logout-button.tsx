"use client";

export function LogoutButton() {
  return (
    <form action="/logout" method="post" className="nav-form">
      <button type="submit" className="nav-item nav-item-logout nav-button">
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
        <span>Logout</span>
      </button>
    </form>
  );
}
