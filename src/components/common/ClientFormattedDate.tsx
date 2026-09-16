"use client";

import React, { useState, useEffect } from "react";
import { formatUtcDateTime } from "@/lib/format";

interface ClientFormattedDateProps {
  date: string | Date | number;
  className?: string;
  showUtc?: boolean;
}

export function ClientFormattedDate({
  date,
  className = "",
  showUtc = true,
}: ClientFormattedDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return <span className={className}>—</span>;
  }

  // During SSR and initial hydration, render deterministic UTC string
  if (!mounted) {
    return (
      <span className={className} suppressHydrationWarning>
        {formatUtcDateTime(d)}
      </span>
    );
  }

  // On client, render local date/time alongside UTC
  if (showUtc) {
    return (
      <span className={className} suppressHydrationWarning>
        {formatUtcDateTime(d)} ({d.toLocaleString()})
      </span>
    );
  }

  return (
    <span className={className} suppressHydrationWarning>
      {d.toLocaleString()}
    </span>
  );
}
