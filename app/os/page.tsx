import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AND OS | ANTNEST DESIGN",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function OsPage() {
  return (
    <main style={{ margin: 0, minHeight: "100vh", background: "#f4f1ec" }}>
      <iframe
        src="/os-app/index.html"
        title="AND OS"
        style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
      />
    </main>
  );
}