---
sidebar_position: 2
title: Resource Adoption
---

# Resource Adoption

Resource adoption allows you to import existing AWS resources into ACK management without recreating them. This is useful when you have pre-existing AWS infrastructure that you want to manage through Kubernetes.

:::info Beta Feature
Resource adoption is a **Beta feature**. It is enabled by default in the ACK runtime. If you encounter issues, verify the feature is enabled in your controller's Helm values:

```bash
helm install ... --set featureGates.ResourceAdoption=true
```
:::

## Adoption Policies

ACK supports two adoption policies through the `services.k8s.aws/adoption-policy` annotation:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="adopt-or-create" label="Adopt-or-Create" default>

The `adopt-or-create` policy adopts the resource if it exists in AWS, or creates it if it doesn't.

**Requirements:**
- Provide a **fully populated spec** with your desired configuration
- Use `services.k8s.aws/adoption-fields` to specify how to find the resource (required for resources identified by IDs like VPCs)

**Behavior:**
- If resource exists: ACK adopts it and updates it to match your spec
- If resource doesn't exist: ACK creates it from your spec
- Your manifest becomes the source of truth

**Example: VPC**

```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: VPC
metadata:
  name: my-vpc
  annotations:
    services.k8s.aws/adoption-policy: "adopt-or-create"
    services.k8s.aws/adoption-fields: |
      {"vpcID": "vpc-0123456789abcdef0"}
spec:
  cidrBlocks:
    - "10.0.0.0/16"
  enableDNSSupport: true
  enableDNSHostnames: true
  tags:
    - key: environment
      value: production
```

If the VPC exists, ACK adopts it and updates it to match your spec. If it doesn't exist, ACK creates it.

</TabItem>
<TabItem value="adopt" label="Adopt (Strict Import)">

The `adopt` policy strictly imports the resource as it exists in AWS. Use this when you want to observe the current configuration before making changes. ACK will **not** update the resource to match your spec during adoption.

**Requirements:**
- Use `services.k8s.aws/adoption-fields` annotation to specify how to find the resource
- We recommend omitting the `spec` entirely on adoption since ACK will overwrite the values on adoption.
- Any fields you do specify in the `spec` will be updated to match the AWS resource after adoption, and a mismatch will not prevent adoption.

**Behavior:**
- ACK finds the resource using `adoption-fields`
- After adoption, ACK populates the spec with the actual AWS configuration

**Example: SQS Queue**

```yaml
apiVersion: sqs.services.k8s.aws/v1alpha1
kind: Queue
metadata:
  name: my-queue
  annotations:
    services.k8s.aws/adoption-policy: "adopt"
    services.k8s.aws/adoption-fields: |
      {"queueURL": "https://sqs.us-west-2.amazonaws.com/123456789012/my-queue"}
```

After adoption, the spec is populated with the actual queue configuration from AWS (visibilityTimeout, messageRetentionPeriod, etc.).

</TabItem>
</Tabs>

## Adoption Fields

The `services.k8s.aws/adoption-fields` annotation specifies which fields ACK should use to look up the resource in AWS. The required fields vary by resource type:

| Resource Type | Adoption Field | Example |
|--------------|----------------|---------|
| EKS Cluster | `name` | `{"name": "my-cluster"}` |
| SQS Queue | `queueURL` | `{"queueURL": "https://sqs.us-west-2.amazonaws.com/123456789012/my-queue"}` |
| VPC | `vpcID` | `{"vpcID": "vpc-123456789012"}` |
| SNS Topic | `arn` | `{"arn": "arn:aws:sns:us-west-2:123456789012:my-topic"}` |
| S3 Bucket | `name` | `{"name": "my-bucket-name"}` |
| DynamoDB Table | `tableName` | `{"tableName": "my-table"}` |

Refer to the [API Reference](/services) for the specific fields required for each resource type.

## Choosing a Policy

Use **adopt-or-create** when:
- You want a declarative workflow (resource may or may not exist)
- You want your manifest to be the source of truth
- You're okay with ACK updating the resource to match your spec

Use **adopt** when:
- You want to import the resource exactly as it exists in AWS
- You don't want to risk changing the resource during adoption
- You want to inspect the current configuration before making changes

## Verifying Adoption

After applying a resource with adoption annotations, check if it's ready:

```bash
kubectl get cluster my-cluster

NAME         READY
my-cluster   True
```

When `READY` is `True`, the resource has been successfully adopted.

For more details:

```bash
kubectl get cluster my-cluster -o yaml
```

Successful adoption indicators:
- Resource shows `READY: True`
- `status.ackResourceMetadata.arn` contains the AWS resource ARN
- For `adopt` policy: `spec` is now populated with current AWS configuration from AWS

## After Adoption

Once a resource is adopted:
- The adoption annotations are no longer needed (you can remove them)
- ACK manages the resource like any other ACK resource
- Changes to the spec will be applied to AWS
- Deleting the Kubernetes resource will delete the AWS resource (unless using `deletionPolicy: Retain`)

## Next Steps

- [Configure deletion policies](/guides/deletion-policy) - Control what happens when you delete adopted resources
- [Use read-only mode](/guides/readonly) - Observe resources without managing them
- [Set up advanced IAM roles](/guides/cross-account) - Adopt resources in different AWS accounts
