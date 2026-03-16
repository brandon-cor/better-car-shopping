"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SpecSectionProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}

export function SpecSection({ title, children, icon }: SpecSectionProps) {
  return (
    <Card className="border-border bg-card rounded-2xl">
      <CardHeader>
        <h2 className="text-lg font-bold flex items-center gap-2">
          {icon}
          {title}
        </h2>
      </CardHeader>
      <CardContent className="space-y-1">
        {children}
      </CardContent>
    </Card>
  );
}

interface SpecRowProps {
  label: string;
  value?: string | number | null;
  icon?: ReactNode;
}

export function SpecRow({ label, value, icon }: SpecRowProps) {
  if (value === undefined || value === null || value === "") return null;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span>{label}</span>
      </div>
      <span className="text-sm font-semibold">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

