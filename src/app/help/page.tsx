import { NavHeader } from "@/components/NavHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </div>
      <div className="space-y-1 pt-0.5">
        <h4 className="font-semibold">{title}</h4>
        <div className="text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}

const TOC: { id: string; label: string }[] = [
  { id: "overview", label: "What is Roofactor?" },
  { id: "getting-around", label: "Getting around (the ☰ Menu)" },
  { id: "customers", label: "1 · Managing customers (CRM)" },
  { id: "new-estimate", label: "2 · Creating an estimate" },
  { id: "quote", label: "3 · Viewing & sending the quote" },
  { id: "won-lost", label: "4 · Marking quotes Won / Lost" },
  { id: "editing", label: "5 · Editing or deleting" },
  { id: "accuracy", label: "6 · Measuring accurately" },
  { id: "settings", label: "7 · Quote & branding settings" },
  { id: "profile", label: "8 · Your profile & password" },
  { id: "admin", label: "9 · Admin tools" },
];

export default function HelpPage() {
  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Help &amp; How-To</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Plain-English guides for everyone who uses Roofactor. Pick a topic
            from the menu on the left.
          </p>
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Side menu / table of contents */}
          <aside className="mb-6 lg:mb-0 lg:w-64 lg:shrink-0">
            <nav className="lg:sticky lg:top-20 space-y-1 rounded-lg border p-3">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contents
              </p>
              {TOC.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {t.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-6">
            <Section
              id="overview"
              title="What is Roofactor?"
              description="A quick overview in plain terms"
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                Roofactor helps Nomiplex measure roofs from satellite images and
                turn those measurements into a professional PDF quotation for a
                customer. In short, the day-to-day flow is:{" "}
                <strong>
                  capture the customer → measure their roof → save &amp;
                  generate the quote → send it → later mark it Won or Lost
                </strong>
                . Everything you create is tied to a customer, so you always
                know who a quote was for and what happened to it.
              </p>
            </Section>

            <Section
              id="getting-around"
              title="Getting around (the ☰ Menu)"
              description="How to move between screens"
            >
              <Step number={1} title="The top bar is on every page">
                No matter where you are, the bar at the top has the{" "}
                <strong>Roofactor</strong> logo (click it to go to the
                Dashboard) and a big <strong>New Estimate</strong> button.
              </Step>
              <Step number={2} title="Open the side menu for everything else">
                Click <strong>☰ Menu</strong> on the top-right. A panel slides in
                from the side with links to every screen — Dashboard, Customers,
                New Estimate, Settings, <strong>Help</strong>, your profile, and{" "}
                <strong>Sign Out</strong>. Admins also see All Estimates and
                Activity. This is your way to get back to any page from anywhere.
              </Step>
              <Step number={3} title="“Back” links">
                Most screens also have a <strong>Back</strong> link near the top
                (for example, a customer or estimate page has a link back to the
                list it came from).
              </Step>
            </Section>

            <Section
              id="customers"
              title="1 · Managing customers (the CRM)"
              description="Capture people first, then quote them"
            >
              <Step number={1} title="Open Customers">
                Click <strong>Customers</strong> (top bar on desktop, or in the ☰
                Menu). At the top you&apos;ll see three coloured tiles:{" "}
                <strong>Total Customers</strong>,{" "}
                <strong>Customers Quoted</strong>, and{" "}
                <strong>Quotes Won</strong>. These stay pinned to the top as you
                scroll.
              </Step>
              <Step number={2} title="Add a customer">
                Click <strong>Add Customer</strong>. Fill in as much as you know
                — Title (Mr, Mrs, Dr, Miss…), Name, Surname, Physical Address,
                Telephone, Email, and internal Notes.{" "}
                <strong>Every field is optional</strong>, so you can capture just
                a name and phone number if that&apos;s all you have. Click{" "}
                <strong>Save Customer</strong>.
              </Step>
              <Step number={3} title="Notes stay private">
                The <strong>Notes</strong> on a customer are for your team only —
                they are <strong>never printed on a quote</strong>. Use them for
                reminders like “prefers WhatsApp” or “gate code 1234”.
              </Step>
              <Step number={4} title="Find, sort and pin">
                Use the <strong>filter box</strong> to search by name, phone or
                email, and the <strong>sort dropdown</strong> to order the list
                (A–Z, Z–A, recently quoted, or most quotes). The list is
                alphabetical by default. Click <strong>☆ Pin</strong> on a
                regular customer to keep them in a <strong>Pinned</strong>{" "}
                section at the top for quick access; click again to unpin.
              </Step>
              <Step number={5} title="See a customer’s history">
                Click a customer to open their page. You can{" "}
                <strong>edit and save</strong> their details at any time, and
                you&apos;ll see every quote you&apos;ve sent them — the quote
                number, the total, whether it was <strong>Won/Lost/Open</strong>,
                when it was created, and the date and time it was{" "}
                <strong>sent</strong>. Click any quote to open it.
              </Step>
            </Section>

            <Section
              id="new-estimate"
              title="2 · Creating an estimate"
              description="Measure a roof and build the quote"
            >
              <Step number={1} title="Start">
                Click <strong>New Estimate</strong> in the top bar.
              </Step>
              <Step number={2} title="Find the property">
                Type the address and press Enter. The map flies to the property
                and drops a pin. (Addresses must be in South Africa.)
              </Step>
              <Step number={3} title="Choose the customer (required)">
                In the <strong>Customer</strong> box, search for the person this
                quote is for and select them. If they&apos;re not in the system
                yet, click <strong>+ New customer</strong> and capture the basics
                right there — they&apos;ll be saved to the CRM and selected
                automatically. <strong>You must pick a customer before you can
                save.</strong>
              </Step>
              <Step number={4} title="Use the reference overlays (optional)">
                Roofactor shows building outlines it found automatically — an{" "}
                <strong>orange</strong> one (Microsoft) and a <strong>blue</strong>{" "}
                one (OpenStreetMap) — plus a <strong>Street View</strong> panel to
                eyeball the roof. These are guides only; you still draw the real
                shape yourself.
              </Step>
              <Step number={5} title="Draw the roof">
                Click the polygon (pentagon) icon on the map, click each corner of
                the roof, then click the first point again to close it. The area
                updates as you go. Draw one shape per roof section if the roof has
                parts at different angles. Use the pencil to adjust and the bin to
                delete; <strong>Reset Map Selection</strong> clears everything.
              </Step>
              <Step number={6} title="Set the pitch (steepness)">
                Steeper roofs have more surface than the flat outline. If Google
                detected the pitch you&apos;ll see it in a banner and it&apos;s
                applied automatically; otherwise the default is 22.5° and you can
                change it per section. Use Street View to sanity-check.
              </Step>
              <Step number={7} title="Set the rate">
                Adjust the <strong>rate per m²</strong>. The total is simply
                surface area × rate. Add any site notes (access, roof condition,
                etc.).
              </Step>
              <Step number={8} title="Save &amp; Generate">
                Click <strong>Save &amp; Generate Estimate</strong> (or press
                Ctrl+S). Roofactor saves the job, issues a permanent{" "}
                <strong>quote number</strong>, and takes you straight to the
                estimate page where you can view, download or send the PDF.
              </Step>
            </Section>

            <Section
              id="quote"
              title="3 · Viewing &amp; sending the quote"
              description="The PDF, and how “sent” is recorded"
            >
              <Step number={1} title="The estimate page">
                After saving (or by clicking any estimate) you land on the
                estimate page. It shows the customer (click to open their CRM
                record), the quote number, when it was created, whether it&apos;s
                been sent, the measurements and the cost.
              </Step>
              <Step number={2} title="Download or view the PDF">
                Click <strong>Download PDF Quote</strong> to save it, or{" "}
                <strong>View PDF</strong> to preview it in a new tab. The quote
                shows your company logo, a <strong>Prepared For</strong> block
                with the customer&apos;s name and contact details, the property,
                a satellite picture of the roof, the measurements, the total, and
                your terms. The <strong>quote number stays the same</strong>{" "}
                every time — it&apos;s issued once when you save.
              </Step>
              <Step number={3} title="Send by WhatsApp">
                Click <strong>WhatsApp to Customer</strong>, enter their cell
                number (082… numbers convert to +27 automatically) and click{" "}
                <strong>Send</strong>. On a phone it opens the share sheet with
                the PDF attached; on a computer it downloads the PDF and opens
                WhatsApp Web with a ready-made message to attach it to.
              </Step>
              <Step number={4} title="“Sent” is recorded automatically">
                The first time you download, view or WhatsApp a quote, Roofactor
                stamps the <strong>date and time it was sent</strong>. You&apos;ll
                see that on the estimate page and on the customer&apos;s history.
              </Step>
              <Step number={5} title="If something goes wrong">
                If a PDF can&apos;t be generated, a red message explains why
                instead of the button doing nothing. Send that message to whoever
                supports the app.
              </Step>
            </Section>

            <Section
              id="won-lost"
              title="4 · Marking quotes Won or Lost"
              description="Keep your numbers honest"
            >
              <Step number={1} title="The login reminder">
                When you sign in, the Dashboard shows an{" "}
                <strong>amber reminder</strong> if you have open quotes that still
                need a decision. This nudges you to update anything you&apos;re
                waiting on.
              </Step>
              <Step number={2} title="Mark it">
                In the estimates table on the Dashboard, an open quote shows{" "}
                <strong>Won</strong> and <strong>Lost</strong> buttons. Click one
                and enter a short reason (e.g. “Customer accepted” or “Went with a
                competitor”). The reason is saved and shown when you hover the
                badge.
              </Step>
              <Step number={3} title="Changed your mind?">
                Click the small circular <strong>undo</strong> icon next to a
                Won/Lost badge to set it back to Open.
              </Step>
              <Step number={4} title="Where the numbers show">
                The Dashboard tiles track Won, Lost, Revenue Won, Conversion Rate
                and Pipeline Value for the month. The Customers screen shows how
                many quotes each person has and how many were won.
              </Step>
            </Section>

            <Section
              id="editing"
              title="5 · Editing or deleting an estimate"
              description="Fix a rate, or remove a job"
            >
              <Step number={1} title="Edit the rate or notes">
                On the estimate page, click <strong>Edit</strong> in the Cost
                Estimate box. Change the rate per m² (the new total is shown as
                you type) or the notes, then <strong>Save Changes</strong>. The
                next PDF you generate uses the updated figures.
              </Step>
              <Step number={2} title="Update the customer’s details">
                To change the customer&apos;s name, phone, address or email, open
                the customer from the estimate page (or Customers list) and edit
                them there — the changes belong to the customer record.
              </Step>
              <Step number={3} title="Deleting is restricted">
                Deleting an estimate is permanent and{" "}
                <strong>only Wayne (wayne.erradu@gmail.com) can do it</strong>.
                Everyone else won&apos;t see a Delete button. If a quote needs
                removing, ask Wayne.
              </Step>
            </Section>

            <Section
              id="accuracy"
              title="6 · Measuring accurately"
              description="Getting the area right"
            >
              <Step number={1} title="Zoom right in">
                The closer you zoom before drawing, the more precisely you can
                place each corner.
              </Step>
              <Step number={2} title="Draw only what gets coated">
                The auto outlines may include the whole building or overhangs.
                Trace only the roof area you&apos;re actually quoting.
              </Step>
              <Step number={3} title="Add points on curves">
                For rounded or odd shapes, click more points to follow the edge
                closely.
              </Step>
              <Step number={4} title="Check confidence, then trust your polygon">
                A High/Medium/Low confidence badge tells you how well the
                automatic sources agree — but your hand-drawn shape is always the
                one that counts. For big jobs, verify a dimension on site.
              </Step>
            </Section>

            <Section
              id="settings"
              title="7 · Quote &amp; branding settings"
              description="Make the PDF look like yours"
            >
              <Step number={1} title="Open Settings">
                Open the <strong>☰ Menu</strong> and click{" "}
                <strong>Settings</strong>.
              </Step>
              <Step number={2} title="Logo &amp; company name">
                Upload your logo and set your company name — they appear at the
                top of every quote. (Tip: a PNG or JPG logo is safest.)
              </Step>
              <Step number={3} title="Title, terms &amp; contact">
                Change the document title (e.g. QUOTATION), write your Terms &amp;
                Conditions (use <code>{"{validity}"}</code> to insert the number
                of days a quote is valid), and add the phone/email that appear in
                the footer.
              </Step>
              <Step number={4} title="Save">
                Click <strong>Save PDF Settings</strong>. New quotes use the new
                settings; already-downloaded PDFs don&apos;t change.
              </Step>
            </Section>

            <Section
              id="profile"
              title="8 · Your profile &amp; password"
              description="Your account"
            >
              <Step number={1} title="Open your profile">
                Open the <strong>☰ Menu</strong> and click your name.
              </Step>
              <Step number={2} title="Photo &amp; theme">
                Upload a profile photo, and switch between Light and Dark mode —
                your choice is remembered.
              </Step>
              <Step number={3} title="Change your password">
                Enter your current and new password (at least 8 characters) and
                save. You stay signed in.
              </Step>
            </Section>

            <Section
              id="admin"
              title="9 · Admin tools (admins only)"
              description="For managers"
            >
              <Step number={1} title="All Estimates & Activity">
                Admins get <strong>All Estimates</strong> (a company-wide view)
                and <strong>Activity</strong> (a log of logins, quotes created,
                Won/Lost changes and more) in the ☰ Menu.
              </Step>
              <Step number={2} title="Sessions & passwords">
                In Settings, admins can see who&apos;s signed in, revoke
                sessions, and reset a user&apos;s password (which signs that user
                out everywhere).
              </Step>
            </Section>
          </div>
        </div>
      </main>
    </>
  );
}
