# Changelog

All notable changes to the managed-agents project are documented here.

## 2026-07-21 — Initial platform bring-up

### Team skills (repo created by Weihao)

- Created [Duke-ECE/teamSkills](https://github.com/Duke-ECE/teamSkills) with the
  **VM-connection** skill: how agents connect to and operate the team's 4-node
  Duke VCM Kubernetes cluster over non-interactive SSH, plus the
  `ssh-key-uploader` Go tool for installing team members' SSH keys.
- Tagged the repo with topic `managed-agents`.

### Cluster infrastructure

- Verified the kubeadm cluster (v1.34.9, containerd 2.2.1, Flannel) — all 4 nodes Ready.
- Installed `docker.io` on the control plane for image builds.
- Set up the container registry workflow under the **Duke-ECE** org:
  `ghcr.io/duke-ece/*`, with a cluster-wide `ghcr-pull` imagePullSecret.
- Created a namespace-scoped `github-actions` ServiceAccount + RBAC
  (deployments/services/ingresses in `default`) for CI deploys.
- Installed **ingress-nginx** (Helm) as a DaemonSet with `hostNetwork: true` —
  all nodes serve ports 80/443; reverted a temporary
  `--service-node-port-range` change in favor of the standard Ingress pattern.
- Registered two domains (CNAME → control plane VM):
  `managed-agents.colab.duke.edu` and `api-managed-agent.colab.duke.edu`.

### Frontend — [Duke-ECE/managed-agents-frontend](https://github.com/Duke-ECE/managed-agents-frontend)

- Scaffolded a Vite + React app; multi-stage Dockerfile (node build → nginx).
- Deployed to the cluster (2 replicas, ClusterIP + Ingress).
- Full CI/CD: PR build check → image push to ghcr (`:<sha>` + `:latest`) →
  `kubectl apply` + rollout on every push to `main`.
- Frontend now calls the backend API and renders its response.
- Public: <http://managed-agents.colab.duke.edu>

### Backend — [Duke-ECE/managed-agents-backend](https://github.com/Duke-ECE/managed-agents-backend)

- New Express API service: `GET /api/health`, `GET /api/message`, CORS locked
  to the frontend origin.
- Same CI/CD pattern as the frontend; ghcr package auto-created by `GITHUB_TOKEN`.
- Public: <http://api-managed-agent.colab.duke.edu>

### Docs — this site

- Created [Duke-ECE/managed-agents-docs](https://github.com/Duke-ECE/managed-agents-docs):
  VitePress site deployed to GitHub Pages via Actions.
