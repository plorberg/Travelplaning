"use client";

// Submit button that asks for confirmation first. Drop-in replacement for the
// plain submit button inside destructive server-action forms.
export function ConfirmSubmit({
  message,
  children,
  className,
  style,
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
