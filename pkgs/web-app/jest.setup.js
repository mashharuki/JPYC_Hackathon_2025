// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom"
import { TextDecoder, TextEncoder } from "util"
import "whatwg-fetch"

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill for BigInt serialization
BigInt.prototype.toJSON = function () {
  return Number(this)
}

// Mock Worker
class Worker {
  constructor(stringUrl) {
    this.url = stringUrl
    this.onmessage = () => {}
  }

  postMessage(msg) {
    this.onmessage(msg)
  }
}
global.Worker = Worker
