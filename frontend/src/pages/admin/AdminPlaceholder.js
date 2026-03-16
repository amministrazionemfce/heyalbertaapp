export function AdminPlaceholder({ icon: Icon, title, description }) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-12 text-center"
      data-testid={`admin-placeholder-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 className="font-heading font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  );
}

