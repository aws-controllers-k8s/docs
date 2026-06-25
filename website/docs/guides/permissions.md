---
title: Permissions Overview
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Permissions Overview

ACK service controllers require two different authorization systems: [Kubernetes RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) and [AWS IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/access.html). Kubernetes RBAC governs access to Kubernetes resources, while AWS IAM policies control access to AWS resources. These systems operate independently - the Kubernetes user making `kubectl` calls has no association with the IAM role. Instead, the IAM role is attached to the [service account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) running the controller pod.

When you install ACK controllers using Helm, Kubernetes RBAC permissions are configured automatically. AWS IAM permissions must be set up separately by creating an IAM role during authentication setup (PodIdentity or IRSA).

The following diagram illustrates how these two authorization systems work together in ACK:

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <img
    src="/docs/img/authorization.svg"
    alt="Authorization in ACK"
    style={{maxWidth: '500px', width: '100%', cursor: 'zoom-in', border: '1px solid #e2e8f0', borderRadius: '8px', transition: 'transform 0.2s', background: '#f8fafc', padding: '1rem'}}
    onClick={(e) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:zoom-out;opacity:0;transition:opacity 0.3s';
      const img = document.createElement('img');
      img.src = e.target.src;
      img.style.cssText = 'max-width:75%;max-height:75%;object-fit:contain;transform:scale(0.8);transition:transform 0.3s;background:#f8fafc;padding:1rem;border-radius:8px';
      overlay.appendChild(img);
      document.body.appendChild(overlay);
      setTimeout(() => { overlay.style.opacity = '1'; img.style.transform = 'scale(1)'; }, 10);
      overlay.onclick = () => {
        overlay.style.opacity = '0';
        img.style.transform = 'scale(0.8)';
        setTimeout(() => overlay.remove(), 300);
      };
    }}
  />
  <p style={{fontSize: '0.85rem', color: '#718096', marginTop: '0.5rem', fontStyle: 'italic'}}>Click to zoom</p>
</div>

## Kubernetes RBAC

ACK Helm charts configure two types of RBAC permissions:

1. **Controller permissions** - What the controller pod needs to manage AWS resources
2. **User permissions** - Roles you can bind to users who interact with ACK custom resources

### Controller permissions

ACK service controllers can run in either **Cluster Mode** or **Namespace Mode**, controlled by the `installScope` Helm value.

#### Cluster Mode (default)

With `installScope: cluster` (the default), the controller watches for ACK custom resources (CRs) across *all* Kubernetes `Namespaces`.

The Helm chart creates a `ClusterRole` with permissions to:

- Create, update/patch, delete, read, list and watch ACK custom resources in all namespaces
- Read, list and watch `Namespace` objects (for cross-account resource management)
- Read `ConfigMap` resources in the `ack-system` namespace (configurable via `ACK_SYSTEM_NAMESPACE` environment variable)

#### Namespace Mode

With `installScope: namespace`, the controller only watches for CRs in specific namespaces. Use the `watchNamespace` Helm value to specify which namespaces (comma-separated list). If not set, it defaults to the release namespace.

```yaml
# values.yaml
installScope: namespace
watchNamespace: "app-team-1,app-team-2"
```

The Helm chart creates a `Role` (not ClusterRole) with permissions scoped to the watched namespaces only. The controller's `Service Account` gets a `RoleBinding` in each watched namespace.

#### Secret and ConfigMap access

ACK controllers need access to `Secret` and `ConfigMap` resources for two features:

1. **Secret references**: Some ACK custom resources reference Kubernetes `Secret` keys for sensitive values like database passwords or API keys. The controller reads these Secrets to pass the values to AWS APIs.

2. **FieldExport**: The `FieldExport` resource lets you export values from ACK resource status fields into `Secret` or `ConfigMap` objects. This requires patch permissions to write the exported values.

By default, ACK Helm charts include the following permissions in the controller's ClusterRole:

```yaml
- apiGroups:
  - ""
  resources:
  - configmaps
  - secrets
  verbs:
  - get
  - list
  - patch
  - watch
```

These permissions apply cluster-wide when using the default `installScope: cluster` setting. If you install with `installScope: namespace`, the same permissions are scoped to the watched namespace(s) via a Role instead of ClusterRole.

### User permissions

ACK Helm charts create `Role` resources that you can bind to Kubernetes users or groups. These roles grant permissions to interact with the ACK custom resources (CRs) managed by that controller.

Each controller's Helm chart creates two roles in the release namespace:

* `ack-$SERVICE-writer`: Grants full access (create, delete, get, list, patch, update, watch) to the service's CRs
* `ack-$SERVICE-reader`: Grants read-only access (get, list, watch) to the service's CRs

For example, the S3 controller Helm chart creates:

<Tabs>
  <TabItem value="reader" label="ack-s3-reader" default>

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ack-s3-reader
  namespace: {{ .Release.Namespace }}
rules:
- apiGroups:
  - s3.services.k8s.aws
  resources:
  - buckets
  verbs:
  - get
  - list
  - watch
```

  </TabItem>
  <TabItem value="writer" label="ack-s3-writer">

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ack-s3-writer
  namespace: {{ .Release.Namespace }}
rules:
- apiGroups:
  - s3.services.k8s.aws
  resources:
  - buckets
  verbs:
  - create
  - delete
  - get
  - list
  - patch
  - update
  - watch
```

  </TabItem>
</Tabs>

#### Binding users to roles

Once the Kubernetes `Role` resources have been created, you can assign a specific Kubernetes `User` to a particular `Role` with the `kubectl create rolebinding` command.

```bash
kubectl create rolebinding alice-ack-s3-writer --role ack-s3-writer --namespace testing --user alice
kubectl create rolebinding alice-ack-sns-reader --role ack-sns-reader --namespace production --user alice
```

You can check the permissions of a particular Kubernetes `User` with the `kubectl auth can-i` command.
```bash
kubectl auth can-i create buckets --namespace default
```

## AWS IAM permissions

The IAM role needs the correct [IAM policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/access.html) for a given ACK service controller. For example, the ACK service controller for AWS S3 needs read and write permission for S3 Buckets.

:::warning Administrator responsibility
It is the administrator's responsibility to scope down IAM permissions to what the controller actually needs. You should restrict permissions based on your security requirements, such as limiting to specific resources, regions, or actions. On shared, multi-tenant clusters this is especially important. See [Granular IAM Roles](/guides/cross-account) for isolating teams and namespaces with per-role permissions.
:::

Each ACK service controller publishes a policy intended for **quick setup**, located in the `recommended-policy-arn` file in the `config/iam/` folder within that service's public repository. This file contains the AWS Resource Name (ARN) of an AWS managed policy for the service. For example, the [quick-setup policy ARN for AWS S3](https://github.com/aws-controllers-k8s/s3-controller/tree/main/config/iam) is `arn:aws:iam::aws:policy/AmazonS3FullAccess`. These managed policies grant full access to the service to get you running fast; for production you should replace them with least-privilege policies scoped to your needs.

Some services may need an additional inline policy. For example, the service controller may require `iam:PassRole` permission in order to pass an execution role that will be assumed by the AWS service. If applicable, resources for additional recommended policies will be located in the `recommended-inline-policy` file within the `config/iam` folder of a given ACK service controller's public repository. This inline policy is applied along with the managed policies when creating the role.

See the [Configure IAM Permissions guide](/guides/configure-iam) for instructions on creating an IAM role for your ACK service controller.
