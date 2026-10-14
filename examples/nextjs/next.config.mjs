/** @type {import('next').NextConfig} */
const nextConfig = {
  // The custom elements are registered on the client by the lazy loader, so
  // nothing about the Web Components package needs transpilation on the server.
  // `transpilePackages` stays off: the package ships ESM with explicit exports
  // (ADR-012), which Next's bundler resolves directly.
}

export default nextConfig
