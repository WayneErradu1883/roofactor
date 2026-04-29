"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const shortcuts = [
  { keys: "N", description: "New Estimate" },
  { keys: "Ctrl+S", description: "Save Estimate" },
  { keys: "?", description: "Toggle this help" },
];

export default function KeyboardHelp() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setVisible((v) => !v);
      }

      if (e.key === "Escape" && visible) {
        setVisible(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisible(false)}
          >
            Close
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {shortcuts.map((s) => (
              <div
                key={s.keys}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{s.description}</span>
                <kbd className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
