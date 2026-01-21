---
sidebar_position: 1
title: Overview
---

# AWS Controllers for Kubernetes (ACK)

**AWS Controllers for Kubernetes (ACK)** lets you define and manage AWS service resources directly from Kubernetes. Traditionally, when building applications on Kubernetes, you need to juggle multiple tools: Kubernetes manifests for your workloads, and separate tools like **CloudFormation**, **Terraform**, or the AWS Console for infrastructure like databases, queues, and storage. This split creates operational complexity and breaks the unified workflow that makes Kubernetes powerful. ACK solves this by bringing AWS services into Kubernetes as native resources, so you can manage everything  -  applications and infrastructure  -  using the same declarative **YAML** manifests and **GitOps** workflows you already know.

ACK is a collection of Kubernetes controllers, one for each AWS service. These controllers watch for **custom resources** in your cluster and communicate with **AWS APIs** to create, update, and delete AWS resources on your behalf. When you apply a manifest describing an **RDS** database or an **S3** bucket, ACK handles the AWS API calls and continuously reconciles the actual state in AWS with your desired state in Kubernetes. This means you can version control your entire stack, apply infrastructure changes through standard Kubernetes tooling, and let your teams focus on building features instead of managing infrastructure across disconnected systems.

Here's what it looks like to create an S3 bucket with ACK:

```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: my-app-bucket
spec:
  name: my-unique-bucket-name
```

When you apply this manifest to your cluster, the ACK S3 controller creates the bucket in AWS and continuously ensures it matches your desired configuration.

## How It Works

ACK extends Kubernetes using **Custom Resource Definitions (CRDs)** and controllers. Each ACK controller implements the Kubernetes controller pattern: it watches for changes to custom resources in your cluster, translates them into AWS API calls, and continuously reconciles the actual state in AWS with the desired state declared in your manifests.

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <img
    src="/docs/img/how-it-works.svg"
    alt="ACK workflow diagram"
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

The reconciliation loop runs continuously. When you create or update a resource, the controller calls the appropriate AWS APIs to provision or modify the infrastructure. The controller then monitors both Kubernetes and AWS, ensuring they stay in sync. If someone makes manual changes directly in AWS, the controller detects the drift during its next reconciliation cycle and brings the resource back to the state defined in your cluster.

## CRD Design Philosophy

ACK brings AWS services into Kubernetes by designing CRDs to be as **declarative** as possible. The goal is to let you describe your desired infrastructure state in Kubernetes manifests, and let the controllers handle the imperative steps needed to achieve that state in AWS. While ACK CRDs closely follow AWS service APIs to maintain familiarity, they're adapted to fit Kubernetes patterns and the declarative model that makes Kubernetes powerful.

### Resource Granularity

A key design decision in ACK is **one comprehensive CRD per AWS resource type**. ACK consolidates all properties of a resource into a single CRD. This means the **S3 Bucket** CRD includes versioning, encryption, lifecycle policies, and all other bucket configurations in its spec. The **IAM Role** CRD includes policies, trust relationships, and all permissions in one place.

This approach differs from tools that split configuration across multiple sub-resources (like separate resources for bucket versioning, lifecycle policies, and encryption). ACK's consolidated model aligns with Kubernetes' declarative philosophy: you describe your complete desired state in one manifest, and the controller reconciles everything together. You manage one complete resource definition instead of multiple interdependent pieces.

**S3 Bucket example with multiple properties:**

```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: my-production-bucket
spec:
  name: my-production-data
  versioning:
    status: Enabled
  encryption:
    rules:
      - applyServerSideEncryptionByDefault:
          sseAlgorithm: AES256
  lifecycle:
    rules:
      - id: delete-old-versions
        status: Enabled
        noncurrentVersionExpiration:
          noncurrentDays: 90
  publicAccessBlock:
    blockPublicACLs: true
    blockPublicPolicy: true
    ignorePublicACLs: true
    restrictPublicBuckets: true
```

**IAM Role example with attached policies:**

```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: my-app-role
spec:
  name: MyApplicationRole
  assumeRolePolicyDocument: |
    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ec2.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }
  policies:
    - arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
  inlinePolicies:
    s3-read-access: |
      {
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": ["s3:GetObject", "s3:ListBucket"],
          "Resource": "*"
        }]
      }
```

### Mapping to AWS APIs

ACK CRDs closely follow AWS API structure:

- **Spec fields** map to AWS API input parameters
- **Status fields** map to AWS API output/describe responses
- **Field names** match AWS API field names (converting from AWS's PascalCase to Kubernetes camelCase)

This design makes it easy to:

- Translate AWS documentation to ACK manifests
- Use existing AWS knowledge without learning new abstractions
- Predict what fields are available based on AWS API documentation

## Architecture

ACK uses a distributed architecture with one controller per AWS service. Each controller has its own container image and Helm chart, so you install only what you need.

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <img
    src="/docs/img/architecture.svg"
    alt="ACK architecture diagram"
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

Controllers talk directly to AWS APIs with no middleware or intermediary services. This direct communication makes **Kubernetes (etcd) your true source of truth** for infrastructure state. When you want to know what resources exist or what their configuration is, you query Kubernetes - not AWS, not a separate state file, not a database. This architecture ensures that your Git repository and Kubernetes cluster maintain the authoritative definition of your infrastructure.

Controllers operate independently with separate release cycles. This means updates to the S3 controller don't affect your RDS controller, giving you more control over when and how you adopt changes.

## Supported Services

ACK supports 50+ AWS services across compute, storage, databases, networking, security, messaging, machine learning, and more. Each service controller is independently released and versioned.

Browse the complete list with installation instructions, version info, and maintenance status:

[View List of Controllers →](/services)

## Key Features

- **Resource Adoption** - Import existing AWS resources into Kubernetes without recreating them
- **Cross-Account** - Manage resources across multiple AWS accounts from a single cluster
- **Multi-Region** - Deploy resources to any AWS region using annotations
- **Deletion Policies** - Choose whether to retain or delete AWS resources when removing Kubernetes objects
- **Drift Detection** - Automatically reconcile manual changes back to desired state

[Learn how to manage resources →](/guides/create-resource)

## Getting Started

<div className="row" style={{marginTop: '2rem'}}>
  <div className="col col--6">
    <div className="card">
      <div className="card__header">
        <h3>Quick Start</h3>
      </div>
      <div className="card__body">
        <p>Install your first controller and create an AWS resource.</p>
        <a href="/docs/getting-started" className="button button--primary button--block">Get Started</a>
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header">
        <h3>Learn Concepts</h3>
      </div>
      <div className="card__body">
        <p>Understand CRDs, controllers, reconciliation, and more.</p>
        <a href="/docs/concepts" className="button button--secondary button--block">Read Concepts</a>
      </div>
    </div>
  </div>
</div>

## Community & Support

- **Slack:** [#aws-controllers-k8s](https://kubernetes.slack.com/messages/aws-controllers-k8s) on Kubernetes Slack
- **GitHub Discussions:** [Ask questions](https://github.com/aws-controllers-k8s/docs/discussions)
- **Source Code:** [GitHub Organization](https://github.com/aws-controllers-k8s)
