import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

try {
  fs.writeFileSync(
    path.join(process.cwd(), 'public/version.json'),
    JSON.stringify({ ts: Date.now() })
  );
} catch {}

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default nextConfig;
