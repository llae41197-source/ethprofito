"use client";

export function LogoutButton() {
  return (
    <form action="/logout" method="post" style={{ display: "inline-flex" }}>
      <button
        type="submit"
        style={{
          background: "transparent",
          border: "0",
          color: "inherit",
          cursor: "pointer",
          padding: 0
        }}
      >
        Logout
      </button>
    </form>
  );
}
