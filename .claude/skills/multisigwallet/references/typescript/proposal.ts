import { buildEIP712TypedData } from "./eip712";
import { MultiSigConfig, TxRequest } from "./types";
import { validateTx } from "./validate";

export function buildProposal(
  config: MultiSigConfig,
  tx: TxRequest
) {
  const warnings = validateTx(config, tx);

  return {
    contractType: "Solidity MultiSig + EIP712",
    chainId: config.chainId,
    contractAddress: config.contractAddress,
    transaction: {
      to: tx.to,
      value: tx.value.toString(),
      data: tx.data,
      nonce: tx.nonce.toString(),
    },
    eip712: buildEIP712TypedData(
      config.chainId,
      config.contractAddress,
      tx
    ),
    threshold: config.threshold,
    owners: config.owners,
    signaturesRequired: config.threshold,
    warnings,
    nextSteps: [
      "Distribute EIP-712 typed data to owners",
      "Collect signatures off-chain",
      "Call executeTransaction with signatures"
    ],
  };
}
