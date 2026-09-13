import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CustomerForm from "@/components/customer/CustomerForm";

export default async function NewCustomerPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Add Customer</h2>
          <Link href="/customers">
            <Button variant="ghost" size="sm">
              Back to Customers
            </Button>
          </Link>
        </div>
        <CustomerForm />
      </main>
    </>
  );
}
