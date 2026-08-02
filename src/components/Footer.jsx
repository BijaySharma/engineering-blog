const FOOTER_LINKS = [
  { href: "https://github.com/bijaysharma", label: "GitHub" },
  { href: "https://linkedin.com/in/bijaysharma", label: "LinkedIn" },
  { href: "mailto:hello@bijaysharma.dev", label: "Email" },
  { href: "/resume.pdf", label: "Resume" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:justify-between">
        <p className="font-sans">
          &copy; {new Date().getFullYear()} Bijay Sharma
        </p>
        <ul className="flex items-center gap-5 font-sans">
          {FOOTER_LINKS.map(({ href, label }) => (
            <li key={label}>
              <a
                href={href}
                className="text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
