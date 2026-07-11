interface KitDisplayProps {
  homeUrl: string | null;
  awayUrl: string | null;
  thirdUrl: string | null;
}

export function KitDisplay({ homeUrl, awayUrl, thirdUrl }: KitDisplayProps) {
  const kits = [
    { label: "Home", url: homeUrl },
    { label: "Away", url: awayUrl },
    { label: "Third", url: thirdUrl },
  ].filter((kit) => kit.url);

  if (kits.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Kits
      </h2>
      <div className="grid grid-cols-3 gap-4">
        {kits.map((kit) => (
          <div key={kit.label} className="text-center">
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-2 flex items-center justify-center">
              {kit.url && (
                <img
                  src={kit.url}
                  alt={`${kit.label} kit`}
                  className="w-full h-full object-contain p-2"
                />
              )}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {kit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
