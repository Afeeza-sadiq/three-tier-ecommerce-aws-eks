# Deployment Guide

Follow these steps in order. Estimated first-time setup: 60–90 minutes.
Estimated AWS cost while running: a few dollars/day (EKS control plane $0.10/hr +
2x t3.medium nodes + NAT gateway + db.t3.micro RDS). **Tear down with `terraform destroy`
when you're done demoing it** so you don't get billed indefinitely.

## Prerequisites
- AWS account + IAM user with admin (or scoped EKS/EC2/RDS/IAM/ECR) permissions
- AWS CLI v2, configured (`aws configure`)
- Terraform >= 1.5
- kubectl
- Helm 3
- Docker
- An AWS account ID (`aws sts get-caller-identity`)

## 1. Provision infrastructure with Terraform

```bash
cd terraform
terraform init
export TF_VAR_db_password='choose-a-strong-password'
terraform plan -out plan.tfplan
terraform apply plan.tfplan
```

This creates: VPC (public/private/db subnets across 2 AZs), NAT gateway, EKS cluster +
managed node group, IAM roles (cluster, nodes, ALB controller via IRSA), ECR repos for
both images, RDS MySQL instance, and CloudWatch log groups/alarms.

Grab the outputs:
```bash
terraform output configure_kubectl   # run this command to point kubectl at the new cluster
terraform output rds_endpoint
terraform output ecr_frontend_url
terraform output ecr_backend_url
```

## 2. Point kubectl at the cluster

```bash
aws eks update-kubeconfig --region ap-south-1 --name ecommerce-eks
kubectl get nodes   # should show 2 nodes Ready
```

## 3. Install the AWS Load Balancer Controller (creates the ALB from our Ingress)

```bash
helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=ecommerce-eks \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=ap-south-1 \
  --set vpcId=$(terraform -chdir=terraform output -raw vpc_id)
```

## 4. Load the database schema

```bash
mysql -h $(terraform -chdir=terraform output -raw rds_endpoint | cut -d: -f1) \
      -u admin -p ecommerce < app/db/schema.sql
```
(Run this from a machine that can reach the private RDS instance — e.g. a bastion host,
Cloud9 in the VPC, or a temporary `kubectl run` MySQL client pod.)

## 5. Build and push the container images

```bash
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com

docker build -f docker/backend/Dockerfile  -t <ecr_backend_url>:v1  .
docker build -f docker/frontend/Dockerfile -t <ecr_frontend_url>:v1 \
  --build-arg REACT_APP_API_URL=/api .

docker push <ecr_backend_url>:v1
docker push <ecr_frontend_url>:v1
```

## 6. Deploy to Kubernetes

Edit the k8s manifests first:
- `k8s/01-configmap.yaml` → set `DB_HOST` to the RDS endpoint
- `k8s/02-secret.yaml` → set real DB credentials (or generate via `kubectl create secret`, see comments in the file)
- `k8s/10-backend-deployment.yaml` / `11-frontend-deployment.yaml` → set the real ECR image URLs

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secret.yaml
kubectl apply -f k8s/10-backend-deployment.yaml
kubectl apply -f k8s/11-frontend-deployment.yaml
kubectl apply -f k8s/12-hpa.yaml
kubectl apply -f k8s/13-ingress.yaml

kubectl get ingress -n ecommerce   # wait for ADDRESS to populate — that's your ALB DNS name
```

Open the ALB DNS name in a browser — you should see the storefront with products loaded
from RDS via the backend API.

## 7. Set up CI/CD (Jenkins) and GitOps (Argo CD)

1. Push this repo to GitHub.
2. Create a **separate** `ecommerce-gitops` repo containing just the `k8s/` folder — this
   is what Argo CD watches, decoupled from application source (standard GitOps pattern).
3. In Jenkins: create a Pipeline job pointing at this repo's `ci-cd/Jenkinsfile`, and add
   credentials for AWS account ID + ECR/git push access.
4. Install Argo CD in-cluster:
   ```bash
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   kubectl apply -f ci-cd/argocd-app.yaml
   ```
5. From here, every merge to `main` → Jenkins builds/scans/pushes images → updates the
   GitOps repo → Argo CD auto-syncs the cluster (rolling update, zero downtime).

## 8. Monitoring

CloudWatch Container Insights and the log groups/alarms are already provisioned by
Terraform. To pull pod-level metrics/logs into CloudWatch, install the CloudWatch agent
+ Fluent Bit add-on:
```bash
aws eks create-addon --cluster-name ecommerce-eks --addon-name amazon-cloudwatch-observability
```

## 9. Tear down

```bash
kubectl delete -f k8s/
helm uninstall aws-load-balancer-controller -n kube-system
cd terraform && terraform destroy
```
