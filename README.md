<div align="center">

# 🛒 Production-Ready Three-Tier E-Commerce Platform on AWS EKS

**Infrastructure as Code · Container Orchestration · GitOps CI/CD · Cloud-Native Monitoring**

![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white)
![ArgoCD](https://img.shields.io/badge/Argo_CD-EF7B4D?style=for-the-badge&logo=argo&logoColor=white)

</div>

---

## Overview

A demo e-commerce platform built to show a complete, production-style DevOps workflow
end to end — from infrastructure provisioning to a live, auto-scaling application with
automated deployments.

**Stack:** AWS · Terraform · Kubernetes (EKS) · Docker · Jenkins · Argo CD · Amazon ECR · RDS · ALB · CloudWatch

## Architecture

```mermaid
flowchart TB
    Internet((Internet)) --> ALB[Application Load Balancer]

    ALB -->|/| FE[Frontend Service<br/>React + nginx<br/>2 pods, HPA 2-6]
    ALB -->|/api/*| BE[Backend Service<br/>Node/Express API<br/>2 pods, HPA 2-6]

    FE -.->|calls| BE
    BE --> RDS[(Amazon RDS<br/>MySQL<br/>Private DB subnet)]

    subgraph VPC["VPC — ap-south-1"]
        subgraph Public["Public Subnets"]
            ALB
            NAT[NAT Gateway]
        end
        subgraph Private["Private Subnets — EKS Nodes"]
            FE
            BE
        end
        subgraph DBSubnet["Isolated DB Subnets"]
            RDS
        end
    end

    style ALB fill:#FF9900,color:#000
    style RDS fill:#527FFF,color:#fff
    style FE fill:#61DAFB,color:#000
    style BE fill:#68A063,color:#fff
```

**CI/CD pipeline:**

```mermaid
flowchart LR
    A[git push] --> B[Jenkins:<br/>build + test]
    B --> C[Trivy<br/>security scan]
    C --> D[Push image<br/>to ECR]
    D --> E[Update GitOps<br/>repo]
    E --> F[Argo CD<br/>auto-sync]
    F --> G[Rolling update<br/>on EKS]

    style B fill:#D24939,color:#fff
    style F fill:#EF7B4D,color:#fff
```

**Observability:** CloudWatch log groups, Container Insights, CPU utilization alarms.

## Repo layout

| Path | Contents |
|---|---|
| `terraform/` | VPC, EKS cluster + node group, IAM (incl. IRSA for the ALB controller), RDS MySQL, ECR repos, CloudWatch log groups/alarms |
| `app/frontend/` | React storefront — product listing, place order |
| `app/backend/` | Node/Express REST API — products, orders, MySQL connection pool |
| `app/db/` | `schema.sql` — tables + seed data |
| `docker/` | Multi-stage Dockerfiles for both services |
| `k8s/` | Namespace, ConfigMap, Secret template, Deployments, Services, HPA, ALB Ingress (path-based routing) |
| `ci-cd/` | Jenkinsfile (build → scan → push → update GitOps) + Argo CD `Application` manifest |
| `docs/` | `DEPLOYMENT.md` — full step-by-step setup guide |

## What this demonstrates

- 🏗️ **Infrastructure as Code** — entire AWS footprint (20+ resources: VPC, subnets, NAT, EKS, IAM/IRSA, ECR, RDS, CloudWatch) is Terraform-managed and reproducible from scratch.
- 📦 **Container orchestration** — Deployments, Services, ConfigMaps/Secrets, HPA, and rolling updates on EKS for zero-downtime releases.
- 🔁 **CI/CD + GitOps** — Jenkins builds and security-scans images (Trivy), pushes to ECR, and updates a GitOps repo that Argo CD continuously syncs to the cluster.
- 📊 **Monitoring** — CloudWatch Container Insights, log groups, and CPU alarms for infrastructure visibility.

## Getting started

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full step-by-step guide —
Terraform apply → kubectl config → ALB controller → build/push images → deploy → wire up
Jenkins/Argo CD.

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

---

<div align="center">
Built by <a href="https://github.com/Afeeza-sadiq">Afeeza Sadiq</a>
</div>
