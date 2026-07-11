export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Football Wiki Portal - Data provided by TheSportsDB, football-data.org, API-Football, and YouTube
          </div>
          <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <a
              href="https://www.thesportsdb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              TheSportsDB
            </a>
            <a
              href="https://www.football-data.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              football-data.org
            </a>
            <a
              href="https://www.api-football.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              API-Football
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
