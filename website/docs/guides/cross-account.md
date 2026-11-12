---
sidebar_position: 5
title: Granular IAM Roles
---

# Granular IAM Roles

ACK supports using multiple IAM roles with fine-grained control over which role is used for different resources or namespaces. This enables scenarios like managing resources across multiple AWS accounts or using different permission sets within the same account.

## Choose Your Method

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="iamroleselector" label="IAM Role Selector (Recommended)" default>

The **IAM Role Selector** uses a cluster-scoped CRD to dynamically map IAM roles to namespaces and resources using Kubernetes label selectors. This is the recommended method for multi-role and cross-account resource management.

### Overview

IAM Role Selector introduces the `IAMRoleSelector` CRD, which allows cluster administrators to:
- Define IAM roles that ACK controllers can assume
- Use namespace selectors (names or label selectors) to control where roles can be used
- Optionally scope roles to specific API versions or resource kinds
- Dynamically configure role usage without requiring resource-level annotations

### Prerequisites

1. **Source Account**: The AWS account where your ACK controller runs
2. **Target Account**: The AWS account where you want to create/manage resources
3. **Cross-account IAM role**: A role in the target account that trusts the source account
4. **Feature enabled**: IAM Role Selector must be enabled via feature flag when installing ACK
5. **IAMRoleSelector CRD installed**: Every controller chart ships the `IAMRoleSelector` CRD in its `crds/` directory, which Helm installs on `helm install` only, never on `helm upgrade`. If the controller was installed before the CRD existed and upgraded since, apply the CRD from the chart:
   ```bash
   helm pull oci://public.ecr.aws/aws-controllers-k8s/$SERVICE-chart --version=$RELEASE_VERSION --untar
   kubectl apply -f $SERVICE-chart/crds/services.k8s.aws_iamroleselectors.yaml
   ```
6. **Cluster-wide read access to IAMRoleSelectors**: `IAMRoleSelector` is cluster-scoped, so the controller lists it across the cluster. With `installScope: cluster` (the default), the chart grants this. With `installScope: namespace`, the chart grants permissions only in the watched namespaces, and the controller cannot list IAMRoleSelectors. Grant it read access with a ClusterRole:
   ```bash
   cat <<EOF | kubectl apply -f -
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRole
   metadata:
     name: ack-iamroleselectors-reader
   rules:
   - apiGroups: ["services.k8s.aws"]
     resources: ["iamroleselectors"]
     verbs: ["get", "list", "watch"]
   ---
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRoleBinding
   metadata:
     name: ack-$SERVICE-controller-iamroleselectors-reader
   roleRef:
     apiGroup: rbac.authorization.k8s.io
     kind: ClusterRole
     name: ack-iamroleselectors-reader
   subjects:
   - kind: ServiceAccount
     name: ack-$SERVICE-controller # serviceAccount.name in the chart values
     namespace: $ACK_SYSTEM_NAMESPACE
   EOF
   ```

:::warning Create selectors before the resources they map
A resource reconciled while no `IAMRoleSelector` matches it is managed with the controller's own role, in the controller's account. A selector created later does not move it: reconciliation of that resource then fails with `Resource already exists in account ..., but the role used for reconciliation is in account ...`. Create the `IAMRoleSelector` before the resources it maps.
:::

### Step 1: Create Cross-Account IAM Role

<details>
<summary>In the **target account**, create an IAM role that trusts the source account's controller role</summary>

```bash
# In the target account
export SOURCE_ACCOUNT_ROLE_ARN="arn:aws:iam::111111111111:role/ack-controller-role"

# Create trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "${SOURCE_ACCOUNT_ROLE_ARN}"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name ACK-CrossAccount-Target \
  --assume-role-policy-document file://trust-policy.json

# Attach necessary permissions (example for S3)
aws iam attach-role-policy \
  --role-name ACK-CrossAccount-Target \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

</details>

### Step 2: Grant AssumeRole Permission to Controller

<details>
<summary>In the **source account**, ensure your ACK controller's IAM role can assume the target role</summary>

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::222222222222:role/ACK-CrossAccount-Target"
    }
  ]
}
```

</details>

### Step 3: Create IAMRoleSelector Resource

Create an `IAMRoleSelector` to map the IAM role to specific namespaces or resources:

**Example 1: Map role to specific namespace**

```yaml
apiVersion: services.k8s.aws/v1alpha1
kind: IAMRoleSelector
metadata:
  name: production-account-config
spec:
  arn: arn:aws:iam::222222222222:role/ACK-CrossAccount-Target
  namespaceSelector:
    names:
      - production
```

**Example 2: Map role using namespace labels**

```yaml
apiVersion: services.k8s.aws/v1alpha1
kind: IAMRoleSelector
metadata:
  name: dev-team-config
spec:
  arn: arn:aws:iam::222222222222:role/ACK-CrossAccount-Target
  namespaceSelector:
    names: []  # Empty names array required, matches no specific names
    labelSelector:
      matchLabels:
        environment: development
        team: sky-team
```

**Example 3: Map role to specific resource types**

```yaml
apiVersion: services.k8s.aws/v1alpha1
kind: IAMRoleSelector
metadata:
  name: s3-buckets-only
spec:
  arn: arn:aws:iam::222222222222:role/ACK-CrossAccount-S3
  namespaceSelector:
    names:
      - production
  resourceTypeSelector:
    - group: s3.services.k8s.aws
      version: v1alpha1
      kind: Bucket  # Only S3 Buckets, not other S3 resources
```

**Example 4: Cluster-wide role for all resources**

```yaml
apiVersion: services.k8s.aws/v1alpha1
kind: IAMRoleSelector
metadata:
  name: cluster-wide-config
spec:
  arn: arn:aws:iam::222222222222:role/ACK-CrossAccount-Target
  # No selectors = matches all namespaces and resources
```

### Step 4: Create Resources

Once the `IAMRoleSelector` is configured, simply create resources in the matching namespace:

```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: cross-account-bucket
  namespace: production  # Matches IAMRoleSelector
spec:
  name: my-bucket-in-target-account
```

ACK will automatically use the matched IAM role when managing this resource. The resource status will show which selector was used via a condition:

```yaml
status:
  ackResourceMetadata:
    arn: arn:aws:s3:::my-bucket-in-target-account
  conditions:
  - type: ACK.IAMRoleSelected
    status: "True"
    message: "roleARN: arn:aws:iam::222222222222:role/ACK-CrossAccount-Target, selectorName: production-account-config, selectorResourceVersion: 89424719"
```

### Selection Logic

- Multiple selectors can be defined; ACK evaluates all of them for each resource
- If **exactly one** `IAMRoleSelector` matches, that role is used
- If **no** `IAMRoleSelector` matches, the default controller role is used
- If **multiple** `IAMRoleSelector`s match, a conflict occurs and the resource shows an error condition

**Conflict Example:**

```yaml
status:
  conditions:
  - message: |-
      Cannot determine which IAMRoleSelector to use.
      Conflicting IAMRoleSelectors: [production-account-config, s3-buckets-only]
    status: "True"
    type: ACK.Recoverable
```

To resolve conflicts, update or delete one of the conflicting selectors, or make them more specific.

### Enabling the Feature

IAM Role Selector must be enabled via feature flag when installing ACK:

```bash
helm install -n ack-system ack-s3-controller \
  oci://public.ecr.aws/aws-controllers-k8s/s3-chart \
  --set featureGates.IAMRoleSelector=true
```

:::warning CARM Compatibility
Enabling IAM Role Selector **disables CARM**. These features cannot be used together.
:::

</TabItem>
<TabItem value="carm" label="CARM">

:::danger CARM Deprecation
**CARM (Cross-Account Resource Management) is being deprecated.**

For new implementations, use the **IAM Role Selector** approach instead. Existing CARM configurations will continue to work but migration to IAM Role Selector is recommended.
:::

## What is CARM?

CARM is ACK's original cross-account resource management feature that uses ConfigMaps to define account mappings.

### How CARM Works

CARM maps namespaces to AWS accounts and IAM roles using a ConfigMap:

**Basic Setup:**

1. Create a ConfigMap defining account mappings:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ack-role-account-map
  namespace: ack-system
data:
  "222222222222": arn:aws:iam::222222222222:role/ACK-CrossAccount-Prod
  "333333333333": arn:aws:iam::333333333333:role/ACK-CrossAccount-Staging
```

2. Annotate namespaces with the account ID:

```bash
kubectl annotate namespace production \
  services.k8s.aws/owner-account-id=222222222222

kubectl annotate namespace staging \
  services.k8s.aws/owner-account-id=333333333333
```

3. Create resources in the annotated namespace:

```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: prod-bucket
  namespace: production
spec:
  name: my-production-bucket
```

The controller automatically uses the role mapped to `222222222222` for resources in the `production` namespace.

### Team-Level CARM (Advanced)

For multiple roles within the same account, CARM supports a team-level mapping:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ack-role-account-map
  namespace: ack-system
data:
  "222222222222": arn:aws:iam::222222222222:role/ACK-Default
  "team-a": arn:aws:iam::222222222222:role/ACK-TeamA
  "team-b": arn:aws:iam::222222222222:role/ACK-TeamB
```

Then annotate namespaces with team IDs:

```bash
kubectl annotate namespace team-a-ns \
  services.k8s.aws/owner-account-id=team-a
```

### Limitations

- Uses untyped ConfigMaps (no schema validation)
- Requires namespace annotations (implicit permission model)
- Cannot differentiate roles by resource type within a namespace
- Account ID strings don't have to match actual account IDs (confusing semantics)
- Difficult to iterate without breaking existing configurations

### Migration to IAM Role Selector

To migrate from CARM to IAM Role Selector:

1. Note your existing role ARNs from the ConfigMap
2. Create equivalent `IAMRoleSelector` resources:

```yaml
# Before (CARM ConfigMap entry)
# data:
#   "222222222222": arn:aws:iam::222222222222:role/ACK-CrossAccount-Prod

# After (IAMRoleSelector)
apiVersion: services.k8s.aws/v1alpha1
kind: IAMRoleSelector
metadata:
  name: production-config
spec:
  arn: arn:aws:iam::222222222222:role/ACK-CrossAccount-Prod
  namespaceSelector:
    names:
      - production
```

3. Remove namespace annotations
4. Delete the CARM ConfigMap
5. Enable IAM Role Selector feature flag

</TabItem>
</Tabs>

## Troubleshooting

### Access Denied Errors

If you see access denied errors:

1. **Verify trust policy**: Ensure the target role trusts the source account's controller role
2. **Check permissions**: Confirm the target role has necessary service permissions
3. **AssumeRole permission**: Verify the source controller role can call `sts:AssumeRole`
4. **Role ARN format**: Double-check the role ARN syntax

### IAMRoleSelector Not Matching

If resources aren't using the expected role:

1. **Check selectors**: Verify namespace names or labels match the selector
2. **Check conflicts**: Look for multiple matching selectors in resource status
3. **Feature enabled**: Confirm `IAMRoleSelector` feature flag is set
4. **Namespace labels**: Ensure label selectors match actual namespace labels

### Check Controller Logs

```bash
kubectl logs -n ack-system deployment/ack-<service>-controller | grep -i "assume"
```

Look for messages about role assumption failures or selector conflicts.

## Best Practices

1. **Least privilege**: Grant only necessary permissions to cross-account roles
2. **External ID**: Consider using external IDs for additional security
3. **Clear naming**: Use descriptive names for IAMRoleSelector resources
4. **Namespace labels**: Use consistent labeling for dynamic namespace selection
5. **Monitoring**: Set up CloudTrail to monitor cross-account access
6. **Avoid conflicts**: Design selectors to avoid overlapping resource matches

## Next Steps

- [Configure deletion policies](/guides/deletion-policy) for cross-account resources
- [Set up cross-region deployments](/guides/multi-region)
- [Adopt existing resources](/guides/adoption) in target accounts
