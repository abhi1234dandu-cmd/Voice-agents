import { AppHeader } from "@/components/AppHeader";
import { SignInForm } from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex min-h-[calc(100vh-84px)] w-full max-w-6xl items-center px-4 py-12 sm:px-6">
        <SignInForm />
      </main>
    </>
  );
}
