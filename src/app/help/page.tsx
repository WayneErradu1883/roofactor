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
              Roofactor is a roof surface area estimation tool built for Nomiplex&apos;s roof coating and
              sealing business. It uses satellite imagery, Google Street View, and building footprint data
              from Microsoft, OpenStreetMap, and Google Solar API to help you accurately measure roof areas,
              auto-detect pitch angles, calculate costs, generate professional PDF quotes, and track
              opportunities through your sales pipeline.
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
              The map will fly to the location and zoom in to satellite view. A <strong>pin marker</strong> is
              dropped on the house so you can see exactly which property was found. The address must be in South Africa.
            </Step>

            <Step number={3} title="Enter customer details">
              After the address is found, fill in the <strong>Customer Name</strong> and <strong>Phone</strong> fields.
              These are optional but recommended &mdash; the customer name and phone appear on the dashboard
              table under the address, making it easy to identify who each estimate is for.
            </Step>

            <Step number={4} title="Review building footprints and Street View">
              The system automatically searches for building data from three sources:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li><strong>Orange overlay</strong> &mdash; Microsoft Building Footprints (AI-detected from satellite imagery)</li>
                <li><strong>Blue overlay</strong> &mdash; OpenStreetMap (community-mapped data)</li>
                <li><strong>Google Solar API</strong> &mdash; Auto-detects roof pitch angle (shown in a blue banner if available)</li>
              </ul>
              <p className="mt-2">
                A <strong>Street View</strong> panel also appears below the source comparison. Use it to
                visually assess the roof pitch from ground level before drawing.
              </p>
              <p className="mt-2">
                The overlays are <strong>reference guides only</strong>. They show the approximate building
                outline but may include the entire structure, not just the roof you need to coat.
              </p>
            </Step>

            <Step number={5} title="Draw the roof polygon">
              Use the polygon drawing tool (the pentagon icon on the top-left of the map) to trace the actual roof outline:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Click the pentagon icon to activate drawing mode</li>
                <li>Click on each corner of the roof to place vertices</li>
                <li>Click the first point again to close the polygon</li>
                <li>The area in m&sup2; updates automatically</li>
                <li>Use the edit tool (pencil icon) to drag vertices and adjust the shape</li>
                <li>Use the delete tool (trash icon) to remove polygons</li>
                <li>Click <strong>Reset Map Selection</strong> in the left panel to clear all polygons and start over</li>
              </ul>
            </Step>

            <Step number={6} title="Handle complex roofs (multiple zones)">
              For roofs with different pitch angles or sections:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Draw separate polygons for each roof section</li>
                <li>Each zone appears in the zone list on the left panel</li>
                <li>Set the pitch angle for each zone individually</li>
                <li>Use <strong>Apply to All</strong> if all zones share the same pitch</li>
              </ul>
            </Step>

            <Step number={7} title="Set the roof pitch">
              The pitch affects the actual surface area calculation &mdash; steeper roofs have more surface
              area than the flat footprint.
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li><strong>Auto-detected:</strong> If Google Solar API has data for the building, the pitch
                  is detected automatically and applied to new polygons. Look for the blue banner showing
                  the detected angle.</li>
                <li><strong>Street View:</strong> Use the embedded Street View to visually estimate the pitch
                  if no auto-detection data is available.</li>
                <li><strong>Manual:</strong> If no data is available, the default is 22.5&deg;. Adjust per zone as needed.</li>
              </ul>
              <p className="mt-2">Common pitch ranges:</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li><strong>Flat roof:</strong> 0&ndash;5&deg;</li>
                <li><strong>Low pitch:</strong> 10&ndash;20&deg;</li>
                <li><strong>Standard pitch:</strong> 20&ndash;30&deg;</li>
                <li><strong>Steep pitch:</strong> 30&ndash;45&deg;</li>
              </ul>
            </Step>

            <Step number={8} title="Set the rate and review the quote">
              The quote calculator shows:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li><strong>Footprint area</strong> &mdash; the flat 2D area of your polygons</li>
                <li><strong>Surface area</strong> &mdash; the actual roof area adjusted for pitch</li>
                <li><strong>Rate per m&sup2;</strong> &mdash; adjustable from R0 to R140 in steps of R5</li>
                <li><strong>Total cost</strong> &mdash; surface area &times; rate</li>
              </ul>
            </Step>

            <Step number={9} title="Add notes and save">
              Add any relevant site observations in the notes field (access issues, roof condition, etc.).
              Click <strong>Save Estimate</strong> or press <strong>Ctrl+S</strong> to save.
            </Step>
          </Section>

          {/* SOP 2: Viewing, PDF & WhatsApp */}
          <Section title="SOP 2: Viewing, PDF & Sharing Estimates" description="How to review, export, preview, and send quotes to customers">
            <Step number={1} title="View saved estimates">
              The dashboard shows all saved estimates in a table with columns for Address (with customer
              name/phone below), Surface Area, Cost, Date, and Opportunity status. Click any estimate to
              view its full details including the map with your drawn polygons.
            </Step>

            <Step number={2} title="Download the PDF quote">
              On the estimate detail page, click <strong>Download PDF Quote</strong>. The PDF is named
              using the quote number (e.g. <code>NP-QUOTE-0905-427.pdf</code>) and includes:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Roofactor header with your company logo and name (configured in Settings)</li>
                <li>Quote number (auto-generated as NP-QUOTE-DDMM-XXX)</li>
                <li>Property address and GPS coordinates</li>
                <li>Satellite image with roof polygon overlay, grid pattern, and measurement callout</li>
                <li>Roof measurements and zone breakdown</li>
                <li>Quote summary with total cost</li>
                <li>Your custom Terms &amp; Conditions</li>
              </ul>
            </Step>

            <Step number={3} title="Preview the PDF">
              Click <strong>View PDF</strong> to open the quote in a new browser tab for preview
              before downloading or sending.
            </Step>

            <Step number={4} title="Send via WhatsApp">
              Click <strong>WhatsApp to Customer</strong> to expand the phone input:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Enter the customer&apos;s cell number (e.g. 082 123 4567)</li>
                <li>SA numbers auto-convert (082... becomes +27 82...)</li>
                <li>Click <strong>Send</strong> &mdash; the PDF downloads and WhatsApp Web opens with a pre-filled message</li>
                <li>Attach the downloaded PDF to the WhatsApp chat</li>
              </ul>
            </Step>

            <Step number={5} title="Delete an estimate">
              On the estimate detail page, click the <strong>Delete</strong> button. This action cannot be undone.
              Only the estimate creator or an admin can delete estimates.
            </Step>
          </Section>

          {/* SOP 3: Opportunity Tracking */}
          <Section title="SOP 3: Opportunity Tracking (Won / Lost)" description="Track which quotes convert to jobs and why">
            <Step number={1} title="View opportunities on the dashboard">
              The dashboard shows two rows of stat tiles:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li><strong>Won This Month</strong> (green) &mdash; number of estimates marked as won</li>
                <li><strong>Lost This Month</strong> (red) &mdash; number marked as lost</li>
                <li><strong>Revenue Won This Month</strong> (green) &mdash; total ZAR value of won deals</li>
                <li><strong>Conversion Rate</strong> &mdash; percentage of Won vs (Won + Lost) this month</li>
                <li><strong>Pipeline Value</strong> (blue) &mdash; total ZAR value of still-open estimates</li>
              </ul>
            </Step>

            <Step number={2} title="Mark an estimate as Won or Lost">
              In the Opportunity column of the estimates table:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Open estimates show <strong>Won</strong> and <strong>Lost</strong> buttons</li>
                <li>Clicking either opens a modal asking for a reason (required)</li>
                <li>For Won: explain why you won (e.g. &quot;Customer accepted, competitive pricing&quot;)</li>
                <li>For Lost: explain why it was lost (e.g. &quot;Went with competitor, budget too high&quot;)</li>
                <li>The reason is saved and visible as a tooltip when you hover the badge</li>
              </ul>
            </Step>

            <Step number={3} title="Reopen an estimate">
              If you accidentally marked an estimate as Won or Lost, click the small <strong>undo icon</strong> next
              to the badge to reopen it. This sets it back to Open with the Won/Lost buttons showing again.
            </Step>
          </Section>

          {/* SOP 4: Data Sources */}
          <Section title="SOP 4: Understanding Data Sources & Confidence" description="How accuracy and confidence scoring works">
            <Step number={1} title="Data sources">
              Roofactor cross-references three data sources:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li><strong>Microsoft Building Footprints</strong> &mdash; AI-generated from satellite imagery, covers all of Africa (~500M buildings)</li>
                <li><strong>OpenStreetMap</strong> &mdash; Community-mapped global data, coverage varies by area</li>
                <li><strong>Google Solar API</strong> &mdash; Provides roof pitch angles and segment data where available</li>
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

          {/* SOP 5: Tips */}
          <Section title="SOP 5: Tips for Accurate Measurements" description="Best practices for getting within 2% accuracy">
            <Step number={1} title="Zoom in fully">
              Always zoom to the maximum level before drawing. The closer you are, the more precisely
              you can place vertices on the roof edges.
            </Step>

            <Step number={2} title="Use satellite + labels layer">
              Switch between Google Satellite and Google Satellite + Labels using the layer control
              (top-right of map). Labels help identify the correct building.
            </Step>

            <Step number={3} title="Use Street View to assess pitch">
              The Street View panel shows a ground-level view of the building. Use it to visually
              estimate the roof pitch before or after drawing your polygon. Compare what you see
              with the common pitch ranges in SOP 1, Step 7.
            </Step>

            <Step number={4} title="Place more vertices on curves">
              For rounded or irregular roof edges, place more points to follow the contour closely.
              Fewer points means a rougher approximation.
            </Step>

            <Step number={5} title="Verify with on-site measurements">
              For high-value quotes, cross-check one or two dimensions with a physical tape measurement
              on site. This validates your satellite-based estimate.
            </Step>

            <Step number={6} title="Account for roof features">
              Remember to exclude or note areas that don&apos;t need coating (skylights, solar panels,
              chimneys). You can add these details in the notes field.
            </Step>
          </Section>

          {/* SOP 6: PDF Settings */}
          <Section title="SOP 6: PDF Quote Settings" description="Customise your PDF quotes with company branding and terms">
            <Step number={1} title="Access settings">
              Click <strong>Settings</strong> in the navigation bar. The PDF Quote Settings section is
              available to all users.
            </Step>

            <Step number={2} title="Upload your company logo">
              Under <strong>Company Branding</strong>, click <strong>Upload Logo</strong> to add your
              company logo. Accepted formats: JPEG, PNG, or SVG (max 2MB). The logo is automatically
              resized to fit and appears centered between the Roofactor header and the document title
              on every PDF.
            </Step>

            <Step number={3} title="Set your company name">
              Enter your company name (e.g. &quot;Nomiplex&quot;). This appears centered below the logo
              on the PDF. The Roofactor branding always appears at the top and in the footer and cannot be changed.
            </Step>

            <Step number={4} title="Customise the document title">
              Change the document title from the default &quot;QUOTATION&quot; to whatever suits your
              business (e.g. &quot;ESTIMATE&quot;, &quot;PROPOSAL&quot;).
            </Step>

            <Step number={5} title="Edit Terms & Conditions">
              Write your own terms and conditions in the text box. These appear in italic at the bottom
              of every PDF. Use <code>{"{validity}"}</code> in the text to automatically insert the quote
              validity period (e.g. &quot;valid for {"{validity}"} days&quot;).
            </Step>

            <Step number={6} title="Add contact details">
              Enter your phone number and email address. These appear in the PDF footer so customers
              can reach you directly.
            </Step>

            <Step number={7} title="Save settings">
              Click <strong>Save PDF Settings</strong>. All future PDF quotes will use these values.
              Changes apply to newly generated PDFs only &mdash; previously downloaded PDFs are not affected.
            </Step>
          </Section>

          {/* SOP 7: Profile & Account */}
          <Section title="SOP 7: Your Profile & Account" description="Managing your profile, password, and appearance">
            <Step number={1} title="Access your profile">
              Click your <strong>name</strong> in the top navigation bar to open your profile page.
            </Step>

            <Step number={2} title="Upload a profile picture">
              On the profile page, click <strong>Upload Photo</strong> to set a profile picture.
              Images are automatically cropped to a square and resized. Click <strong>Remove</strong> to
              go back to your initials.
            </Step>

            <Step number={3} title="Switch between light and dark mode">
              On the profile page under <strong>Appearance</strong>, click <strong>Light</strong> or{" "}
              <strong>Dark</strong> to switch themes. Your preference is saved automatically.
            </Step>

            <Step number={4} title="Change your password">
              On the profile page, enter your current password and your new password (minimum 8 characters).
              Click <strong>Change Password</strong>. You will stay signed in.
            </Step>
          </Section>

          {/* SOP 8: Admin */}
          <Section title="SOP 8: Admin Settings (Admin Only)" description="Session management, password resets, and usage logs">
            <Step number={1} title="Access admin settings">
              Click <strong>Settings</strong> in the navigation bar. Admin sections appear below the
              PDF settings and are only visible to users with the Admin role.
            </Step>

            <Step number={2} title="View and revoke sessions">
              The <strong>Active Sessions</strong> section shows all users and their active sessions.
              Each user is limited to 2 concurrent sessions. Sessions expire after 2 hours of inactivity.
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Click <strong>Revoke</strong> to end a specific session</li>
                <li>Click <strong>Revoke All</strong> to end all sessions for a user</li>
              </ul>
            </Step>

            <Step number={3} title="Change a user&apos;s password">
              Select a user from the dropdown, enter a new password, and confirm it.
              This will <strong>revoke all their sessions</strong> and force them to sign in again
              with the new password.
            </Step>

            <Step number={4} title="View usage logs">
              Click <strong>View Activity Log</strong> to see all user activity including logins,
              estimate creation/deletion, opportunity wins/losses, session revocations, and password changes.
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
