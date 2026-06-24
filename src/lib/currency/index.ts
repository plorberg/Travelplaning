import { frankfurterProvider } from "./frankfurter";
import { mockProvider } from "./mock";
import type { CurrencyProvider } from "./provider";

// Default to the free Frankfurter driver; set CURRENCY_PROVIDER=mock for offline
// development. Additional paid providers can be added here behind the interface.
export function getCurrencyProvider(): CurrencyProvider {
  switch (process.env.CURRENCY_PROVIDER) {
    case "mock":
      return mockProvider;
    default:
      return frankfurterProvider;
  }
}

export type { CurrencyProvider, RateResult } from "./provider";
