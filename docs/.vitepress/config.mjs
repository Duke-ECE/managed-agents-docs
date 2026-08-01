import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Managed Agents',
  description: 'Documentation for the managed-agents platform (Duke ECE)',
  base: '/managed-agents-docs/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Services', link: '/services/' },
      { text: 'Contracts', link: '/contracts' },
      { text: 'Operations', link: '/operations' },
      { text: 'Standards', link: '/standards' },
    ],
    sidebar: [
      { text: 'Project Overview', link: '/' },
      { text: 'Architecture', link: '/architecture' },
      {
        text: 'Services',
        link: '/services/',
        items: [
          { text: 'Backend', link: '/services/backend' },
          { text: 'agent-runtime', link: '/services/agent-runtime' },
          { text: 'session-manager', link: '/services/session-manager' },
          { text: 'sandbox-manager', link: '/services/sandbox-manager' },
          { text: 'Frontend', link: '/services/frontend' },
        ],
      },
      { text: 'Contracts (protos)', link: '/contracts' },
      { text: 'Deployment', link: '/deployment' },
      { text: 'Operations', link: '/operations' },
      { text: 'Engineering Standards', link: '/standards' },
      { text: 'Changelog', link: '/changelog' },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Duke-ECE/managed-agents-docs' },
    ],
  },
})
