import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] py-16">
      <div className="mx-auto max-w-md">
        <div className="text-xs uppercase tracking-[0.22em] text-black/40">
          photographi.nes
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Connexion admin
        </h1>
        <p className="mt-3 text-sm text-black/60">
          Réservé à Inès. Connecte-toi pour gérer la boutique.
        </p>

        <div className="mt-10 rounded-3xl border border-black/10 bg-white p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
