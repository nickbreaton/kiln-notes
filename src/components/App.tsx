import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,
  onRegisteredSW(swScriptUrl) {
    console.log("SW registered: ", swScriptUrl);
  },
  onOfflineReady() {
    console.log("PWA application ready to work offline");
  },
});

export const App = () => {
  return (
    <div>
      <h1>Kiln Notes</h1>
      <p>Welcome to Kiln Notes!</p>
    </div>
  );
};
