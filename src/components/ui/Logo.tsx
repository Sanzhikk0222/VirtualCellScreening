/** Brand mark: a cell with a nucleus and two organelles. Decorative; the link around it carries the name. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="13.5" stroke="#3fd9c8" strokeWidth="1.6" />
      <circle cx="14.5" cy="15" r="5.2" fill="#5b9dff" />
      <circle cx="13" cy="13.6" r="1.7" fill="#bcd6ff" />
      <circle cx="23" cy="21.5" r="2.6" fill="#ff8f70" />
      <circle cx="22.5" cy="9.5" r="1.8" fill="#9d8cff" />
    </svg>
  );
}
