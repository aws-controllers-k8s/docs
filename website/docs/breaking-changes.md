---
title: "Breaking Changes"
sidebar_position: 99
---

# Breaking Changes

This page tracks breaking changes to ACK controller defaults and behavior. Review this page before upgrading your controllers.

## Cross-Namespace References Default Change

:::warning[Breaking Change]
For controller versions released on or after Oct 8, 2026, `--enable-cross-namespace` defaults to `false`. Cross-namespace references and field exports are blocked unless you opt in.
:::

### Summary

Cross-namespace resource references (including `*Ref` fields, `SecretKeyReference`, and `FieldExport` targets across namespaces) require explicit opt-in to improve namespace isolation. See [aws-controllers-k8s/community#3031](https://github.com/aws-controllers-k8s/community/issues/3031) for the announcement.

### Timeline

| Phase | Description |
|:------|:------------|
| **Phase 1**<br/>**(June 2026)** | Flag added with default `true`. `ACK.Advisory` condition (reason `CrossNamespaceOptInRequired`) set on resources using cross-namespace references |
| **Phase 2 (current)**<br/>**(Oct 8, 2026)** | Flag default changes to `false`. Cross-namespace reference resolution and field exports blocked unless opted in. The `CrossNamespaceOptInRequired` advisory condition is no longer set |

### Who is affected

You are affected if any of your ACK resources:
- Use `*Ref` fields pointing to resources in a **different namespace**
- Use `SecretKeyReference` with a `namespace` field different from the resource's namespace
- Use `FieldExport` CRs targeting ConfigMaps/Secrets in a different namespace than the source

If all your references are within the same namespace, **no action is needed**.

### Action required

If you use cross-namespace references, explicitly opt in when upgrading to a controller version released on or after Oct 8, 2026:

```yaml
# values.yaml
enableCrossNamespace: true
```

Or via controller flag:
```
--enable-cross-namespace=true
```

Without the opt-in, a cross-namespace `*Ref` sets `ACK.ReferencesResolved=False`, and a cross-namespace `SecretKeyReference` or `FieldExport` target sets `ACK.Terminal`. In both cases the message says `cross-namespace resource reference is not allowed. Set --enable-cross-namespace=true to allow it`.
