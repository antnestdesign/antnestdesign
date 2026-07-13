export const metadata = {
  title: "AND OS",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AndOsPage() {
  return (
    <main className="h-screen w-full overflow-hidden bg-black">
      <iframe
        src="/os-app/index.html?v=20260713-1"
        title="AND OS"
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </main>
  );
}