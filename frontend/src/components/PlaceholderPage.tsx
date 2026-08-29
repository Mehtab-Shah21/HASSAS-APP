export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">This module hasn't been built yet.</p>
    </div>
  );
}
