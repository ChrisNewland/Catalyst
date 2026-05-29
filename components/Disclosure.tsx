"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Disclosure({
  title,
  hint,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  badge?: string | number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/60",
          )}
        >
          <span className="flex flex-1 flex-col">
            <span className="flex items-center gap-2 text-sm font-semibold">
              {title}
              {badge ? (
                <Badge className="h-5 min-w-5 justify-center px-1.5 text-[11px]">{badge}</Badge>
              ) : null}
            </span>
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="border-t p-5">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
