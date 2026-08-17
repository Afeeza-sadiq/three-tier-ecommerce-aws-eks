# Production-Ready Three-Tier E-Commerce Platform on AWS EKS

A demo e-commerce platform showing a full production-style DevOps workflow: infrastructure
as code, container orchestration, GitOps-driven CI/CD, and cloud-native monitoring.

**Stack:** AWS · Terraform · Kubernetes (EKS) · Docker · Jenkins · Argo CD · Amazon ECR · RDS · ALB · CloudWatch

## Architecture

```
                                   ┌─────────────────────┐
                                   │   Application Load   │
                     Internet ───▶ │   Balancer (ALB)      │
                                   └──────────┬───────────┘
                                              │
                     ┌────────────────────────┼────────────────────────┐
                     ▼                                                 ▼
          ┌─────────────────────┐                          ┌─────────────────────┐
          │  Frontend Service    │                          │  Backend Service     │
          │  (React + nginx)     │  ──── /api/* ───────────▶│  (Node/Express API)  │
          │  EKS Pods x2 (HPA)   │                          │  EKS Pods x2 (HPA)   │
          └─────────────────────┘                          └──────────┬──────────┘
                                                                        │
                                                                        ▼
                                                            ┌─────────────────────┐
                                                            │  Amazon RDS (MySQL)  │
                                                            │  Private DB subnets  │
                                                            └─────────────────────┘

  VPC: public subnets (ALB/NAT) · private subnets (EKS nodes) · isolated DB subnets

  CI/CD:  git push → Jenkins (build, test, Trivy scan, push to ECR) →
          updates GitOps repo → Argo CD auto-syncs cluster (rolling update)

  Observability: CloudWatch log groups, Container Insights, CPU alarms
```

## Repo layout

```
terraform/     VPC, EKS cluster + node group, IAM (incl. IRSA for ALB controller),
               RDS MySQL, ECR repos, CloudWatch log groups/alarms
app/
  frontend/    React storefront (product listing, place order)
  backend/     Node/Express REST API (products, orders) + MySQL connection pool
  db/          schema.sql — tables + seed data
docker/        Multi-stage Dockerfiles for both services
k8s/           Namespace, ConfigMap, Secret template, Deployments, Services,
               HPA, ALB Ingress (path-based routing: / → frontend, /api → backend)
ci-cd/         Jenkinsfile (build/scan/push/update-gitops) + Argo CD Application manifest
docs/          DEPLOYMENT.md — full step-by-step setup guide
```

## What this demonstrates

- **Infrastructure as Code** — entire AWS footprint (20+ resources: VPC, subnets, NAT,
  EKS, IAM/IRSA, ECR, RDS, CloudWatch) is Terraform-managed and reproducible.
- **Container orchestration** — Deployments, Services, ConfigMaps/Secrets, HPA, and
  rolling updates on EKS for zero-downtime releases.
- **CI/CD + GitOps** — Jenkins builds and security-scans images (Trivy), pushes to ECR,
  and updates a GitOps repo that Argo CD continuously syncs to the cluster.
- **Monitoring** — CloudWatch Container Insights, log groups, and CPU alarms for
  infrastructure visibility.

## Getting started

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full step-by-step guide
(Terraform apply → kubectl config → ALB controller → build/push images → deploy → wire up
Jenkins/Argo CD).

## Local development (without AWS)

```bash
# backend
cd app/backend && npm install
DB_HOST=localhost DB_USER=root DB_PASSWORD=pass DB_NAME=ecommerce npm run dev

# frontend
cd app/frontend && npm install && npm start
```

Point a local MySQL instance at `app/db/schema.sql` to seed sample data.

## Cost note

Running this live on AWS costs a few dollars/day (EKS control plane, EC2 nodes, NAT
gateway, RDS). Run `terraform destroy` when you're done with a demo session.
