import { marked } from "marked";

export async function markdownToHtml(markdown: string): Promise<string> {
  return marked.parse(markdown) as Promise<string>;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
