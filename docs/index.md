---
layout: home
title: Documentation
hero:
  name: Documentation
  text: Find the right guide.
  tagline: Integration steps, API examples, and technical references for Managed Agents.
  actions:
    - theme: brand
      text: Start integrating
      link: /developers/
    - theme: alt
      text: Open the console ↗
      link: https://managed-agents.colab.duke.edu/agents
features:
  - title: 01 · Get started
    details: Create an agent and API key, then connect your application from its server.
    link: /developers/
    linkText: Developer Guide
  - title: 02 · Call the API
    details: Authentication, copyable requests, streamed events, and session endpoints.
    link: /developers/api-guide
    linkText: API guide
  - title: 03 · Understand the system
    details: Follow the request flow and inspect the proposed architecture diagram.
    link: /architecture
    linkText: Architecture
  - title: 04 · Run the platform
    details: Deployment, operations, contracts, and service implementation guides.
    link: /operations
    linkText: Operations
---

## Choose a path

### Integrating an application

Start with the [Developer Guide](./developers/) for agent and API key setup.
Keep the [API guide](./developers/api-guide) nearby for request bodies, SSE
events, response handling, and errors. The [console](https://managed-agents.colab.duke.edu/agents)
is where you configure agents and issue keys.

### Working on the platform

Read the [Architecture](./architecture) page for the current request flow and
the proposed design diagram. The [service guides](./services/) describe each
repository's responsibilities; [Contracts](./contracts) cover their shared
gRPC interfaces.

### Deploying or troubleshooting

Use [Deployment](./deployment) for release layout, [Operations](./operations)
for cluster procedures, [Engineering Standards](./standards) for contribution
rules, and the [Changelog](./changelog) for shipped changes.

Looking for the product overview? Go to the
[Managed Agents homepage](https://managed-agents.colab.duke.edu/).
