"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QuoteCalcProps {
  surfaceAreaM2: number | null;
  onRateChange: (rate: number) => void;
}

export default function QuoteCalc({
  surfaceAreaM2,
  onRateChange,
}: QuoteCalcProps) {
  const [rate, setRate] = useState(150);

  function handleRateChange(value: number) {
    setRate(value);
    onRateChange(value);
  }

  if (surfaceAreaM2 === null) return null;

  const total = surfaceAreaM2 * rate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cost Estimate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rate">Rate per m² (ZAR)</Label>
          <Input
            id="rate"
            type="number"
            min={0}
            step={10}
            value={rate}
            onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
            className="w-32"
          />
        </div>

        <div className="rounded-md bg-muted p-4">
          <div className="flex justify-between text-sm">
            <span>Surface area:</span>
            <span>{surfaceAreaM2.toFixed(1)} m²</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Rate:</span>
            <span>R{rate.toFixed(2)} / m²</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 font-bold">
            <span>Estimated Total:</span>
            <span>R{total.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
