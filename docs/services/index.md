# Services

Five deployables plus a contracts repo. Each service repo carries its own
Dockerfile, `k8s.yaml`, and CI/CD pipeline.

| Service | Repo | Language | Port | Namespace | Replicas |
|---------|------|----------|------|-----------|----------|
| [Frontend](frontend.md) | managed-agents-frontend | React/TS | 80 (nginx) | default | 2 |
| [Backend](backend.md) | managed-agents-backend | Go (Gin) | 8080 | default | 2 |
| [agent-runtime](agent-runtime.md) | agent-runtime | TypeScript | 50052 | default | 1 |
| [session-manager](session-manager.md) | session-manager | Go | 50053 | default | 2 |
| [sandbox-manager](sandbox-manager.md) | sandbox-manager | Go | 50051 | pi-sandbox-system | 1 |

Cross-service contracts live in
[Duke-ECE/protos](https://github.com/Duke-ECE/protos) and are pinned by
semver tag (currently `v0.4.0`). See [Contracts](../contracts.md).

Runtime secrets come from k8s Secrets, never from the repo: shared
`supabase-service-role` (backend, session-manager), `session-service-token`
(session-manager, agent-runtime), `agent-runtime-llm` (optional runtime
fallback key), and the `ghcr-pull` imagePullSecret everywhere.
