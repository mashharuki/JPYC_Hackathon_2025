// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Worker
class Worker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }

  postMessage(msg) {
    this.onmessage(msg);
  }
}
global.Worker = Worker;
