import { ReactNode } from "react";

export function Table({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className={`w-full text-sm ${className}`}>{children}</table>
    </div>
  );
}

export function TableHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <thead className={`bg-muted/50 ${className}`}>{children}</thead>;
}

export function TableBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tbody className={`divide-y divide-border ${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={`hover:bg-muted/30 transition-colors ${className}`}>{children}</tr>;
}

export function TableCell({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-2 py-3 ${className}`}>{children}</td>;
}
