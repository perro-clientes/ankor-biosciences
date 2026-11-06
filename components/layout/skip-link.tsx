/** "Skip to content": visible solo con foco de teclado. */
function SkipLink({ href = "#main" }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only rounded-pill bg-primary px-5 py-3 ui-label text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100"
    >
      Skip to content
    </a>
  );
}

export { SkipLink };
