import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pkg = require('./package.json') as { version: string }
  fs.writeFileSync(
    path.join(process.cwd(), 'public/version.json'),
    JSON.stringify({ version: pkg.version, ts: Date.now() })
  );
} catch {}

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default nextConfig;
