import { useState } from "react";
import { LoginView, PasskeyCreatedView, RegisterView } from "./auth/AuthViews";

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
      setErrorMessage("Could not authenticate passkey. Please try again.");
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

  const clearError = () => setErrorMessage("");

  // Login Screen
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

  // Register Passkey Screen
  if (currentState === "register") {
    return (
      <RegisterView onRegister={handleRegister} onBackToLogin={() => setCurrentState("login")} />
    );
  }

  // Passkey Created (Success) Screen
  if (currentState === "created") {
    return (
      <PasskeyCreatedView
        credentialCode={mockedState.credentialCode}
        copied={copied}
        onCopyCode={handleCopyCode}
        onBackToLogin={() => setCurrentState("login")}
      />
    );
  }

  return null;
};
