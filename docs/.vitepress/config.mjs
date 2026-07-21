import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Managed Agents',
  description: 'Documentation for the managed-agents project (Duke ECE)',
  base: '/managed-agents-docs/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: [
      { text: 'Project Overview', link: '/' },
      { text: 'Changelog', link: '/changelog' },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Duke-ECE/managed-agents-docs' },
    ],
  },
})
