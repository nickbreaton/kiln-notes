import { Atom, Result, useAtom, useAtomSet, useAtomValue } from "@effect-atom/atom-react";
import { Cause } from "effect";
import { useState } from "react";
import { authenticatePasskeyAtom, copiedAtom, copyToClipboardAtom, registerPasskeyAtom } from "../effect/client/atom";
import { LoginView, PasskeyCreatedView, RegisterView } from "./auth/AuthViews";

type AuthPage = "login" | "register";

export const Auth = () => {
  const [page, setPage] = useState<AuthPage>("login");

  const [registration, register] = useAtom(registerPasskeyAtom);
  const [authentication, authenticate] = useAtom(authenticatePasskeyAtom);
  const copiedResult = useAtomValue(copiedAtom);
  const copyToClipboard = useAtomSet(copyToClipboardAtom);

  const handleCopyCode = () => {
    if (Result.isSuccess(registration)) {
      copyToClipboard(registration.value);
    }
  };

  const copied = Result.isSuccess(copiedResult) ? copiedResult.value : false;

  if (Result.isSuccess(registration)) {
    return (
      <PasskeyCreatedView
        credentialCode={registration.value}
        copied={copied}
        onCopyCode={handleCopyCode}
        onBackToLogin={() => {
          register(Atom.Reset);
          setPage("login");
        }}
      />
    );
  }

  if (page === "register") {
    return (
      <RegisterView
        onRegister={() => register()}
        onBackToLogin={() => {
          register(Atom.Reset);
          setPage("login");
        }}
      />
    );
  }

  const errorMessage = (() => {
    if (!Result.isFailure(authentication)) return "";
    const squashed = Cause.squash(authentication.cause);
    return squashed instanceof Error ? squashed.message : "Authentication failed";
  })();

  return (
    <LoginView
      errorMessage={errorMessage}
      onAuthenticate={() => authenticate()}
      onDismissError={() => authenticate(Atom.Reset)}
      onGoToRegister={() => {
        authenticate(Atom.Reset);
        setPage("register");
      }}
    />
  );
};
