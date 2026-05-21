/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    if (!isServer) {
      config.output.globalObject = "self";
    }

    return config;
  },
};

module.exports = nextConfig;
