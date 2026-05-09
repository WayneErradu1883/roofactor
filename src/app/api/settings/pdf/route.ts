import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Upsert to ensure the default row exists
  const settings = await prisma.pdfSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const settings = await prisma.pdfSettings.upsert({
    where: { id: "default" },
    update: {
      companyName: body.companyName ?? undefined,
      companyTagline: body.companyTagline ?? undefined,
      companyLogo: body.companyLogo !== undefined ? body.companyLogo : undefined,
      documentTitle: body.documentTitle ?? undefined,
      termsAndConditions:
        body.termsAndConditions !== undefined
          ? body.termsAndConditions
          : undefined,
      footerText: body.footerText ?? undefined,
      quoteValidityDays: body.quoteValidityDays ?? undefined,
      contactPhone:
        body.contactPhone !== undefined ? body.contactPhone : undefined,
      contactEmail:
        body.contactEmail !== undefined ? body.contactEmail : undefined,
    },
    create: {
      id: "default",
      companyName: body.companyName,
      companyTagline: body.companyTagline,
      companyLogo: body.companyLogo,
      documentTitle: body.documentTitle,
      termsAndConditions: body.termsAndConditions,
      footerText: body.footerText,
      quoteValidityDays: body.quoteValidityDays,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
    },
  });

  return NextResponse.json({ settings });
}
