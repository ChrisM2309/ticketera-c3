import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Las URLs públicas terminan en barra (SEO_ROUTES.md, sección 5): sin esto, los enlaces y canónicos redirigen.
  trailingSlash: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
