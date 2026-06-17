"use client";

export default function ConfirmButton({
  action,
  children,
  message,
  className,
}: {
  action: () => void;
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
