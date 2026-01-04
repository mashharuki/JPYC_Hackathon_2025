module.exports = {
  CoinbaseWalletSDK: jest.fn().mockImplementation(() => ({
    makeWeb3Provider: jest.fn(),
    disconnect: jest.fn()
  }))
}
