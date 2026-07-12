import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page not found</h2>
      <p className="text-red-400 dark:text-red-300 mb-6 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
      >
        Back to home
      </Link>
    </div>
  );
}
