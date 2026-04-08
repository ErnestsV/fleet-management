# GKE Deployment Notes

This repository now includes a first production deployment layout for Google Kubernetes Engine while keeping the existing `docker-compose.yml` for local development.

## Images

- `docker/php/Dockerfile.prod`: Laravel PHP-FPM application image
- `docker/nginx/Dockerfile.backend`: Nginx sidecar image for the Laravel HTTP entrypoint
- `docker/frontend/Dockerfile.prod`: frontend build plus static Nginx serving

## Kubernetes layout

- `k8s/base`: reusable manifests
- `k8s/overlays/production`: production-specific image and hostname overrides

Base resources currently include:

- namespace
- backend config map
- backend deployment and service
- queue deployment
- scheduler cron job
- frontend deployment and service
- mailpit deployment and service
- ingress

Additional committed templates:

- `k8s/base/backend-secret.example.yaml`
- `k8s/base/backend-migrate-job.yaml`

## Current assumptions

- frontend is served from the same load balancer IP as the API and calls `/api/v1`
- backend uses Laravel's `/up` health route for container probes
- queue and scheduler use the same backend app image
- backend, queue, scheduler, and migrations connect to Cloud SQL through a Cloud SQL Auth Proxy sidecar
- Redis points to a Memorystore private IP address in the same VPC/region path
- mail is captured by an in-cluster Mailpit instance for testing instead of being delivered externally
- session cookies stay non-secure until you later add HTTPS with a real domain
- secrets are created outside Git and only an example manifest is committed
- the initial deployment is expected to run without a custom domain

## Before first deployment

1. Cloud SQL for PostgreSQL is created as `fleetos-postgres` with connection name `fleetos-492609:europe-north1:fleetos-postgres`.
2. Memorystore for Redis is created as `fleetos-redis` with endpoint `10.57.1.3:6379`.
3. Replace the remaining `LOAD_BALANCER_IP` placeholders in `k8s/overlays/production/kustomization.yaml` and `k8s/base/backend-configmap.yaml` after the ingress receives an external IP.
4. Create a real `backend-secrets` manifest or provision those values through your preferred secret manager workflow.
5. Create or reuse a Google service account with `roles/cloudsql.client`, bind it to the Kubernetes service account `fleet-backend`, and update `k8s/base/backend-serviceaccount.yaml`.
6. Keep the GKE cluster and Memorystore instance in the same authorized network. Google’s Memorystore docs note that GKE clients must use the same authorized network, and private services access mode requires a VPC-native/IP-alias cluster.
7. Set GitHub repository variables:
   - `GCP_PROJECT_ID`
   - `GCP_REGION`
   - `GKE_CLUSTER`
   - `GKE_LOCATION`
   - `ARTIFACT_REGISTRY_REPOSITORY`
8. Set GitHub repository secrets:
   - `GCP_WORKLOAD_IDENTITY_PROVIDER`
   - `GCP_SERVICE_ACCOUNT_EMAIL`
   - application secrets such as `APP_KEY`, database credentials, and `OPENAI_API_KEY`

## Mailpit access

- Mailpit SMTP is available inside the cluster at service `mailpit:1025`.
- Mailpit UI is available inside the cluster at service `mailpit:8025`.
- For now, the Mailpit UI is not exposed publicly through the ingress.
- To inspect captured emails, use a temporary port-forward such as:

```bash
kubectl port-forward --namespace fleet-management svc/mailpit 8025:8025
```

- Then open `http://127.0.0.1:8025`.

## Remaining production decisions

- durable file storage strategy for Laravel uploads and `public/storage`
- whether to stay on IP-only access or add a domain/TLS later
- autoscaling and final resource sizing
- whether deployments should auto-run on `main` push or remain manual
