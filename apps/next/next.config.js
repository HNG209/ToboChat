/** @type {import('next').NextConfig} */
const { withTamagui } = require('@tamagui/next-plugin')

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // modularizeImports: {
  //   '@tamagui/lucide-icons': {
  //     transform: '@tamagui/lucide-icons/dist/esm/icons/{{kebabCase member}}',
  //     skipDefaultConversion: true,
  //   },
  // },
  transpilePackages: [
    'solito',
    'react-native-web',
    '@tamagui/react-native-svg',
    '@tamagui/next-theme',
    '@tamagui/lucide-icons',
    'expo-linking',
    'expo-constants',
    'expo-modules-core', // Quan trọng
    // Workspace packages (Yarn workspaces): must be transpiled by Next
    'app',
    '@my/config',
    '@my/ui',
  ],
  experimental: {
    scrollRestoration: true,
  },
  // Giữ lại cấu hình Turbopack của bạn
  turbopack: {
    resolveAlias: {
      'react-native': 'react-native-web',
      'react-native-svg': '@tamagui/react-native-svg',
    },
  },
  webpack: (config, { isServer }) => {
    // Ép Webpack tìm file .web trước
    config.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.js',
      ...config.resolve.extensions, // Sau đó mới đến các đuôi thường
    ]

    // Sửa lỗi webpack không nhận ra alias react-native (nếu có)
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
    }

    return config
  },
}

// BỌC CẤU HÌNH BẰNG withTamagui
module.exports = function () {
  return withTamagui({
    config: './tamagui.config.ts', // Đường dẫn tới file config tamagui của bạn
    components: ['tamagui', '@my/ui'], // Các gói cần Tamagui xử lý compiler

    // Môi trường dev: Tắt nén code để tránh lỗi build nhanh
    disableExtraction: process.env.NODE_ENV === 'development',

    // Tùy chọn khác
    useReactNativeWebLite: true,
    outputCSS: process.env.NODE_ENV === 'production' ? './public/tamagui.css' : null,
  })(nextConfig)
}
