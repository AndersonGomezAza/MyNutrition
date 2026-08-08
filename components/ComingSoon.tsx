export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-500">
        {note}
      </p>
    </div>
  );
}
