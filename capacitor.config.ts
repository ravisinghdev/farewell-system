import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.farewellsystem.app",
  appName: "FarewellSystem",
  webDir: "out",
  // When building for Android production, usage of 'server' is often removed
  // or set to the production URL. For local dev, we use the IP.
  server: {
    // REPLACE WITH YOUR COMPUTER'S IP ADDRESS for local development (e.g. 192.168.1.5:3000)
    // REPLACE WITH YOUR PRODUCTION URL for final build (e.g. https://farewell-system.vercel.app)
    url: "https://farewell-system.vercel.app",
    cleartext: true,
  },
};

export default config;
