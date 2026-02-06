import { Result, useAtom, useAtomSet } from "@effect-atom/atom-react";
import { useState } from "react";
import { authenticatePasskeyAtom, registerPasskeyAtom } from "../effect/client/atom";
import { LoginView, PasskeyCreatedView, RegisterView } from "./auth/AuthViews";

type AuthState = "login" | "register" | "created";

export const Auth = () => {
  const [currentState, setCurrentState] = useState<AuthState>("login");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const [credentialCode, registerPasskey] = useAtom(registerPasskeyAtom, { mode: "promise" });
  const authenticatePasskey = useAtomSet(authenticatePasskeyAtom, { mode: "promise" });

  const handleAuthenticate = () => {
    setErrorMessage("");
    authenticatePasskey().catch((error) => {
      setErrorMessage(error.message || "Authentication failed");
    });
  };

  const handleRegister = () => {
    setErrorMessage("");
    registerPasskey()
      .then((code) => {
        setCurrentState("created");
      })
      .catch((error) => {
        setErrorMessage(error.message || "Registration failed");
      });
  };

  const handleCopyCode = () => {
    if (Result.isSuccess(credentialCode)) {
      navigator.clipboard.writeText(credentialCode.value);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearError = () => setErrorMessage("");

  if (currentState === "login") {
    return (
      <LoginView
        errorMessage={errorMessage}
        onAuthenticate={handleAuthenticate}
        onDismissError={clearError}
        onGoToRegister={() => setCurrentState("register")}
      />
    );
  }

  if (currentState === "register") {
    return <RegisterView onRegister={handleRegister} onBackToLogin={() => setCurrentState("login")} />;
  }

  if (currentState === "created") {
    return (
      <PasskeyCreatedView
        credentialCode={Result.getOrElse(credentialCode, () => "")}
        copied={copied}
        onCopyCode={handleCopyCode}
        onBackToLogin={() => setCurrentState("login")}
      />
    );
  }

  return null;
};
