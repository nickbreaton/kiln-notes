import { registerSW } from "virtual:pwa-register";
import { Board } from "./routes/Board";
import { Route, Switch } from "wouter";
import { Detail } from "./routes/Detail";

registerSW({ immediate: true });

export const App = () => {
  return (
    <div>
      <div className="mx-auto min-h-screen max-w-lg w-full">
        <main className="flex flex-col gap-6 pb-8 pt-5">
          <Switch>
            <Route path="/" component={Board} />
            <Route path="/piece/:id" component={Detail} />
          </Switch>
        </main>
      </div>
    </div>
  );
};
