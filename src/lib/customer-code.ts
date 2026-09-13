import { prisma } from "./db";

// The code's letter comes from the first A–Z character of the customer's name
// (then surname, then email). No letter at all → bucket "X".
export function customerCodeLetter(
  name?: string | null,
  surname?: string | null,
  email?: string | null
): string {
  const src = `${name ?? ""} ${surname ?? ""} ${email ?? ""}`;
  const m = src.match(/[A-Za-z]/);
  return m ? m[0].toUpperCase() : "X";
}

// Allocate the next sequential code for a letter, e.g. A001, A002…
// Sequence is global and based on the highest code ever issued for that letter,
// so codes are never reused — archived customers keep theirs.
export async function nextCustomerCode(letter: string): Promise<string> {
  const existing = await prisma.customer.findMany({
    where: { customerCode: { startsWith: letter } },
    select: { customerCode: true },
  });
  let max = 0;
  for (const c of existing) {
    const n = parseInt((c.customerCode ?? "").slice(1), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `${letter}${String(max + 1).padStart(3, "0")}`;
}
