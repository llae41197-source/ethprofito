import { AuthForm } from "@/components/auth-form";
import { getOptionalSession } from "@/lib/session";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const session = await getOptionalSession();

  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/wallet");
  }

  return (
    <main className="shell section">
      <div className="auth-page">
        <section>
          <span className="kicker">Secure access</span>
          <h1 className="section-title">Sign in to view balances, wallet activity, and trades.</h1>
        </section>

        <AuthForm nextPath={params.next} />
      </div>
    </main>
  );
}
