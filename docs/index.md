---
layout: home
title: Managed Agents
hero:
  name: Managed Agents
  text: Hosted agents for your apps.
  tagline: Configure an agent once, connect from your server, and stream conversations through one API.
  image:
    src: /hero-flow.svg
    alt: Your application connects to the Managed Agents API and a hosted agent
  actions:
    - theme: brand
      text: Get started
      link: /developers/
    - theme: alt
      text: API guide
      link: /developers/api-guide
features:
  - title: Developer Guide
    details: Set up an agent and API key, then connect your application from its server.
    link: /developers/
    linkText: Start integrating
  - title: API guide
    details: Copy HTTP requests for sessions, streaming replies, and reading transcripts.
    link: /developers/api-guide
    linkText: View API examples
  - title: Architecture
    details: See the runtime, session service, and execution environment in the design sketch.
    link: /architecture#design-sketch-proposed
    linkText: Explore the diagram
---

## One platform, two ways to use it

Use the [console](https://managed-agents.colab.duke.edu/) to configure agents and
chat directly. To embed an agent in another application, create an API key and
call the [session API](./developers/api-guide) from your server. Sessions and
transcripts are saved so conversations can continue later.

The [architecture page](./architecture) includes a proposed system diagram and
explains where the current deployment differs from that design.

## Platform at a glance

| Capability | Current behavior |
| --- | --- |
| Hosted agents | Reusable templates with instructions, model settings, and allowed tools |
| Streaming chat | HTTP request with Server-Sent Events for the reply |
| Session history | Durable transcripts with owner-checked access and resume after runtime restarts |
| Authentication | Supabase login for the console; server-side API keys for session calls |
| Tool execution | Isolated sandbox infrastructure exists; runtime wiring is still planned |

## Explore the platform

- [Service guides](./services/) describe the backend, agent runtime, session manager, sandbox manager, and frontend.
- [Contracts](./contracts) document the shared gRPC interfaces.
- [Deployment](./deployment) and [Operations](./operations) cover running the platform.
- [Engineering Standards](./standards) and the [Changelog](./changelog) support contributors.

Managed Agents is a Duke ECE project. The [console](https://managed-agents.colab.duke.edu/)
and [backend API](https://api-managed-agent.colab.duke.edu/) run on the team's
Kubernetes cluster; this documentation is published through GitHub Pages.
