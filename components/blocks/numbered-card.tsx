/** Número + título, sobre oscuro. */
function NumberedCard({ number, title }: { number: number; title: string }) {
  return (
    <li className="flex flex-col gap-12 rounded-card border border-white/22 bg-white/6 p-7">
      <span aria-hidden="true" className="font-ui text-eyebrow text-brand-green-light">
        {String(number).padStart(2, "0")}
      </span>
      <h3 className="text-h3 font-semibold text-white">{title}</h3>
    </li>
  );
}

export { NumberedCard };
