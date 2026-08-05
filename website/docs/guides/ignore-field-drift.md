---
title: Ignore Field Drift
---

# Ignore Field Drift

By default, an ACK controller treats the resource spec as the source of truth: on every reconcile it compares your spec against the live AWS state and drives AWS back to match. The `services.k8s.aws/ignore-field-drift` annotation lets you tell ACK to **stop reconciling drift on specific fields**, while still creating and managing the rest of the resource.

This is useful when part of a resource is legitimately managed outside of ACK. Common examples are organization tooling that applies dynamic tags ACK would otherwise keep trying to remove (the motivating scenario in [community#2367](https://github.com/aws-controllers-k8s/community/issues/2367)), or an autoscaler that adjusts a capacity field ACK would otherwise reset to your declared value.

:::info Feature Status
Ignore Field Drift is gated by the **`IgnoreFieldDrift`** feature gate — an **Alpha** feature that is **disabled by default**. An operator must enable it on the controller before the annotation has any effect:

```bash
helm install ... --set featureGates.IgnoreFieldDrift=true
```

See [Feature Gates](/guides/feature-gates).
:::

## What it does

For each field listed in the annotation, ACK:

- **Still creates** the field from your spec (the create-time value is the baseline).
- **Still adopts an AWS-provided default** for the field if you leave it unset and AWS populates it (the value is read into your spec once).
- **Stops reconciling drift** — if the field changes on the AWS side out-of-band, ACK does **not** reset it to your spec.
- **Stops propagating your edits** — while the field is ignored, changing its value in your manifest does **not** push that change to AWS either. Ignoring drift is symmetric: neither side drives the other.
- **Retains your declared value** in the resource spec — ACK never overwrites it with the AWS-observed value.

The resource stays `ACK.ResourceSynced=True` even when ignored fields are drifted: you have declared that you don't want these fields managed, so the resource is in its desired state.

## Using the annotation

The annotation value is a comma-separated list of dotted field paths of the form `x.y.z` (the paths you see in your resource YAML):

```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: app-role
  annotations:
    services.k8s.aws/ignore-field-drift: "spec.tags"
spec:
  name: app-role
  policies:
    - arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
  tags:
    - key: team
      value: payments
```

With this in place:

1. At create, ACK applies your declared tag (`team=payments`) — the baseline.
2. External tooling adds other tags to the role in AWS. On the next reconcile, ACK observes them but, because `spec.tags` drift is ignored, does **not** remove them.
3. Edits you make to `spec.tags` are also ignored while the annotation is in place — for example, adding an `environment: dev` tag or changing `team` to `finance` in your manifest will **not** be propagated to AWS. To resume managing tags, remove the path from the annotation.
4. You can still change **other** fields (e.g. `spec.policies`) — those are reconciled normally. The role remains fully managed for everything except tag drift.

## Removing the annotation

Removing the annotation (or dropping a path from it) puts the field back under full ACK management: on the next reconcile, ACK compares the field against your spec and drives AWS back to match. This is a **mutating** action for the AWS resource — any out-of-band change is reverted to your declared spec value, and if you have edited the field in your manifest since, that new value is now propagated to AWS.

```bash
kubectl annotate role app-role services.k8s.aws/ignore-field-drift-
```

:::note When this takes effect
When the `IgnoreFieldDrift` feature gate is enabled, the controller watches for annotation changes, so adding, editing, or removing the annotation triggers a reconcile on its own — you do not need to also change the spec.
:::

If you want the current AWS value to become the new desired state instead, set your spec field to that value before removing the annotation — ACK never silently adopts a drifted value.

## Notes and limitations

- **Whole entry, not individual members of a collection.** You ignore a field as a unit. You cannot ignore drift on only part of a collection (list or map) — for example, one element's weight within a list, or a single key within a map — while still managing the rest of that same collection. To ignore drift you must ignore the whole list or map field.
- **Applies to drift, not create.** The field is still sent at create and can still pick up an AWS-provided default; only *subsequent* drift is ignored. Adding a *new* value and the annotation in the same edit on an existing resource will not apply the new value — set the value first (or at create), then add the annotation.
- **Paths are validated for syntax only.** A malformed path (illegal characters, empty segments) is logged as a warning. A well-formed but incorrect path (e.g. a typo like `spec.tagz`) silently has no effect — double-check the path matches your resource's spec.
- **Undeclared parent of an ignored field.** If an ignored field's parent object is absent from your spec but exists in AWS (e.g. you ignore `spec.network.vpc.cidr` but never declare `spec.network.vpc`), ACK creates only the structure needed to reach the ignored field and copies over only that field's value — sibling fields under the newly-created parent are **not** carried over from the AWS state. If such a sibling is server-managed and is not declared in your spec, a later Update (triggered by an unrelated field change) can send the partially-populated parent object and unintentionally clear that sibling. The surest way to avoid this is to explicitly declare in your spec any sibling fields you want preserved.

## Next Steps

- [Feature Gates](/guides/feature-gates) - Enable `IgnoreFieldDrift`
- [ReadOnly Resources](/guides/readonly) - Observe a resource without managing any field
- [Deletion Policy](/guides/deletion-policy) - Control deletion behavior for managed resources
