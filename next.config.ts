import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Las URLs públicas terminan en barra (SEO_ROUTES.md, sección 5): sin esto, los enlaces y canónicos redirigen.
  trailingSlash: true,
  // Cabeceras de seguridad mínimas (T17). CSP queda pendiente: Next necesita scripts en línea y hay que probarla antes.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
