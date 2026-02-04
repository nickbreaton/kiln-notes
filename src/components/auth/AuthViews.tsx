import { ArrowLeft, Check, KeyRound } from "lucide-react";
import { PrimaryButton } from "../PrimaryButton";
import { AuthErrorBanner } from "./AuthErrorBanner";
import { AuthHero } from "./AuthHero";
import { AuthScreen } from "./AuthScreen";
import { CredentialCodeCard } from "./CredentialCodeCard";
import { HowItWorksCard } from "./HowItWorksCard";
import { NextStepsCard } from "./NextStepsCard";

export function LoginView({
  errorMessage,
  onAuthenticate,
  onDismissError,
  onGoToRegister,
}: {
  errorMessage: string;
  onAuthenticate: () => void;
  onDismissError: () => void;
  onGoToRegister: () => void;
}) {
  return (
    <AuthScreen>
      <AuthHero subtitle="Track your pottery pieces" />

      <div className="mt-10 w-full flex flex-col gap-4">
        {errorMessage ? <AuthErrorBanner message={errorMessage} onDismiss={onDismissError} /> : null}

        <PrimaryButton variant="secondary" onClick={onAuthenticate}>
          Sign in with passkey
        </PrimaryButton>
        <p className="text-sm text-ink-400 text-center">Use your device’s biometric authentication</p>
      </div>

      <button onClick={onGoToRegister} className="mt-10 flex items-center gap-1.5 cursor-pointer">
        <span className="text-sm text-ink-400">Need access?</span>
        <span className="text-sm font-semibold text-kiln-600">Create passkey</span>
      </button>
    </AuthScreen>
  );
}

export function RegisterView({ onRegister, onBackToLogin }: { onRegister: () => void; onBackToLogin: () => void }) {
  return (
    <AuthScreen>
      <AuthHero subtitle="Track your pottery pieces" />

      <div className="mt-8 w-full">
        <HowItWorksCard />
      </div>

      <div className="mt-6 w-full flex flex-col gap-4">
        <PrimaryButton variant="primary" onClick={onRegister}>
          <KeyRound className="w-6 h-6 text-white" />
          Create passkey
        </PrimaryButton>
        <p className="text-sm text-ink-400 text-center">Uses your device’s biometric authentication</p>
      </div>

      <button onClick={onBackToLogin} className="mt-8 flex items-center gap-2 cursor-pointer">
        <ArrowLeft className="w-4 h-4 text-ink-500" />
        <span className="text-sm font-medium text-ink-500">Back to sign in</span>
      </button>
    </AuthScreen>
  );
}

export function PasskeyCreatedView({
  credentialCode,
  copied,
  onCopyCode,
  onBackToLogin,
}: {
  credentialCode: string;
  copied: boolean;
  onCopyCode: () => void;
  onBackToLogin: () => void;
}) {
  return (
    <AuthScreen>
      <div className="w-20 h-20 bg-kiln-600 rounded-full flex items-center justify-center">
        <Check className="w-10 h-10 text-white" />
      </div>

      <div className="h-2" />

      <div className="flex flex-col items-center gap-1">
        <h2 className="text-2xl font-bold text-ink-900">Passkey Created</h2>
        <p className="text-sm text-ink-500">Share this code with your administrator</p>
      </div>

      <div className="h-6" />

      <CredentialCodeCard code={credentialCode} copied={copied} onCopy={onCopyCode} />

      <div className="h-4" />

      <NextStepsCard />

      <div className="h-6" />

      <PrimaryButton variant="secondary" onClick={onBackToLogin}>
        <ArrowLeft className="w-4 h-4 text-ink-900" />
        Back to sign in
      </PrimaryButton>
    </AuthScreen>
  );
}
