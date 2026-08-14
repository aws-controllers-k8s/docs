---
title: Helm Chart Values Reference
---

# Helm Chart Values Reference

This page provides a comprehensive reference for all configurable values in ACK service controller Helm charts. These values allow you to customize controller deployment, behavior, and integration with your Kubernetes cluster and AWS environment.

## Image Configuration

### `image.repository`
- **Type**: String
- **Default**: `public.ecr.aws/aws-controllers-k8s/<service>-controller`
- **Description**: Container image repository for the controller

### `image.tag`
- **Type**: String
- **Default**: Chart's `appVersion`
- **Description**: Container image tag to deploy

### `image.pullPolicy`
- **Type**: String
- **Default**: `IfNotPresent`
- **Options**: `Always`, `IfNotPresent`, `Never`
- **Description**: Image pull policy for the controller pod

### `image.pullSecrets`
- **Type**: List
- **Default**: `[]`
- **Description**: Image pull secrets for private registries
- **Example**:
```yaml
image:
  pullSecrets:
    - name: my-registry-secret
```

## Deployment Configuration

### `deployment.annotations`
- **Type**: Map
- **Default**: `{}`
- **Description**: Annotations to add to the controller Deployment

### `deployment.labels`
- **Type**: Map
- **Default**: `{}`
- **Description**: Labels to add to the controller Deployment

### `deployment.containerPort`
- **Type**: Integer
- **Default**: `8080`
- **Description**: Container port for the controller

### `replicas`
- **Type**: Integer
- **Default**: `1`
- **Description**: Number of controller replicas to run

:::warning
Running multiple replicas requires [leader election](/guides/leader-election) to be properly configured to avoid conflicts.
:::

## Pod Scheduling

### `nodeSelector`
- **Type**: Map
- **Default**: `{}`
- **Description**: Node selector for scheduling controller pods
- **Example**:
```yaml
nodeSelector:
  node-type: controller
  topology.kubernetes.io/zone: us-west-2a
```

### `tolerations`
- **Type**: List
- **Default**: `[]`
- **Description**: Tolerations for scheduling controller pods
- **Example**:
```yaml
tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "controllers"
    effect: "NoSchedule"
```

### `affinity`
- **Type**: Map
- **Default**: `{}`
- **Description**: Affinity rules for scheduling controller pods
- **Example**:
```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          topologyKey: kubernetes.io/hostname
```

## Resource Management

### `resources.limits`
- **Type**: Map
- **Default**: `{ cpu: "100m", memory: "300Mi" }`
- **Description**: Resource limits for the controller container

### `resources.requests`
- **Type**: Map
- **Default**: `{ cpu: "100m", memory: "200Mi" }`
- **Description**: Resource requests for the controller container

:::tip
Adjust resource limits based on your cluster size and resource count. Controllers managing many resources may need higher memory limits.
:::

## AWS Configuration

### `aws.region`
- **Type**: String
- **Default**: `""`
- **Description**: AWS region where resources will be created. If not set, uses the region from the pod's IRSA/PodIdentity configuration

### `aws.endpoint_url`
- **Type**: String
- **Default**: `""`
- **Description**: Custom AWS API endpoint URL for testing or using AWS-compatible services

### `aws.account_id`
- **Type**: String
- **Default**: `""`
- **Description**: AWS account ID for the controller. Required when using cross-account resource management

### `aws.credentials.secretName`
- **Type**: String
- **Default**: `""`
- **Description**: Name of Kubernetes Secret containing AWS shared credentials file (not recommended - use IRSA or PodIdentity instead)

### `aws.credentials.secretKey`
- **Type**: String
- **Default**: `"credentials"`
- **Description**: Key within the Secret that contains the credentials file

### `aws.credentials.profile`
- **Type**: String
- **Default**: `"default"`
- **Description**: AWS profile to use from the shared credentials file

## Logging

### `log.level`
- **Type**: String
- **Default**: `"info"`
- **Options**: `debug`, `info`, `warn`, `error`
- **Description**: Controller log verbosity level

### `log.enable_development_logging`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable development mode logging (more verbose, includes stack traces)

## Controller Scope

### `installScope`
- **Type**: String
- **Default**: `"cluster"`
- **Options**: `cluster`, `namespace`
- **Description**: Determines whether the controller watches all namespaces (cluster) or specific namespaces (namespace)

:::info
Setting `installScope: namespace` automatically configures namespace-scoped RBAC. See [Permissions Overview](/guides/permissions) for details.
:::

### `watchNamespace`
- **Type**: String
- **Default**: `""`
- **Description**: Comma-separated list of namespaces to watch. Only used when `installScope: namespace`
- **Example**: `"production,staging,development"`

### `resourceTags`
- **Type**: List
- **Default**: `[]`
- **Description**: Tags to apply to all AWS resources created by this controller
- **Example**:
```yaml
resourceTags:
  - key: team
    value: platform
  - key: managed-by
    value: ack
```

## Resource Behavior

### `deletionPolicy`
- **Type**: String
- **Default**: `"delete"`
- **Options**: `delete`, `retain`
- **Description**: Default deletion policy for resources. Can be overridden per-resource with annotations

:::warning
Setting `deletionPolicy: retain` means AWS resources will NOT be deleted when their Kubernetes custom resources are deleted.
:::

### `reconcile.defaultResyncPeriod`
- **Type**: Integer (seconds)
- **Default**: `36000` (10 hours)
- **Description**: Default resync period in seconds for reconciling resources

### `reconcile.resourceResyncPeriods`
- **Type**: Map
- **Default**: `{}`
- **Description**: Per-resource-type resync periods
- **Example**:
```yaml
reconcile:
  resourceResyncPeriods:
    buckets: "5h"
    dbinstances: "15m"
```

## Service Account

### `serviceAccount.annotations`
- **Type**: Map
- **Default**: `{}`
- **Description**: Annotations to add to the controller's ServiceAccount (used for IRSA or PodIdentity)
- **Example**:
```yaml
serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/ack-s3-controller
```

### `serviceAccount.name`
- **Type**: String
- **Default**: Automatically generated based on chart name
- **Description**: Name of the ServiceAccount to use or create

### `serviceAccount.create`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Whether to create a ServiceAccount

## Metrics Service

### `metrics.service.create`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Create a Service for Prometheus metrics

### `metrics.service.type`
- **Type**: String
- **Default**: `"ClusterIP"`
- **Options**: `ClusterIP`, `NodePort`, `LoadBalancer`
- **Description**: Kubernetes Service type for metrics

### `metrics.service.port`
- **Type**: Integer
- **Default**: `8080`
- **Description**: Port for the metrics Service

### `metrics.service.annotations`
- **Type**: Map
- **Default**: `{}`
- **Description**: Annotations for the metrics Service (useful for Prometheus auto-discovery)

## High Availability

### `leaderElection.enabled`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable leader election for running multiple controller replicas

### `leaderElection.namespace`
- **Type**: String
- **Default**: `""`
- **Description**: Namespace for leader election ConfigMap/Lease

## Cross-Account Resource Management

For cross-account resource management, use the **IAMRoleSelector** feature gate (recommended) or CARM feature gates. See [Granular IAM Roles](/guides/cross-account) for setup instructions.

## Cross-Namespace References

### `enableCrossNamespace`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable cross-namespace behavior including resource references (`*Ref` fields), secret references (`SecretKeyReference`), and `FieldExport` targets. When `false`, the controller blocks any reference resolution or field export that crosses namespace boundaries. Maps to the `--enable-cross-namespace` controller flag.

:::warning
The default for `enableCrossNamespace` will change from `true` to `false` in a future release. If you rely on cross-namespace references, explicitly set `enableCrossNamespace: true` before upgrading. See [Breaking Changes](/breaking-changes) for details.
:::

## Feature Gates

Feature gates allow you to enable experimental or optional controller features.

### `featureGates.ServiceLevelCARM`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable service-level cross-account resource management

### `featureGates.TeamLevelCARM`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable team-level cross-account resource management

### `featureGates.ReadOnlyResources`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable read-only resource support (view-only AWS resources)

### `featureGates.ResourceAdoption`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable adoption of existing AWS resources

### `featureGates.IAMRoleSelector`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable IAMRoleSelector for per-resource IAM role selection

## Example Configuration

Here's a complete example showing common production settings:

```yaml
# values.yaml
replicas: 2

resources:
  limits:
    cpu: "200m"
    memory: "512Mi"
  requests:
    cpu: "100m"
    memory: "256Mi"

aws:
  region: us-west-2

serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/ack-s3-controller

installScope: cluster

resourceTags:
  - key: managed-by
    value: ack
  - key: environment
    value: production

leaderElection:
  enabled: true

log:
  level: info

metrics:
  service:
    annotations:
      prometheus.io/scrape: "true"
      prometheus.io/port: "8080"

nodeSelector:
  node-type: controllers

tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "controllers"
    effect: "NoSchedule"

featureGates:
  IAMRoleSelector: true
  ResourceAdoption: true
```

## Installing with Custom Values

To install a controller with custom values:

```bash
helm install ack-s3-controller \
  oci://public.ecr.aws/aws-controllers-k8s/s3-chart \
  --namespace ack-system --create-namespace \
  --values values.yaml
```

Or specify values directly:

```bash
helm install ack-s3-controller \
  oci://public.ecr.aws/aws-controllers-k8s/s3-chart \
  --namespace ack-system --create-namespace \
  --set aws.region=us-west-2 \
  --set installScope=cluster \
  --set log.level=debug
```
