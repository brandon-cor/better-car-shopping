"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InfoCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  sticky?: boolean;
}

export function InfoCard({ 
  title, 
  children, 
  className,
  headerClassName,
  contentClassName,
  sticky = false 
}: InfoCardProps) {
  return (
    <Card className={cn(
      "border-border bg-card rounded-2xl",
      sticky && "sticky top-6",
      className
    )}>
      {title && (
        <CardHeader className={headerClassName}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
        </CardHeader>
      )}
      <CardContent className={contentClassName}>
        {children}
      </CardContent>
    </Card>
  );
}

