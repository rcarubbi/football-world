import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { WIKI_SELECTORS } from "./wiki-selectors";
import { RateLimiter } from "../../src/lib/api/rate-limiter";

const wikipediaLimiter = new RateLimiter(1, 60); // 1 concurrent, 60 per minute (1/sec)

function cleanHtml(html: string): string {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  for (const selector of WIKI_SELECTORS.removeSelectors) {
    $(selector).remove();
  }

  // Remove edit links
  $(".mw-editsection").remove();

  // Remove references
  $(".reference").remove();

  // Clean up links
  $("a").each(function () {
    const href = $(this).attr("href");
    if (href && href.startsWith("#")) {
      $(this).removeAttr("href");
    }
  });

  return $.html();
}

function htmlToMarkdown(html: string): string {
  const $ = cheerio.load(html);
  let markdown = "";

  function processElement(element: AnyNode): string {
    let result = "";
    const el = $(element);

    if (element.type === "text") {
      return el.text();
    }

    if (element.type === "tag") {
      const tagName = element.name?.toLowerCase() || "";

      switch (tagName) {
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          const level = parseInt(tagName.charAt(1));
          result = "\n\n" + "#".repeat(level) + " " + el.text().trim() + "\n\n";
          break;

        case "p":
          result = "\n\n" + el.text().trim() + "\n\n";
          break;

        case "ul":
        case "ol":
          el.children().each(function () {
            const li = $(this);
            result += "- " + li.text().trim() + "\n";
          });
          result += "\n";
          break;

        case "li":
          result = el.text().trim() + "\n";
          break;

        case "strong":
        case "b":
          result = "**" + el.text().trim() + "**";
          break;

        case "em":
        case "i":
          result = "*" + el.text().trim() + "*";
          break;

          case "a":
            const href = el.attr("href");
            const text = el.text().trim();
            if (href && !href.startsWith("#")) {
              result = "[" + text + "](" + href + ")";
            } else {
              result = text;
            }
            break;

          case "img":
            const alt = el.attr("alt") || "";
            const src = el.attr("src") || "";
            result = "![" + alt + "](" + src + ")";
            break;

          case "br":
            result = "\n";
            break;

          case "blockquote":
            result = "\n\n> " + el.text().trim() + "\n\n";
            break;

          default:
            // Process children for unknown tags
            el.children().each(function () {
              result += processElement(this);
            });
      }
    } else if ("children" in element) {
      // Process children for other node types
      element.children?.forEach((child) => {
        result += processElement(child);
      });
    }

    return result;
  }

  $("body")
    .children()
    .each(function () {
      markdown += processElement(this);
    });

  // Clean up excessive newlines
  markdown = markdown.replace(/\n{3,}/g, "\n\n");
  markdown = markdown.trim();

  return markdown;
}

function isDisambiguationPage(html: string): boolean {
  const $ = cheerio.load(html);
  return $(WIKI_SELECTORS.disambiguation).length > 0;
}

function findFootballTeamLink(html: string): string | null {
  const $ = cheerio.load(html);
  const links = $(WIKI_SELECTORS.disambiguationLinks);

  for (let i = 0; i < links.length; i++) {
    const link = $(links[i]);
    const text = link.text().toLowerCase();
    const href = link.attr("href");

    if (
      href &&
      (text.includes("football club") ||
        text.includes("f.c.") ||
        text.includes("soccer"))
    ) {
      return "https://en.wikipedia.org" + href;
    }
  }

  // If no explicit football link, try the first link
  const firstLink = $(WIKI_SELECTORS.disambiguationLinks).first();
  const href = firstLink.attr("href");
  if (href) {
    return "https://en.wikipedia.org" + href;
  }

  return null;
}

async function fetchWikipediaPage(
  url: string
): Promise<string | null> {
  return wikipediaLimiter.add(async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      return response.text();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return null;
    }
  });
}

function extractSection(
  html: string,
  sectionSelectors: string[]
): string | null {
  const $ = cheerio.load(html);
  const content = $(WIKI_SELECTORS.content);

  for (const selector of sectionSelectors) {
    const section = $(selector);
    if (section.length > 0) {
      let sectionHtml = "";
      let currentElement = section.next();

      while (currentElement.length > 0) {
        const tagName = currentElement.prop("tagName")?.toLowerCase();
        if (tagName && tagName.match(/^h[1-6]$/)) {
          break;
        }
        sectionHtml += currentElement.html() || "";
        currentElement = currentElement.next();
      }

      if (sectionHtml) {
        return cleanHtml(sectionHtml);
      }
    }
  }

  return null;
}

function extractStadiumInfo(
  html: string
): { name: string; description: string } | null {
  const $ = cheerio.load(html);

  // Try to find stadium in infobox
  const infoBox = $(WIKI_SELECTORS.infoBox);
  if (infoBox.length > 0) {
    const rows = infoBox.find(WIKI_SELECTORS.infoBoxRow);
    for (let i = 0; i < rows.length; i++) {
      const row = $(rows[i]);
      const label = row.find(WIKI_SELECTORS.infoBoxLabel).text().toLowerCase();
      const data = row.find(WIKI_SELECTORS.infoBoxData).text().trim();

      if (
        label.includes("stadium") ||
        label.includes("ground") ||
        label.includes("stadien")
      ) {
        // Try to get description from the stadium's Wikipedia page
        const stadiumLink = row.find("a").attr("href");
        if (stadiumLink) {
          const stadiumUrl = stadiumLink.startsWith("http")
            ? stadiumLink
            : "https://en.wikipedia.org" + stadiumLink;

          const stadiumHtml = fetchWikipediaPage(stadiumUrl);
          // This is simplified - in production, you'd want to fetch and parse the stadium page
          return {
            name: data,
            description: data,
          };
        }

        return {
          name: data,
          description: data,
        };
      }
    }
  }

  return null;
}

export async function scrapeWikipedia(): Promise<void> {
  const { findAllTeams, updateTeamWikipedia } = await import("../../src/lib/db/teams");
  const teams = await findAllTeams();

  for (const team of teams) {
    if (team.wikipedia_content) continue;

    console.log(`  Scraping Wikipedia for ${team.name}...`);
    try {
      const content = await scrapeTeamWikipedia(team.name, team.slug);
      if (content) {
        await updateTeamWikipedia(team.id, content.wikipedia_content, content.stadium_content);
      }
    } catch (error) {
      console.error(`  Error scraping ${team.name}:`, error);
    }
  }
}

export async function scrapeTeamWikipedia(
  teamName: string,
  teamSlug: string
): Promise<{
  wikipedia_content: string | null;
  stadium_content: string | null;
} | null> {
  const searchUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(teamName)}`;
  const html = await fetchWikipediaPage(searchUrl);

  if (!html) {
    return null;
  }

  // Check for disambiguation page
  if (isDisambiguationPage(html)) {
    const footballTeamUrl = findFootballTeamLink(html);
    if (footballTeamUrl) {
      const footballHtml = await fetchWikipediaPage(footballTeamUrl);
      if (footballHtml) {
        return processWikipediaPage(footballHtml);
      }
    }
    return null;
  }

  return processWikipediaPage(html);
}

function processWikipediaPage(html: string): {
  wikipedia_content: string | null;
  stadium_content: string | null;
} {
  // Extract team history
  const historyHtml = extractSection(html, [
    WIKI_SELECTORS.historySection,
    "#History",
    "#Club_history",
    "#Historie",
  ]);

  const wikipedia_content = historyHtml ? htmlToMarkdown(historyHtml) : null;

  // Extract stadium info
  const stadiumInfo = extractStadiumInfo(html);
  const stadium_content = stadiumInfo
    ? `## ${stadiumInfo.name}\n\n${stadiumInfo.description}`
    : null;

  return {
    wikipedia_content,
    stadium_content,
  };
}
