import { ArrowLeft, Check, CircleAlert, Copy, Flame, Info, KeyRound, X } from "lucide-react";
import { useState } from "react";
import { PrimaryButton } from "./PrimaryButton";

type AuthState = "login" | "register" | "created";

interface MockedAuthState {
  isLoggedIn: boolean;
  authState: AuthState;
  errorMessage: string;
  credentialCode: string;
}

// Mocked state object - replace with real authentication logic
const mockedState: MockedAuthState = {
  isLoggedIn: false,
  authState: "login",
  errorMessage: "",
  credentialCode:
    "eyJpZCI6ImFiYzEyMyIsInB1YmxpY0tleSI6Ik1GWXdFQVlIS29aSXpqMENBUVlGSzRFRUFBb0RRZ0FFLi4uIiwidHlwZSI6InB1YmxpYy1rZXkifQ==",
};

interface AuthProps {
  onLogin?: () => void;
}

export const Auth = ({ onLogin }: AuthProps) => {
  const [currentState, setCurrentState] = useState<AuthState>(mockedState.authState);
  const [errorMessage, setErrorMessage] = useState<string>(mockedState.errorMessage);
  const [copied, setCopied] = useState(false);

  const handleAuthenticate = () => {
    // Clear any previous error
    setErrorMessage("");

    // Browser will provide passkey UI - no loading state needed
    // Simulate: randomly succeed or fail for demo purposes
    if (Math.random() > 0.5) {
      onLogin?.();
    } else {
      setErrorMessage("Authentication failed. Please try again.");
    }
  };

  const handleRegister = () => {
    // Browser will provide passkey UI - no loading state needed
    // Simulate passkey creation
    setCurrentState("created");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mockedState.credentialCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearError = () => {
    setErrorMessage("");
  };

  // Logo Component (reused across screens)
  const Logo = () => (
    <div className="flex flex-col items-center gap-4">
      <div className="w-20 h-20 bg-kiln-600 rounded-2xl flex items-center justify-center">
        <Flame className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-ink-900">Kiln Notes</h1>
    </div>
  );

  // Login Screen
  if (currentState === "login") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p className="text-base text-ink-500">Track your pottery pieces</p>
        </div>

        <div className="h-16" />

        <div className="w-full flex flex-col gap-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="w-full bg-danger-light rounded-xl p-4 flex items-start gap-3">
              <CircleAlert className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-sm font-medium text-danger-500">Authentication Failed</span>
                <span className="text-sm text-danger-500/80">{errorMessage}</span>
              </div>
              <button
                onClick={clearError}
                className="p-1 hover:bg-danger-500/10 rounded cursor-pointer"
              >
                <X className="w-4 h-4 text-danger-500" />
              </button>
            </div>
          )}

          <PrimaryButton variant="secondary" onClick={handleAuthenticate}>
            Sign in with Passkey
          </PrimaryButton>
          <p className="text-sm text-ink-400 text-center">
            Use your device&apos;s biometric authentication
          </p>
        </div>

        <div className="h-10" />

        <button
          onClick={() => setCurrentState("register")}
          className="flex items-center gap-1.5 cursor-pointer"
        >
          <span className="text-sm text-ink-400">Need access?</span>
          <span className="text-sm font-semibold text-kiln-600">Create Passkey</span>
        </button>
      </div>
    );
  }

  // Register Passkey Screen
  if (currentState === "register") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p className="text-base text-ink-500">Create New Passkey</p>
        </div>

        <div className="h-8" />

        {/* Info Card */}
        <div className="w-full bg-white rounded-2xl border border-cream-200 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-kiln-600" />
            <span className="text-base font-semibold text-ink-900">How it works</span>
          </div>
          <p className="text-sm text-ink-500">
            Create a passkey on this device. You&apos;ll receive a credential code to share with your administrator,
            which will grant you access to track your pottery progress.
          </p>
        </div>

        <div className="h-6" />

        <div className="w-full flex flex-col gap-4">
          <PrimaryButton variant="primary" onClick={handleRegister}>
            <KeyRound className="w-6 h-6 text-white" />
            Create Passkey
          </PrimaryButton>
          <p className="text-sm text-ink-400 text-center">
            Uses your device&apos;s biometric authentication
          </p>
        </div>

        <div className="h-6" />

        <button
          onClick={() => setCurrentState("login")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-ink-500" />
          <span className="text-sm font-medium text-ink-500">Back to Sign In</span>
        </button>
      </div>
    );
  }

  // Passkey Created (Success) Screen
  if (currentState === "created") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="w-20 h-20 bg-kiln-600 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-white" />
        </div>

        <div className="h-2" />

        <div className="flex flex-col items-center gap-1">
          <h2 className="text-2xl font-bold text-ink-900">Passkey Created</h2>
          <p className="text-sm text-ink-500">Share this code with your administrator</p>
        </div>

        <div className="h-6" />

        {/* Credential Code Card */}
        <div className="w-full bg-white rounded-xl border border-cream-200 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500 tracking-wide">
              Credential code
            </span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 bg-cream-100 rounded-md px-2 py-1 active:bg-cream-200 cursor-pointer"
            >
              <Copy className="w-3 h-3 text-ink-500" />
              <span className="text-xs text-ink-500">
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
          </div>
          <textarea
            readOnly
            value={mockedState.credentialCode}
            rows={5}
            className="bg-cream-100 rounded-lg p-3 text-xs text-ink-500 resize-none w-full focus:outline-none"
          />
        </div>

        <div className="h-4" />

        {/* Instructions Card */}
        <div className="w-full bg-white rounded-xl border border-cream-200 p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-ink-900">Next Steps</h3>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 bg-cream-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-ink-500">1</span>
            </div>
            <span className="text-sm text-ink-500">Copy the credential code above</span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 bg-kiln-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-white">2</span>
            </div>
            <span className="text-sm text-ink-900 font-medium">Send it to your administrator</span>
          </div>
        </div>

        <div className="h-6" />

        <PrimaryButton variant="secondary" onClick={() => setCurrentState("login")}>
          <ArrowLeft className="w-4 h-4 text-ink-900" />
          Back to Sign In
        </PrimaryButton>
      </div>
    );
  }

  return null;
};
