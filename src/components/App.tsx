import { Result, useAtom, useAtomRefresh, useAtomSet } from "@effect-atom/atom-react";
import { registerSW } from "virtual:pwa-register";
import { Route, Switch } from "wouter";
import { authenticatePasskeyAtom, registerPasskeyAtom } from "../effect/client/atom";
import { Board } from "./routes/Board";
import { Detail } from "./routes/Detail";

registerSW({ immediate: true });

export const App = () => {
  const [registerResult, register] = useAtom(registerPasskeyAtom);
  const [authenticateResult, authenticate] = useAtom(authenticatePasskeyAtom);

  return (
    <div className="mx-auto min-h-screen max-w-lg w-full">
      <div className="mt-36 border border-black p-4 space-y-4">
        <div>
          <button onClick={() => register()}>Register Passkey</button>
          {Result.isSuccess(registerResult) && (
            <pre className="break-all text-wrap text-xs mt-2">{JSON.stringify(registerResult.value, null, 2)}</pre>
          )}
        </div>
        <div>
          <button onClick={() => authenticate()}>Authenticate Passkey</button>
          {Result.isSuccess(authenticateResult) && (
            <pre className="break-all text-wrap text-xs mt-2">{JSON.stringify(authenticateResult.value)}</pre>
          )}
        </div>
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
