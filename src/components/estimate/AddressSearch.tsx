"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface GeocodedAddress {
  formatted_address: string;
  lat: number;
  lng: number;
  place_id: string;
}

interface AddressSearchProps {
  onAddressFound: (result: GeocodedAddress) => void;
}

export default function AddressSearch({ onAddressFound }: AddressSearchProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to find address");
        return;
      }

      onAddressFound(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSearch} className="space-y-2">
      <Label htmlFor="address">Street Address</Label>
      <div className="flex gap-2">
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 12 Main Road, Cape Town"
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !address.trim()}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
