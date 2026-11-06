import { memo } from 'react';

interface HighlightTextProps {
  text: string;
  highlight: string;
  className?: string;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const HighlightText = memo(function HighlightText({
  text,
  highlight,
  className,
}: HighlightTextProps) {
  const trimmed = highlight.trim();
  if (!trimmed) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark
            key={index}
            className="rounded-xs bg-amber-200 px-0.5 font-semibold text-slate-900"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
});
