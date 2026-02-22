import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { registerSW } from "virtual:pwa-register";
import { Route, Switch } from "wouter";
import { userAtom } from "../effect/client/atom";
import { Auth } from "./Auth";
import { Board } from "./routes/Board";
import { Detail } from "./routes/Detail";

registerSW({ immediate: true });

export const App = () => {
  const user = useAtomValue(userAtom);

  if (AsyncResult.isInitial(user)) {
    return null;
  }

  if (AsyncResult.isFailure(user)) {
    throw user.cause;
  }

  const isLoggedIn = Option.isSome(user.value);

  return (
    <div className="mx-auto min-h-svh max-w-lg w-full flex flex-col">
      <main className={isLoggedIn ? "flex flex-1 flex-col gap-5 pb-8" : "flex flex-1 flex-col"}>
        {!isLoggedIn ? <Auth /> : (
          <Switch>
            <Route path="/" component={Board} />
            <Route path="/piece/:id" component={Detail} />
          </Switch>
        )}
      </main>
    </div>
  );
};
