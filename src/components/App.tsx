import { useAtomRefresh, useAtomSet } from "@effect-atom/atom-react";
import { registerSW } from "virtual:pwa-register";
import { Route, Switch } from "wouter";
import { registerPasskeyAtom } from "../effect/client/atom";
import { Board } from "./routes/Board";
import { Detail } from "./routes/Detail";

registerSW({ immediate: true });

export const App = () => {
  const register = useAtomSet(registerPasskeyAtom);

  return (
    <div className="mx-auto min-h-screen max-w-lg w-full">
      <div className="mt-36 border border-black">
        <button onClick={() => register()}>Register Passkey</button>
      </div>
      <main className="flex flex-col gap-5 pb-8">
        <Switch>
          <Route path="/" component={Board} />
          <Route path="/piece/:id" component={Detail} />
        </Switch>
      </main>
    </div>
  );
};
