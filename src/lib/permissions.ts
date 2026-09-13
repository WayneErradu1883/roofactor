// Deleting estimates is restricted to a single account (the owner).
// Kept in one place so the API and UI agree.
export const ESTIMATE_DELETE_EMAIL = "wayne.erradu@gmail.com";

export function canDeleteEstimates(
  email: string | null | undefined
): boolean {
  return (email ?? "").trim().toLowerCase() === ESTIMATE_DELETE_EMAIL;
}
