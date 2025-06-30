import withPWA from '@ducanh2912/next-pwa';

const pwa = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'src/worker',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    // any other next.js config you might have
};

export default pwa(nextConfig);
