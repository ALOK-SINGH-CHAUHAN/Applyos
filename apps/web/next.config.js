const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@autoapply/shared', '@autoapply/ui', '@autoapply/resume-render'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4000/api/v1/:path*',
      },
      {
        source: '/files/:path*',
        destination: 'http://localhost:4000/files/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
