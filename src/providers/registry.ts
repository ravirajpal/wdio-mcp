import type { SessionProvider } from "./types";
import { localBrowserProvider } from "./local-browser.provider";
import { localAppiumProvider } from "./local-appium.provider";
import { browserStackProvider } from "./cloud/browserstack.provider";
import { lambdaTestProvider } from "./cloud/lambdatest.provider";

export function getProvider(
  providerName: string,
  platform: string,
): SessionProvider {
  if (providerName === "browserstack") return browserStackProvider;
  if (providerName === "lambdatest") return lambdaTestProvider;
  return platform === "browser" ? localBrowserProvider : localAppiumProvider;
}
