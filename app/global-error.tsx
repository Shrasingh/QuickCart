"use client"

// Last-resort boundary for errors thrown by the root layout itself (for
// example while the navbar loads categories). It replaces the whole document,
// so it must render its own <html> and <body> and cannot use the layout's
// providers or fonts.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>QuickCart is temporarily unavailable</h1>
          <p style={{ color: "#6b7280", maxWidth: 420, margin: 0 }}>
            Something went wrong while loading the store. Your cart is saved in this browser and is unchanged.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#000",
              color: "#fff",
              border: 0,
              borderRadius: 9999,
              padding: "12px 24px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && <p style={{ color: "#9ca3af", fontSize: 12 }}>Reference: {error.digest}</p>}
        </main>
      </body>
    </html>
  )
}
