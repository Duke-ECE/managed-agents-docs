import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'PolyAgent',
  description: 'Documentation for the PolyAgent platform (Duke ECE)',
  base: '/managed-agents-docs/',
  head: [['link', { rel: 'icon', href: '/managed-agents-docs/favicon.svg' }]],
  themeConfig: {
    logo: '/favicon.svg',
    logoLink: 'https://managed-agents.colab.duke.edu/',
    nav: [
      { text: 'Developer Guide', link: '/developers/' },
      { text: 'API guide', link: '/developers/api-guide' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Platform', items: [
        { text: 'Services', link: '/services/' },
        { text: 'Contracts', link: '/contracts' },
        { text: 'Operations', link: '/operations' },
        { text: 'Standards', link: '/standards' },
      ] },
      { text: 'Console ↗', link: 'https://managed-agents.colab.duke.edu/console' },
    ],
    search: { provider: 'local' },
    sidebar: [
      { text: 'Documentation home', link: '/' },
      {
        text: 'Developer Guide',
        link: '/developers/',
        items: [
          { text: 'Get started', link: '/developers/' },
          { text: 'JavaScript SDK', link: '/developers/sdk' },
          { text: 'API guide', link: '/developers/api-guide' },
        ],
      },
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
          { text: 'Mobile', link: '/services/mobile' },
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
