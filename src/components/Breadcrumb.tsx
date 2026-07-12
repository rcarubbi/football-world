"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BreadcrumbProps {
  backHref: string;
  backLabel: string;
}

export function Breadcrumb({ backHref, backLabel }: BreadcrumbProps) {
  return (
    <Link
      href={backHref}
      className="inline-flex items-center gap-1.5 text-sm text-red-400 dark:text-red-300 hover:opacity-80 transition-opacity mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      {backLabel}
    </Link>
  );
}
