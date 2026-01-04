module.exports = {
  compactDecrypt: jest.fn(),
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue("mock-jwt")
  })),
  jwtVerify: jest.fn().mockResolvedValue({ payload: {} })
  // Add other exports as needed
}
