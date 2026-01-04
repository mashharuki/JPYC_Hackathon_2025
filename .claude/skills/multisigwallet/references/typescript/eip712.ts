import { Address, TxRequest } from "./types";

export function buildEIP712TypedData(
  chainId: number,
  verifyingContract: Address,
  tx: TxRequest
) {
  return {
    domain: {
      name: "MultiSigWallet",
      version: "1",
      chainId,
      verifyingContract,
    },
    types: {
      TxRequest: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
        { name: "nonce", type: "uint256" },
      ],
    },
    primaryType: "TxRequest",
    message: {
      to: tx.to,
      value: tx.value.toString(),
      data: tx.data,
      nonce: tx.nonce.toString(),
    },
  };
}
