---
sidebar_position: 1
---

# Contributing to ACK

Welcome to the contributor documentation for AWS Controllers for Kubernetes (ACK). Whether you're building a new service controller, adding resources to an existing one, or improving the core framework, this section will help you get started.

## Project Tenets

We follow a set of tenets in building ACK:

1. **Collaborate in the Open** — Our source code, development methodology, testing, release, and documentation processes are all open. We are a community-driven project.

2. **Generate Everything** — We generate as much code as possible. Generated code is easier to maintain and encourages consistency. While some hand-written code is necessary for AWS API peculiarities, we look for patterns and enhance the code generator to handle them.

3. **Focus on Kubernetes** — We seek ways to make the Kubernetes user experience as simple and consistent as possible for managing AWS resources. The code generator enables renaming fields, injecting custom code, and smoothing over inconsistencies between AWS service APIs.

4. **Run Anywhere** — ACK service controllers can be installed on any Kubernetes cluster, regardless of whether you use Amazon EKS.

5. **Minimize Service Dependencies** — ACK service controllers only depend on IAM/STS and the specific AWS service they integrate with. We do not take a dependency on any stateful resource-tracking service, such as CloudFormation, Cloud Control API, or Terraform.

## Getting Started

| Guide | Description |
|-------|-------------|
| [Development Setup](setup.md) | Fork repos, install prerequisites, build the code generator |
| [Building a Controller](building-controller.md) | Generate and compile a service controller |
| [Code Organization](code-organization.md) | Repository structure overview |
| [Code Generation Overview](code-generation/overview.md) | How the code generator works |
| [Configuration Reference](code-generation/configuration.md) | generator.yaml fields and options |
| [Hooks and Custom Code](code-generation/hooks.md) | Injecting custom logic into generated controllers |
| [Field Configuration](code-generation/field-config.md) | Renames, immutability, references, tags, wrappers |
| [Testing](testing.md) | E2E test patterns and running tests |
| [Releasing](releasing.md) | Release process and versioning |

## AI-Assisted Development

The [ack-dev-skills](https://github.com/aws-controllers-k8s/ack-dev-skills) project provides an [Agent Skill](https://agentskills.io) that gives AI coding agents contextual expertise for ACK development. It covers code generation, hooks, testing, PR workflows, and troubleshooting — distilled from years of team practices and code reviews.

If you use AI coding tools (Claude Code, Kiro, Cursor, etc.), installing this skill will significantly improve the quality of AI-assisted ACK development work. See the [ack-dev-skills README](https://github.com/aws-controllers-k8s/ack-dev-skills) for installation instructions.

## Community

- [GitHub Issues](https://github.com/aws-controllers-k8s/community/issues) — Bug reports and feature requests
- [GitHub Discussions](https://github.com/orgs/aws-controllers-k8s/discussions) — Questions and conversations
- [Slack Channel](https://kubernetes.slack.com/archives/C0402D8JJS1) — `#aws-controllers-k8s` on Kubernetes Slack
