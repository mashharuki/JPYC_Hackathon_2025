export const CONTRACT_ADDRESSES = {
  // Base Sepolia
  84532: {
    SemaphoreVerifier: "0x42F08AA61794dC6ebDbE7DA14d34b1BE4452f301",
    JPYCToken: "0xda683fe053b4344F3Aa5Db6Cbaf3046F7755e5E1",
    InnocentSupportWallet: "0xA5C193EfA151C1266A8bc8aA285f44DE4d45FA6d",
    SemaphoreDonation: "0xC899369b0F04d7b5D23E8E8Cc09EfEcE4a76dBC1",
    Feedback: "0x521a4A2D9A6542A1a578ecF362B8CBeE4Ef46e02"
  },
  // Hardhat Local
  31337: {
    SemaphoreVerifier: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    JPYCToken: "0xda683fe053b4344F3Aa5Db6Cbaf3046F7755e5E1",
    InnocentSupportWallet: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    SemaphoreDonation: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"
  },
  // Sepolia
  11155111: {
    Feedback: "0x80D4401b98093Cc956b639bE5eD38465067d5D53"
  }
} as const

export type ChainId = keyof typeof CONTRACT_ADDRESSES

export const getContractAddresses = (chainId: number) => {
  return CONTRACT_ADDRESSES[chainId as ChainId]
}
