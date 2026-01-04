export type Address = `0x${string}`;

export interface MultiSigConfig {
  chainId: number;
  contractAddress: Address;
  owners: Address[];
  threshold: number;
}

export interface TxRequest {
  to: Address;
  value: bigint;
  data: `0x${string}`;
  nonce: bigint;
}
