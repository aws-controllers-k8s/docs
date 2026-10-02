---
sidebar_position: 3
title: Core Concepts
---

# Core Concepts

Understanding these ACK-specific concepts will help you effectively manage AWS infrastructure from Kubernetes.

## Custom Resource Definitions (CRDs)

ACK provides a **one-to-one mapping** between AWS resources and Kubernetes Custom Resource Definitions (CRDs). Each AWS resource type (like an S3 Bucket, DynamoDB Table, or RDS Database) has a corresponding CRD, and the CRD's fields map directly to the AWS resource's attributes.

When you install an ACK controller, it automatically registers CRDs for that service's resources:

```bash
# List all CRDs for DynamoDB
kubectl get crds | grep dynamodb

# Output:
# tables.dynamodb.services.k8s.aws
# backups.dynamodb.services.k8s.aws
# globaltables.dynamodb.services.k8s.aws
```

Each CRD follows this structure:

- **API Version**: `<service>.services.k8s.aws/<version>`
- **Kind**: The AWS resource type (e.g., `Bucket`, `Table`, `DBInstance`)
- **Spec**: Your desired state - maps closely to AWS API parameters
- **Status**: Current state from AWS, read-only and updated by the controller

Because each CRD represents a complete AWS resource, **all attributes live in one place**. An S3 `Bucket` CRD includes versioning, encryption, and lifecycle rules together - not as separate CRDs. An IAM `Role` includes policy attachments directly in its spec - there's no separate "RoleAttachment" resource.

The following examples show this in practice:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="iam" label="IAM Role" default>

```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: my-app-role
spec:
  name: my-application-role
  description: Role for my application
  # Policy attachments - directly in the Role spec
  # No separate "RoleAttachment" resource needed
  policies:
    - arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
    - arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess
status:
  ackResourceMetadata:
    arn: arn:aws:iam::123456789012:role/my-application-role
  roleID: AROA1234567890EXAMPLE
```

  </TabItem>
  <TabItem value="s3" label="S3 Bucket">

```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: my-bucket
spec:
  name: my-application-bucket
  # All bucket features in one CRD
  versioning:
    status: Enabled
  encryption:
    rules:
      - applyServerSideEncryptionByDefault:
          sseAlgorithm: AES256
  publicAccessBlock:
    blockPublicACLs: true
    blockPublicPolicy: true
status:
  ackResourceMetadata:
    arn: arn:aws:s3:::my-application-bucket
```

  </TabItem>
  <TabItem value="dynamodb" label="DynamoDB Table">

```yaml
apiVersion: dynamodb.services.k8s.aws/v1alpha1
kind: Table
metadata:
  name: my-table
spec:
  tableName: my-dynamodb-table
  billingMode: PAY_PER_REQUEST
  attributeDefinitions:
    - attributeName: id
      attributeType: S
  keySchema:
    - attributeName: id
      keyType: HASH
  # Global Tables v2 - replicas in same CRD
  tableReplicas:
    - regionName: eu-west-1
    - regionName: ap-southeast-1
status:
  tableStatus: ACTIVE
  ackResourceMetadata:
    arn: arn:aws:dynamodb:us-west-2:123456789012:table/my-dynamodb-table
```

  </TabItem>
</Tabs>

## Controller Architecture

ACK uses a **controller-per-service** model. Each AWS service (S3, DynamoDB, RDS, etc.) has its own dedicated controller that manages all resource types for that service.

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <img
    src="/docs/img/controller-architecture.svg"
    alt="Controller Architecture"
    style={{maxWidth: '792px', width: '100%', cursor: 'zoom-in', border: '1px solid #e2e8f0', borderRadius: '8px', transition: 'transform 0.2s', background: '#f8fafc', padding: '1rem'}}
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

This architecture means you only install controllers for the services you actually use. If your application needs S3 and DynamoDB, you install just those two controllers. Each controller can be updated independently and scales based on its own workload. This design also improves security: each controller only communicates with a single AWS API endpoint and receives only the IAM permissions it needs - an S3 controller never makes DynamoDB calls and vice versa.

When you install a controller via Helm, it creates a Deployment (the controller process), the CRDs for that service, a ServiceAccount for IAM authentication, and the necessary RBAC permissions.

## Reconciliation Loop

The **reconciliation loop** is the heart of how ACK works. It continuously ensures your desired state matches actual state.

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <img
    src="/docs/img/reconciliation-loop.svg"
    alt="Reconciliation Loop"
    style={{maxWidth: '792px', width: '100%', cursor: 'zoom-in', border: '1px solid #e2e8f0', borderRadius: '8px', transition: 'transform 0.2s', background: '#f8fafc', padding: '1rem'}}
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

The reconciliation loop triggers when:
- You create, update, or delete a resource in Kubernetes
- The periodic sync interval expires (default: 10 hours, configurable per controller)
- Controller restarts

## Drift Detection

ACK automatically detects **drift** - when someone modifies an AWS resource outside of Kubernetes (via the AWS Console, CLI, or CloudFormation). During the next reconciliation cycle, ACK brings the resource back to the desired state defined in Kubernetes.

**Example**:
```yaml
# Your Kubernetes manifest defines desired state
spec:
  tableName: my-table
  billingMode: PAY_PER_REQUEST
```

If someone changes the billing mode to `PROVISIONED` in the AWS Console, ACK will detect the drift and revert it back to `PAY_PER_REQUEST` during the next reconciliation. This ensures Kubernetes remains the source of truth for your infrastructure.

## Status and Conditions

Every ACK resource has a **Status** field that reflects the current state of the AWS resource as reported by AWS APIs. This is read-only and continuously updated by the controller.

```yaml
status:
  # AWS-specific state fields
  tableStatus: ACTIVE
  itemCount: 42
  tableSizeBytes: 12345
  creationDateTime: "2024-01-15T10:00:00Z"

  # Standard ACK metadata
  ackResourceMetadata:
    arn: arn:aws:dynamodb:us-west-2:123456789012:table/my-table
    ownerAccountID: "123456789012"
    region: us-west-2

  # Kubernetes conditions
  conditions:
    - type: Ready
      status: "True"
      lastTransitionTime: "2024-01-15T10:30:00Z"
      reason: ResourceSynced
      message: Resource synced successfully
```

### ACK Resource Metadata

Every ACK resource includes `status.ackResourceMetadata` with three fields that the controller populates after creating or adopting the AWS resource:

- **arn**: The Amazon Resource Name, useful for referencing the resource in IAM policies or other AWS services
- **ownerAccountID**: The AWS account that owns the resource
- **region**: The AWS region where the resource exists

### Conditions

ACK uses standard Kubernetes conditions to communicate resource state. All ACK resources expose these conditions in their `Status.Conditions` field:

| Condition | Meaning |
|-----------|---------|
| `Ready` | Top-level condition and ACK's API contract. When `Ready` is `True`, all other conditions are in a healthy state and the resource is ready to use |
| `ACK.ResourceSynced` | Resource in backend AWS service is in sync with the controller |
| `ACK.Adopted` | Resource has been successfully adopted from an existing AWS resource |
| `ACK.Terminal` | Unrecoverable error - spec must be updated before sync can continue (e.g., invalid arguments, create-failed state) |
| `ACK.Recoverable` | Recoverable error that may resolve without updating spec (e.g., transient ServiceUnavailable, AccessDeniedException) |
| `ACK.Advisory` | Advisory information about the resource (e.g., attempting to modify an immutable field) |
| `ACK.LateInitialized` | Indicates whether late initialization of fields is complete or in progress |
| `ACK.ReferencesResolved` | Indicates whether all AWSResourceReference fields have been resolved |
| `ACK.IAMRoleSelected` | Indicates whether an IAMRoleSelector has been selected to manage this resource |

You can check conditions to understand resource health:

```bash
# Check if resource is ready
kubectl get table my-table -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'

# Check for terminal errors
kubectl get table my-table -o jsonpath='{.status.conditions[?(@.type=="ACK.Terminal")]}'
```

## Authentication Model

ACK requires two independent authorization systems:

1. **Kubernetes RBAC** - Controls which Kubernetes users can read/write ACK custom resources
2. **AWS IAM** - Controls which AWS APIs the controller can call

These systems are independent - the Kubernetes user making `kubectl` calls has no association with the IAM role used by the controller. Instead, the IAM role is attached to the controller's ServiceAccount via IRSA (IAM Roles for Service Accounts) or PodIdentity.

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <img
    src="/docs/img/authentication-model.svg"
    alt="Authentication Model"
    style={{maxWidth: '792px', width: '100%', cursor: 'zoom-in', border: '1px solid #e2e8f0', borderRadius: '8px', transition: 'transform 0.2s', background: '#f8fafc', padding: '1rem'}}
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

This separation allows you to:
- Give developers access to manage specific ACK resources in Kubernetes
- Limit AWS permissions to only what the controller needs
- Maintain audit trails in both Kubernetes and CloudTrail

See the [Permissions Overview](/guides/permissions) for the complete authorization model and [Configure IAM Permissions guide](/guides/configure-iam) for setup instructions.

## Spec Fields vs Annotations

ACK distinguishes between **spec fields** and **annotations**, each serving a different purpose:

- **Spec fields** declare the desired state of your AWS resource - what the resource should be
- **Annotations** modify how ACK behaves when managing that resource - tweaking default operational behavior

**Spec fields** map directly to AWS API parameters:

```yaml
spec:
  tableName: my-table
  billingMode: PAY_PER_REQUEST  # Declares what the resource should be
```

**Annotations** change controller behavior without affecting the AWS resource:

```yaml
metadata:
  annotations:
    services.k8s.aws/region: eu-west-1  # Use different region
    services.k8s.aws/deletion-policy: retain  # Keep AWS resource on delete
```

Annotations can tweak behavior like using a different region, enabling `Force=true` during deletion API calls, adopting existing resources instead of creating new ones, or managing resources across AWS accounts. They can be set on individual resources or at the namespace level for inheritance.

See the [Managing Resources](/guides/create-resource) guides for detailed usage.

## Field References

Many ACK resources need to reference other resources or sensitive data. Instead of hardcoding values like ARNs or passwords, ACK CRDs provide special reference fields that let you point to other ACK resources or Kubernetes Secrets. This enables you to build resource dependencies while keeping sensitive data secure.

<Tabs>
  <TabItem value="resource" label="Resource Reference" default>

```yaml
# Reference another ACK resource
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: Subnet
metadata:
  name: my-subnet
spec:
  vpcRef:
    from:
      name: my-vpc    # Reference a VPC resource
```

  </TabItem>
  <TabItem value="secret" label="Secret Reference">

```yaml
# Reference a Secret for sensitive data
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: my-database
spec:
  dbInstanceIdentifier: my-db
  masterUsername: admin
  masterUserPassword:
    name: db-credentials    # Reference a Secret
    key: password           # Key within the Secret
```

  </TabItem>
</Tabs>

The controller resolves these references at reconciliation time. See the [API Reference](/services) for available reference fields on each CRD.

:::warning
Resource and Secret references can point to a different namespace by setting a `namespace` field on the reference. This cross-namespace behavior is disabled by default; set the `enableCrossNamespace` Helm value (`--enable-cross-namespace` flag) to `true` to allow it. See [Breaking Changes](/breaking-changes) and the [Helm value reference](/guides/helm-values#cross-namespace-references) for details.
:::

For complex resource orchestration and dependencies, we recommend using [kro (Kube Resource Orchestrator)](https://kro.run).

## Release Phases

ACK service controllers go through release phases that indicate their maturity and support level. Each controller is versioned independently using [Semantic Versioning](https://semver.org/) (X.Y.Z).

### Preview

Controllers in **Preview** are under active development.

- May experience behavioral changes between releases, but the API remains stable
- Major version is `0.x.x` (e.g., `0.1.0`, `0.2.5`)
- Bug reports are welcome via GitHub Issues

### General Availability (GA)

Controllers in **GA** have been tested extensively and are **recommended for production use**.

- Major version is `1.x.x` or higher (e.g., `1.0.0`, `2.1.3`)
- Breaking changes only occur in major version increments
- Bug reports are prioritized by the maintainer team

### Deprecated

Controllers may be **Deprecated** when they are scheduled for retirement.

- Deprecation notices are published in documentation and release notes
- Continue to receive same support level as GA during the deprecation period
- Users should plan to migrate to alternatives before support ends

:::tip
Check the [Service Catalog](/services) to see each controller's current release phase.
:::

## Next Steps

Now that you understand ACK's core concepts, continue with:

- [Installation](/getting-started-helm) - Install your first controller
- [Managing Resources](/guides/create-resource) - Learn common resource management patterns
- [Authentication & Permissions](/guides/permissions) - Set up IAM roles and RBAC
- [Service Catalog](/services) - Browse available AWS service controllers

