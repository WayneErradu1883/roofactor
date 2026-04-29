"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PITCH_PRESETS, pitchMultiplier } from "@/lib/calc/pitch";

interface PitchSelectorProps {
  value: number;
  onChange: (degrees: number) => void;
}

export default function PitchSelector({ value, onChange }: PitchSelectorProps) {
  const [custom, setCustom] = useState(false);

  return (
    <div className="space-y-3">
      <Label>Roof Pitch</Label>
      <div className="flex flex-wrap gap-2">
        {PITCH_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant={!custom && value === preset.degrees ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCustom(false);
              onChange(preset.degrees);
            }}
            title={preset.description}
          >
            {preset.label} ({preset.degrees}&deg;)
          </Button>
        ))}
        <Button
          variant={custom ? "default" : "outline"}
          size="sm"
          onClick={() => setCustom(true)}
        >
          Custom
        </Button>
      </div>

      {custom && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={70}
            step={0.5}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">degrees</span>
        </div>
      )}

      <div className="rounded-md bg-muted p-3 text-sm">
        <div className="flex justify-between">
          <span>Pitch angle:</span>
          <span className="font-medium">{value}&deg;</span>
        </div>
        <div className="flex justify-between">
          <span>Area multiplier:</span>
          <span className="font-medium">
            &times;{pitchMultiplier(value).toFixed(3)}
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          A {value}&deg; pitch increases surface area by{" "}
          {((pitchMultiplier(value) - 1) * 100).toFixed(1)}% over the flat
          footprint.
        </div>
      </div>
    </div>
  );
}
