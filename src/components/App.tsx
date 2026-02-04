import { useState } from "react";
import { registerSW } from "virtual:pwa-register";
import { Route, Switch } from "wouter";
import { Auth } from "./Auth";
import { Board } from "./routes/Board";
import { Detail } from "./routes/Detail";

registerSW({ immediate: true });

// Mocked auth state - replace with real authentication logic
const mockedAuthState = {
  isLoggedIn: false,
};

export const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(mockedAuthState.isLoggedIn);

  return (
    <div className="mx-auto min-h-svh max-w-lg w-full flex flex-col">
      <main className={isLoggedIn ? "flex flex-1 flex-col gap-5 pb-8" : "flex flex-1 flex-col"}>
        {!isLoggedIn ? <Auth onLogin={() => setIsLoggedIn(true)} /> : (
          <Switch>
            <Route path="/" component={Board} />
            <Route path="/piece/:id" component={Detail} />
          </Switch>
        )}
      </main>
    </div>
  );
};
