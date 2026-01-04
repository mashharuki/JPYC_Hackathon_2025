import { MultiSigConfig, TxRequest } from "./types";

export function validateTx(
  config: MultiSigConfig,
  tx: TxRequest
): string[] {
  const warnings: string[] = [];

  if (config.threshold > config.owners.length) {
    warnings.push("Threshold exceeds number of owners");
  }

  if (tx.value <= 0n && tx.data === "0x") {
    warnings.push("Transaction does nothing (no value, no calldata)");
  }

  return warnings;
}
