import { AlertCircle } from 'lucide-react';

/**
 * Inline server/API error block for auth forms (not toasts).
 */
export default function AuthFormError({ lines, 'data-testid': dataTestId }) {
  if (!lines?.length) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
      data-testid={dataTestId}
    >
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          {lines.length === 1 ? (
            <p className="leading-relaxed">{lines[0]}</p>
          ) : (
            <ul className="list-disc space-y-1.5 pl-4 leading-relaxed">
              {lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
