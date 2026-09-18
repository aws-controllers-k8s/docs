---
sidebar_position: 10
title: ACK CLI
---

# ACK CLI

`ackctl` is a command-line companion for ACK. Its first command, `ackctl adopt`, discovers
existing AWS resources by tag and writes the manifests that bring them under ACK
management.

:::warning Alpha
The CLI is in alpha. Flags and output may change between releases, and there are no
prebuilt binaries yet — install it with `go install`.
:::

## Prerequisites

- Go 1.24 or newer
- `$(go env GOPATH)/bin` on your `PATH`

## Install

```bash
go install github.com/aws-controllers-k8s/ackctl/cmd/ackctl@latest
```

To pin a specific release instead of the newest one:

```bash
go install github.com/aws-controllers-k8s/ackctl/cmd/ackctl@v0.0.1
```

Confirm the install and see which version you have:

```bash
ackctl version
```

## Commands

| Command | Purpose |
|---------|---------|
| `ackctl adopt` | Bring existing AWS resources under ACK management, discovered by tag |
| `ackctl list adoptable` | Show which resource kinds can be adopted by tag, and why the rest cannot |

Run `ackctl <command> --help` for flags and examples. A full command reference will be added
here as the CLI stabilizes.

## Example

Adopt every EKS Nodegroup tagged `Environment=prod`:

```bash
ackctl adopt --service eks --kind Nodegroup --tag Environment=prod | kubectl create -f -
```

Manifests are written to stdout; nothing is applied to your cluster for you.

### Observe-only defaults

`--read-only` defaults to `true` and `--deletion-policy` defaults to `retain`, so the
emitted CRs let ACK reconcile the resource without modifying or deleting it. A too-broad
selector or a mis-mapped identifier then costs you a CR to delete rather than a production
resource.

To let ACK own the resource instead, either pass `--read-only=false --deletion-policy delete`
when generating the manifests, or flip it later. `--adoption-set` labels a collection so it is
selectable as a group, which makes the second option one command:

```bash
kubectl annotate nodegroup -l ack.k8s.aws/adoption-set=platform-prod \
    services.k8s.aws/read-only=false --overwrite
```

The label deliberately does not affect CR names, so one value can span several runs.

### Prefer `kubectl create` over `kubectl apply`

CR names are derived from the AWS resource's own primary key plus a digest of its ARN, for
example `prod-cluster-workers-7f3a9c1d`. Because the name depends only on the AWS resource's
identity, re-adopting the same resource — even under a different `--adoption-set` —
regenerates the same name.

`create` issues a POST, which the API server rejects with `AlreadyExists` if a CR of that
name exists. Combined with identity-derived names, that is what stops one AWS resource being
adopted twice. `apply` issues a patch, which would silently mutate whatever CR already holds
that name, stamping adoption annotations onto a CR that manages a different AWS resource.

`create` is also per-object: if one name collides the other CRs are still created and only
the conflicting one errors, so re-running after new resources appear adopts exactly the
delta.

## See also

- [Resource Adoption](./guides/adoption.md) — adopting a single resource by hand with the
  `services.k8s.aws/adoption-fields` annotation.
- [aws-controllers-k8s/ackctl](https://github.com/aws-controllers-k8s/ackctl) — source and
  issue tracker.
