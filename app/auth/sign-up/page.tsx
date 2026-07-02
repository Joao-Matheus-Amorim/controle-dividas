import { SignUpForm } from "@/components/sign-up-form";

type SignUpPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getInviteReturnPath(searchParams?: Record<string, string | string[] | undefined>) {
  const value = searchParams?.next;
  const nextPath = Array.isArray(value) ? value[0] : value;

  if (typeof nextPath !== "string") {
    return undefined;
  }

  try {
    const url = new URL(nextPath, "https://familyfinance.local");

    if (url.origin !== "https://familyfinance.local") {
      return undefined;
    }

    if (url.pathname !== "/auth/convite" || !url.searchParams.get("token")) {
      return undefined;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return undefined;
  }
}

export default async function Page({ searchParams }: SignUpPageProps) {
  const resolvedSearchParams = await searchParams;
  const inviteReturnPath = getInviteReturnPath(resolvedSearchParams);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm redirectTo={inviteReturnPath} />
      </div>
    </div>
  );
}
