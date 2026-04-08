/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer usa módulos nativos (canvas, encoding) que não existem
  // no ambiente serverless da Vercel. As configurações abaixo garantem que o
  // renderer rode somente no client-side (via dynamic import com ssr: false).
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Evita que o webpack tente resolver módulos nativos ausentes no server
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        encoding: false,
      };
    }
    return config;
  },

  // Exclui @react-pdf/renderer do bundle de Server Components:
  // será carregado como módulo externo apenas quando necessário.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
