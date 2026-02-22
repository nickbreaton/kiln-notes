import { getSecret } from "astro:env/server";
import { ConfigProvider, Effect } from "effect";

export const AstroConfigProvider = ConfigProvider.make((path) =>
  Effect.sync(() => {
    const value = getSecret(path.join("_"));
    return value === undefined ? undefined : ConfigProvider.makeValue(value);
  })
);
