import { NavHeader } from "@/components/NavHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </div>
      <div className="space-y-1 pt-0.5">
        <h4 className="font-semibold">{title}</h4>
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}

export default function HelpPage() {
  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Help & SOPs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Standard operating procedures for using Roofactor
          </p>
        </div>

        <div className="space-y-6">
          {/* Overview */}
          <Section title="What is Roofactor?" description="A quick overview of the application">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Roofactor is a roof surface area estimation tool designed for roof coating and sealing businesses.
              It uses satellite imagery and building footprint data from Microsoft and OpenStreetMap to help
              you accurately measure roof areas, calculate costs, and generate professional estimates.
            </p>
          </Section>

          {/* SOP 1: Creating an Estimate */}
          <Section title="SOP 1: Creating a New Estimate" description="Step-by-step guide to measure a roof and create an estimate">
            <Step number={1} title="Start a new estimate">
              From the dashboard, click the <strong>New Estimate</strong> button. This opens the estimation
              workspace with the map and measurement tools.
            </Step>

            <Step number={2} title="Search for the address">
              Type the property address in the search bar and press Enter or click Search.
              The map will fly to the location and zoom in to satellite view. The address must be in South Africa.
            </Step>

            <Step number={3} title="Review building footprints">
              The system automatically searches for building footprints from two sources:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li><strong>Orange overlay</strong> &mdash; Microsoft Building Footprints (AI-detected from satellite imagery)</li>
                <li><strong>Blue overlay</strong> &mdash; OpenStreetMap (community-mapped data)</li>
              </ul>
              <p className="mt-2">
                These overlays are <strong>reference guides only</strong>. They show the approximate building
                outline but may include the entire structure, not just the roof you need to coat.
              </p>
            </Step>

            <Step number={4} title="Draw the roof polygon">
              Use the polygon drawing tool (the shape icon on the map) to trace the actual roof outline:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Click on each corner of the roof to place vertices</li>
                <li>Click the first point again to close the polygon</li>
                <li>The area in m&sup2; updates automatically</li>
                <li>You can drag vertices to adjust the shape after drawing</li>
              </ul>
            </Step>

            <Step number={5} title="Handle complex roofs (multiple zones)">
              For roofs with different pitch angles or sections:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Draw separate polygons for each roof section</li>
                <li>Each zone appears in the zone list on the left panel</li>
                <li>Set the pitch angle for each zone individually</li>
                <li>Use <strong>Apply to All</strong> if all zones share the same pitch</li>
              </ul>
            </Step>

            <Step number={6} title="Set the roof pitch">
              Adjust the pitch angle for each zone. The default is 22.5&deg;. The pitch affects the actual
              surface area calculation &mdash; steeper roofs have more surface area than the flat footprint.
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li><strong>Flat roof:</strong> 0&ndash;5&deg;</li>
                <li><strong>Low pitch:</strong> 10&ndash;20&deg;</li>
                <li><strong>Standard pitch:</strong> 20&ndash;30&deg;</li>
                <li><strong>Steep pitch:</strong> 30&ndash;45&deg;</li>
              </ul>
            </Step>

            <Step number={7} title="Review the quote">
              The quote calculator shows:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li><strong>Footprint area</strong> &mdash; the flat 2D area of your polygons</li>
                <li><strong>Surface area</strong> &mdash; the actual roof area adjusted for pitch</li>
                <li><strong>Rate per m&sup2;</strong> &mdash; adjustable cost rate (default R150/m&sup2;)</li>
                <li><strong>Total cost</strong> &mdash; surface area &times; rate</li>
              </ul>
              Adjust the rate per m&sup2; to match your pricing.
            </Step>

            <Step number={8} title="Add notes and save">
              Add any relevant site observations in the notes field (access issues, roof condition, etc.).
              Click <strong>Save Estimate</strong> or press <strong>Ctrl+S</strong> to save.
            </Step>
          </Section>

          {/* SOP 2: Viewing & Managing Estimates */}
          <Section title="SOP 2: Viewing & Managing Estimates" description="How to review, export, and delete saved estimates">
            <Step number={1} title="View saved estimates">
              The dashboard shows all saved estimates in a table. Click any estimate to view its full details
              including the map with your drawn polygons, measurements, and cost breakdown.
            </Step>

            <Step number={2} title="Export to PDF">
              On the estimate detail page, click <strong>Download PDF</strong> to generate a professional
              estimate document you can share with clients.
            </Step>

            <Step number={3} title="Delete an estimate">
              On the estimate detail page, click the <strong>Delete</strong> button. This action cannot be undone.
              Only the estimate creator or an admin can delete estimates.
            </Step>
          </Section>

          {/* SOP 3: Understanding Data Sources */}
          <Section title="SOP 3: Understanding Data Sources & Confidence" description="How accuracy and confidence scoring works">
            <Step number={1} title="Data sources">
              Roofactor cross-references two independent building footprint databases:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li><strong>Microsoft Building Footprints</strong> &mdash; AI-generated from satellite imagery, covers all of Africa (~500M buildings)</li>
                <li><strong>OpenStreetMap</strong> &mdash; Community-mapped global data, coverage varies by area</li>
              </ul>
            </Step>

            <Step number={2} title="Confidence levels">
              The confidence score indicates how reliable the auto-detected footprints are:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li><strong>High</strong> &mdash; Both sources agree within 2% on building area</li>
                <li><strong>Medium</strong> &mdash; Sources differ by 2&ndash;5%, or only one source available</li>
                <li><strong>Low</strong> &mdash; Sources differ by more than 5%, or no sources found</li>
              </ul>
            </Step>

            <Step number={3} title="When to rely on manual measurement">
              Always draw your own polygon for the final measurement. The auto-detected footprints are useful
              for quickly locating the building but may not match the exact roof area you need to coat.
              Common reasons for mismatch:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Building has overhangs or covered walkways</li>
                <li>Only part of the roof needs coating</li>
                <li>Building has been extended or modified since the data was captured</li>
                <li>Complex roof shapes that the AI simplified</li>
              </ul>
            </Step>
          </Section>

          {/* SOP 4: Tips */}
          <Section title="SOP 4: Tips for Accurate Measurements" description="Best practices for getting within 2% accuracy">
            <Step number={1} title="Zoom in fully">
              Always zoom to the maximum level (19) before drawing. The closer you are, the more precisely
              you can place vertices on the roof edges.
            </Step>

            <Step number={2} title="Use satellite + labels layer">
              Switch between Google Satellite and Google Satellite + Labels using the layer control
              (top-right of map). Labels help identify the correct building.
            </Step>

            <Step number={3} title="Place more vertices on curves">
              For rounded or irregular roof edges, place more points to follow the contour closely.
              Fewer points means a rougher approximation.
            </Step>

            <Step number={4} title="Verify with on-site measurements">
              For high-value quotes, cross-check one or two dimensions with a physical tape measurement
              on site. This validates your satellite-based estimate.
            </Step>

            <Step number={5} title="Account for roof features">
              Remember to exclude or note areas that don&apos;t need coating (skylights, solar panels,
              chimneys). You can add these details in the notes field.
            </Step>
          </Section>

          {/* Keyboard Shortcuts */}
          <Section title="Keyboard Shortcuts" description="Quick actions available throughout the app">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span>Save estimate</span>
                <kbd className="rounded border bg-background px-2 py-0.5 text-xs font-mono">Ctrl+S</kbd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span>Show shortcuts</span>
                <kbd className="rounded border bg-background px-2 py-0.5 text-xs font-mono">?</kbd>
              </div>
            </div>
          </Section>
        </div>
      </main>
    </>
  );
}
