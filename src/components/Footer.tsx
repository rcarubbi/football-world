"use client";

import { Trophy, Bug } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">
                <span className="gradient-text">Football</span> World
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your complete guide to the world&apos;s top football championships.
              Teams, players, results, videos and much more.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
              Navigation
            </h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/leagues" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Leagues
              </Link>
              <Link href="/teams" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Teams
              </Link>
              <Link href="/players" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Players
              </Link>
              <Link href="/world-cup" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                World Cup
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
              Data Sources
            </h3>
            <nav className="flex flex-col space-y-2">
              <a href="https://www.thesportsdb.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                TheSportsDB
              </a>
              <a href="https://www.football-data.org" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                football-data.org
              </a>
              <a href="https://www.api-football.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                API-Football
              </a>
              <a href="https://www.bigballsdata.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Big Balls Data
              </a>
              <a href="https://www.sportsapipro.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sports API Pro
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                YouTube
              </a>
              <a href="https://www.wikimedia.org" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Wikimedia
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <p className="text-xs text-muted-foreground">
            Football World Portal &copy; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Data auto-updated
            </p>
            <button
              onClick={() => window.dispatchEvent(new Event("toggle-leva"))}
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              aria-label="Toggle debug panel"
            >
              <Bug className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
