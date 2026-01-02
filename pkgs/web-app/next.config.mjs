/** @type {import('next').NextConfig} */

import { config } from "dotenv";
import fs from "fs";
// import withPWA from "next-pwa"

if (!fs.existsSync("./.env")) {
  config({ path: "../../.env" })
}

// PWAの設定
// const nextConfig = withPWA({
//   dest: "public",
//   disable: process.env.NODE_ENV === "development"
// })({})
const nextConfig = {};

export default nextConfig
