export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide the global fixed header on session pages */}
      <style>{`
        body > header {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}
