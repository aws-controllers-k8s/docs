---
sidebar_position: 2
title: Self-Managed with Helm
sidebar_label: Using Helm
---

# Self-Managed Installation with Helm

This guide shows you how to install ACK controllers yourself using Helm. This method works on any Kubernetes cluster and gives you full control over controller configuration.

## Prerequisites

Before you begin, make sure you have:

- **Kubernetes cluster** (any Kubernetes 1.20+, including EKS, GKE, AKS, kind, minikube)
- **kubectl** installed and configured
- **Helm 3.8+** installed ([installation guide](https://helm.sh/docs/intro/install/))
- **AWS account** with appropriate permissions
- **AWS CLI** installed and configured (optional, but helpful)

:::tip Works on any Kubernetes
ACK works on **any** Kubernetes cluster, not just Amazon EKS. You can run it on GKE, AKS, on-premises clusters, or even local development clusters like kind or minikube.
:::

## Quick Start: Create a DynamoDB Table

We'll use the DynamoDB controller for this tutorial because it's simple, free-tier eligible, and easy to verify in the AWS Console.

### Step 1: Install the DynamoDB Controller

First, find the latest version and install the controller using Helm:

```bash
# Set variables
export SERVICE=dynamodb
export RELEASE_VERSION=$(curl -sL https://api.github.com/repos/aws-controllers-k8s/${SERVICE}-controller/releases/latest | jq -r '.tag_name | ltrimstr("v")')
export ACK_SYSTEM_NAMESPACE=ack-system
export AWS_REGION=us-west-2

# Log in to ECR Public
aws ecr-public get-login-password --region us-east-1 | \
  helm registry login --username AWS --password-stdin public.ecr.aws

# Install the controller
helm install --create-namespace -n $ACK_SYSTEM_NAMESPACE \
  ack-$SERVICE-controller \
  oci://public.ecr.aws/aws-controllers-k8s/$SERVICE-chart \
  --version=$RELEASE_VERSION \
  --set=aws.region=$AWS_REGION
```

:::info Change the region
Replace `us-west-2` with your preferred AWS region.
:::

Verify the controller is running:

```bash
kubectl get pods -n ack-system
```

You should see output like:

```
NAME                                      READY   STATUS    RESTARTS   AGE
ack-dynamodb-controller-6d8f7c4b9-xk7zp   1/1     Running   0          30s
```

### Step 2: Configure AWS Permissions

The controller needs AWS credentials to create resources. Choose your authentication method:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="podidentity" label="PodIdentity" default>

**Recommended for EKS clusters**

EKS Pod Identity is the simplest and most secure way to provide AWS permissions to your controller.

```bash
# Create IAM role with DynamoDB permissions
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
export CLUSTER_NAME=your-cluster-name

# Create IAM role with trust policy for EKS Pod Identity
aws iam create-role \
  --role-name ack-${SERVICE}-controller \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "pods.eks.amazonaws.com"
      },
      "Action": [
        "sts:AssumeRole",
        "sts:TagSession"
      ]
    }]
  }'

# Attach DynamoDB policy
aws iam attach-role-policy \
  --role-name ack-${SERVICE}-controller \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# Create Pod Identity Association
aws eks create-pod-identity-association \
  --cluster-name $CLUSTER_NAME \
  --namespace $ACK_SYSTEM_NAMESPACE \
  --service-account ack-${SERVICE}-controller \
  --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/ack-${SERVICE}-controller

# Restart controller to pick up the association
kubectl rollout restart deployment -n $ACK_SYSTEM_NAMESPACE \
  ack-${SERVICE}-controller
```

:::tip Easiest setup
EKS Pod Identity requires no OIDC provider setup and works out of the box on EKS 1.24+.
:::

</TabItem>
<TabItem value="irsa" label="IRSA">

**For EKS clusters with OIDC provider**

IAM Roles for Service Accounts (IRSA) is the traditional secure method for EKS.

```bash
# Create IAM role with DynamoDB permissions
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
export OIDC_PROVIDER=$(aws eks describe-cluster --name YOUR_CLUSTER_NAME \
  --query "cluster.identity.oidc.issuer" --output text | sed -e "s/^https:\/\///")

# Create trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/${OIDC_PROVIDER}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "${OIDC_PROVIDER}:sub": "system:serviceaccount:${ACK_SYSTEM_NAMESPACE}:ack-${SERVICE}-controller"
        }
      }
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name ack-${SERVICE}-controller \
  --assume-role-policy-document file://trust-policy.json

# Attach DynamoDB policy
aws iam attach-role-policy \
  --role-name ack-${SERVICE}-controller \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# Annotate service account
kubectl annotate serviceaccount -n $ACK_SYSTEM_NAMESPACE \
  ack-${SERVICE}-controller \
  eks.amazonaws.com/role-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:role/ack-${SERVICE}-controller

# Restart controller to pick up the annotation
kubectl rollout restart deployment -n $ACK_SYSTEM_NAMESPACE \
  ack-${SERVICE}-controller
```

See the [Configure IAM Permissions guide](/guides/configure-iam) for more details.

</TabItem>
<TabItem value="other" label="Other">

**For non-EKS clusters or development**

Use AWS credentials from your local environment (not recommended for production):

```bash
# Create secret with AWS credentials
kubectl create secret generic -n $ACK_SYSTEM_NAMESPACE \
  ack-${SERVICE}-user-secrets \
  --from-literal=AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id) \
  --from-literal=AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)

# Configure controller to use the secret
export ACK_ENABLE_DEVELOPMENT_LOGGING=true
helm upgrade --install -n $ACK_SYSTEM_NAMESPACE \
  ack-$SERVICE-controller \
  oci://public.ecr.aws/aws-controllers-k8s/$SERVICE-chart \
  --version=$RELEASE_VERSION \
  --set=aws.region=$AWS_REGION \
  --set=aws.credentials.secretName=ack-${SERVICE}-user-secrets
```

:::warning For development only
This method exposes your credentials in the cluster. For production, use PodIdentity or IRSA (on EKS), or IAM roles for pods on other platforms.
:::

</TabItem>
</Tabs>

### Step 3: Create Your First AWS Resource

Now let's create a DynamoDB table! Save this manifest as `my-table.yaml`:

```yaml
apiVersion: dynamodb.services.k8s.aws/v1alpha1
kind: Table
metadata:
  name: my-first-ack-table
spec:
  tableName: my-first-ack-table
  billingMode: PAY_PER_REQUEST
  attributeDefinitions:
    - attributeName: id
      attributeType: S
  keySchema:
    - attributeName: id
      keyType: HASH
  tags:
    - key: environment
      value: development
    - key: managed-by
      value: ack
```

Apply the manifest:

```bash
kubectl apply -f my-table.yaml
```

### Step 4: Verify the Resource

Check the table status in Kubernetes:

```bash
# Get the table resource
kubectl get tables

# Describe for more details
kubectl describe table my-first-ack-table
```

You should see output like:

```
NAME                   STATUS
my-first-ack-table     ACTIVE
```

Verify in AWS Console or using AWS CLI:

```bash
aws dynamodb describe-table --table-name my-first-ack-table --region $AWS_REGION
```

### Step 5: Update the Resource

Let's add a global secondary index. Update `my-table.yaml`:

```yaml
apiVersion: dynamodb.services.k8s.aws/v1alpha1
kind: Table
metadata:
  name: my-first-ack-table
spec:
  tableName: my-first-ack-table
  billingMode: PAY_PER_REQUEST
  attributeDefinitions:
    - attributeName: id
      attributeType: S
    - attributeName: email
      attributeType: S
  keySchema:
    - attributeName: id
      keyType: HASH
  globalSecondaryIndexes:
    - indexName: email-index
      keySchema:
        - attributeName: email
          keyType: HASH
      projection:
        projectionType: ALL
  tags:
    - key: environment
      value: development
    - key: managed-by
      value: ack
```

Apply the update:

```bash
kubectl apply -f my-table.yaml
```

Watch the update progress:

```bash
kubectl get table my-first-ack-table -w
```

### Step 6: Clean Up

When you're done, delete the table:

```bash
kubectl delete -f my-table.yaml
```

This deletes both the Kubernetes resource and the DynamoDB table in AWS. You can verify:

```bash
# Check Kubernetes
kubectl get tables

# Check AWS
aws dynamodb list-tables --region $AWS_REGION
```

## What You Learned

Congratulations! You've successfully:

- Installed an ACK service controller
- Configured AWS permissions
- Created an AWS resource using kubectl
- Updated the resource
- Deleted the resource

## Common Issues

Here are quick solutions to common problems. For detailed troubleshooting, see the [Troubleshooting Guide](/guides/troubleshooting).

<details>
<summary><strong>Controller pod not starting</strong></summary>

Check the controller logs:

```bash
kubectl logs -n ack-system deployment/ack-dynamodb-controller
```

Common causes:
- Helm chart version mismatch
- Resource constraints
- Image pull errors

</details>

<details>
<summary><strong>Resources not being created in AWS</strong></summary>

Check for permission issues:

```bash
kubectl describe table my-first-ack-table
```

Look for events like:
- `AccessDenied` - IAM role missing permissions
- `InvalidClientTokenId` - Credentials not configured
- `UnrecognizedClientException` - Wrong region or credentials

</details>

<details>
<summary><strong>"ACK.Terminal" condition</strong></summary>

A terminal condition means the controller encountered an unrecoverable error. Common causes:

- Invalid configuration (e.g., invalid attribute type)
- AWS service limits exceeded
- Resource name already exists in AWS

Check the `kubectl describe` output for the specific error message.

</details>

See the [Troubleshooting Guide](/guides/troubleshooting) for more detailed solutions.

## Installing Additional Controllers

To install another controller, repeat the process with a different service name:

```bash
export SERVICE=s3  # or rds, ec2, elasticache, etc.
export RELEASE_VERSION=$(curl -sL https://api.github.com/repos/aws-controllers-k8s/${SERVICE}-controller/releases/latest | jq -r '.tag_name | ltrimstr("v")')

helm install -n $ACK_SYSTEM_NAMESPACE \
  ack-$SERVICE-controller \
  oci://public.ecr.aws/aws-controllers-k8s/$SERVICE-chart \
  --version=$RELEASE_VERSION \
  --set=aws.region=$AWS_REGION
```

Remember to configure appropriate IAM permissions for each controller.

## Next Steps

<div className="row" style={{marginTop: '2rem'}}>
  <div className="col col--4">
    <div className="card">
      <div className="card__header">
        <h3>Learn Core Concepts</h3>
      </div>
      <div className="card__body">
        <p>Understand CRDs, controllers, reconciliation, and more.</p>
        <a href="/docs/concepts" className="button button--secondary button--block">Read Concepts</a>
      </div>
    </div>
  </div>
  <div className="col col--4">
    <div className="card">
      <div className="card__header">
        <h3>Advanced Features</h3>
      </div>
      <div className="card__body">
        <p>Learn about resource adoption, field exports, and deletion policies.</p>
        <a href="/docs/guides/adoption" className="button button--secondary button--block">View Guides</a>
      </div>
    </div>
  </div>
  <div className="col col--4">
    <div className="card">
      <div className="card__header">
        <h3>Explore More Services</h3>
      </div>
      <div className="card__body">
        <p>Browse 50+ available service controllers.</p>
        <a href="/docs/services" className="button button--secondary button--block">View Controllers</a>
      </div>
    </div>
  </div>
</div>

## Getting Help

- **Documentation**: Check the [Managing Resources](/guides/adoption) guides
- **Slack**: Join [#aws-controllers-k8s](https://kubernetes.slack.com/messages/aws-controllers-k8s)
- **GitHub**: Search [existing issues](https://github.com/aws-controllers-k8s/community/issues) or open a new one
