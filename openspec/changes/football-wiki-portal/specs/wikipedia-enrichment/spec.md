## ADDED Requirements

### Requirement: Wikipedia scraper extracts team history
The system SHALL scrape the Wikipedia page for each team to extract the team's history section, storing the result as Markdown in the `wikipedia_content` column of the `teams` table in Turso.

#### Scenario: Successful scrape
- **WHEN** the bootstrap script scrapes Arsenal's Wikipedia page
- **THEN** the team history is extracted, converted to Markdown, and stored in Turso

#### Scenario: Wikipedia page not found
- **WHEN** a team has no Wikipedia page or the page cannot be found
- **THEN** the scraper logs a warning and leaves the `wikipedia_content` field NULL

### Requirement: Wikipedia scraper extracts stadium information
The system SHALL extract the stadium name, description, capacity, and location from the team's Wikipedia page or the stadium's own Wikipedia page.

#### Scenario: Stadium info extracted
- **WHEN** the scraper processes a team with a Wikipedia page mentioning its stadium
- **THEN** the stadium description, capacity, and location are stored in Turso

### Requirement: Wikipedia scraper converts HTML to Markdown
The system SHALL use cheerio to parse Wikipedia HTML and convert relevant sections to clean Markdown, stripping references, navigation elements, and infoboxes.

#### Scenario: Clean Markdown output
- **WHEN** the scraper processes a Wikipedia page
- **THEN** the output is clean Markdown without Wikipedia-specific markup, references, or navigation

### Requirement: Wikipedia scraper respects rate limits
The system SHALL limit Wikipedia scraping to 1 request per second to avoid overwhelming Wikipedia's servers.

#### Scenario: Rate limiting during scrape
- **WHEN** the bootstrap script scrapes multiple Wikipedia pages
- **THEN** requests are spaced at least 1 second apart

### Requirement: Wikipedia content is stored as Markdown in Turso
The system SHALL store scraped Wikipedia content as Markdown text in Turso, in columns `wikipedia_content` (team history) and `stadium_content` (stadium description) on the `teams` table.

#### Scenario: Content stored in Turso
- **WHEN** the scraper completes for a team
- **THEN** the Markdown content is written to the appropriate Turso columns

### Requirement: Wikipedia scraper handles disambiguation
The system SHALL detect Wikipedia disambiguation pages and attempt to find the correct football team page by following the first relevant link.

#### Scenario: Disambiguation page
- **WHEN** the scraper encounters a disambiguation page for a team name
- **THEN** it follows the link most likely to be the football team (e.g., "Arsenal F.C." for "Arsenal")
