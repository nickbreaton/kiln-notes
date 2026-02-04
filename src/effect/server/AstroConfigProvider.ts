import { getSecret } from "astro:env/server";
import { ConfigError, ConfigProvider, ConfigProviderPathPatch, Effect, HashSet } from "effect";

export const AstroConfigProvider = ConfigProvider.fromFlat(
  ConfigProvider.makeFlat({
    load: (path, primitive, _split) => {
      const value = getSecret(path.join("_"));

      if (value === undefined) {
        return Effect.fail(ConfigError.MissingData([...path], `Secret ${path} not found`));
      }

      return Effect.map(primitive.parse(value), (parsed) => [parsed]);
    },

    enumerateChildren: () => Effect.succeed(HashSet.empty()),
    patch: ConfigProviderPathPatch.empty,
  }),
);
