/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer usa módulos nativos (canvas, encoding) que não existem
  // em ambiente serverless. Garante que rode somente via dynamic import com ssr: false.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        encoding: false,
      };
    }
    return config;
  },

  // Next.js 15: renomeado de serverComponentsExternalPackages → serverExternalPackages
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
