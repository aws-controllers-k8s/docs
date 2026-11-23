---
sidebar_position: 2
title: Getting Started
---

# Getting Started

There are two ways to get started with ACK, depending on whether you're using Amazon EKS or running your own Kubernetes cluster.

## Choose Your Installation Method

<div className="row" style={{marginTop: '2rem', marginBottom: '2rem'}}>
  <div className="col col--6">
    <div className="card" style={{border: '1px solid var(--ifm-color-emphasis-300)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '12px'}}>
      <div className="card__header" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
        <img src="/docs/img/eks.png" alt="EKS" style={{width: '32px', height: '32px'}} />
        <h3 style={{margin: 0}}>EKS Capabilities (Managed)</h3>
      </div>
      <div className="card__body">
        <p><strong>Recommended for Amazon EKS users</strong></p>
        <p>Enable ACK controllers with one click in the EKS console. AWS manages the controller installation and upgrades for you.</p>
        <ul>
          <li>Fastest setup - no Helm or CLI required</li>
          <li>Automatic controller updates</li>
          <li>Access to all GA controllers - use what you need</li>
          <li>Highly available, with automatic scaling</li>
        </ul>
        <a href="/docs/getting-started-eks" className="button button--primary button--block">Get Started with EKS Capabilities</a>
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card" style={{border: '1px solid var(--ifm-color-emphasis-300)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '12px'}}>
      <div className="card__header" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
        <img src="/docs/img/helm-logo.svg" alt="Helm" style={{width: '32px', height: '32px'}} />
        <h3 style={{margin: 0}}>Self-Managed Installation</h3>
      </div>
      <div className="card__body">
        <p><strong>For any Kubernetes cluster</strong></p>
        <p>Install ACK controllers yourself using Helm. Works on any CNCF-certified Kubernetes cluster: managed cloud services, on-premises, or local development.</p>
        <ul>
          <li>Full control over versions and configuration</li>
          <li>Works on any CNCF-certified Kubernetes</li>
          <li>Access to all controllers, including those in preview</li>
          <li>Customize controller settings</li>
        </ul>
        <a href="/docs/getting-started-helm" className="button button--primary button--block">Get Started with Helm</a>
      </div>
    </div>
  </div>
</div>

## Which Method Should I Use?

**Use EKS Capabilities if:**

- You're running Amazon EKS
- You want AWS to manage controller lifecycle
- You want auto-scaling and auto-tuning capabilities
- You prefer a managed experience

**Use Self-Managed Installation if:**

- You want full control over versions and configuration
- You need to customize controller settings
- You're developing or testing ACK controllers
- You're running Kubernetes outside Amazon EKS (see [deployment environments](./getting-started-helm.md#deployment-environments))

## What's Next?

After installing your first controller using either method, you can:

- **Explore Features**: Learn about [resource adoption](/docs/guides/adoption), [cross-account management](/docs/guides/cross-account), and [deletion policies](/docs/guides/deletion-policy)
- **Browse Controllers**: Check out the [full list of available controllers](/services)
- **Understand Concepts**: Read about [CRDs, reconciliation, and architecture](/docs/concepts)
