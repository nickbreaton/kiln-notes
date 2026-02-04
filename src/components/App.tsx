import { useState } from "react";
import { Route, Switch } from "wouter";
import { registerSW } from "virtual:pwa-register";
import { Board } from "./routes/Board";
import { Detail } from "./routes/Detail";
import { Auth } from "./Auth";

registerSW({ immediate: true });

// Mocked auth state - replace with real authentication logic
const mockedAuthState = {
  isLoggedIn: false,
};

export const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(mockedAuthState.isLoggedIn);

  if (!isLoggedIn) {
    return (
      <div className="mx-auto min-h-screen max-w-lg w-full">
        <Auth onLogin={() => setIsLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg w-full">
      <main className="flex flex-col gap-5 pb-8">
        <Switch>
          <Route path="/" component={Board} />
          <Route path="/piece/:id" component={Detail} />
        </Switch>
      </main>
    </div>
  );
};
