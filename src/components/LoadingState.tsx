export function LoadingState() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>
  );
}

export function LoadingTable() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}
