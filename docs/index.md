# Managed Agents

A Duke ECE team project: a small web platform deployed on a self-managed
Kubernetes cluster running on four Duke VCM virtual machines.

## Architecture

```
internet
  ├─ managed-agents.colab.duke.edu      → frontend (React + Vite)
  └─ api-managed-agent.colab.duke.edu   → backend API (Express)
                    │
        ingress-nginx (DaemonSet, hostNetwork, ports 80/443 on all nodes)
                    │
        4-node kubeadm cluster (Kubernetes v1.34.9, containerd, Flannel)
```

- **Frontend** — React (Vite), served by nginx.
  Repo: [Duke-ECE/managed-agents-frontend](https://github.com/Duke-ECE/managed-agents-frontend)
- **Backend** — Express API (`/api/health`, `/api/message`), CORS-restricted to the frontend origin.
  Repo: [Duke-ECE/managed-agents-backend](https://github.com/Duke-ECE/managed-agents-backend)
- **Skills** — agent skill definitions for operating the cluster (VM connection, SSH key onboarding).
  Repo: [Duke-ECE/teamSkills](https://github.com/Duke-ECE/teamSkills) (created and maintained by Weihao)

## Infrastructure

| Piece | Detail |
|-------|--------|
| Cluster | 4 × Duke VCM VMs (2 CPU / 3.5 GB each), kubeadm, one control plane |
| Registry | `ghcr.io/duke-ece/*` (GitHub Container Registry, org packages) |
| Ingress | ingress-nginx, DaemonSet with `hostNetwork` — every node serves 80/443 |
| Domains | `managed-agents.colab.duke.edu`, `api-managed-agent.colab.duke.edu` (CNAME → control plane VM) |
| CI/CD | GitHub Actions in each repo: build → push image → `kubectl apply` + rollout |
| Docs | This site, built with VitePress, deployed to GitHub Pages by Actions |

## Environments

Both services run in the `default` namespace, 2 replicas each, pulled from
ghcr.io via the `ghcr-pull` imagePullSecret. Deploys authenticate with a
namespace-scoped `github-actions` ServiceAccount (see
`managed-agents-frontend/k8s-ci-rbac.yaml`).
