import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Provider } from "@/lib/types";
import MedLocator from "./components/MedLocator";

export const dynamic = "force-static";

async function loadProviders(): Promise<Provider[]> {
  const path = resolve(process.cwd(), "public/providers.json");
  const raw = await readFile(path, "utf8");
  const { providers } = JSON.parse(raw) as { providers: Provider[] };
  return providers;
}

export default async function Home() {
  const providers = await loadProviders();
  return <MedLocator initialProviders={providers} />;
}
