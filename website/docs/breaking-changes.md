---
title: "Breaking Changes"
sidebar_position: 99
---

# Breaking Changes

This page tracks upcoming breaking changes to ACK controller defaults and behavior. Review this page before upgrading your controllers.

## Cross-Namespace References Default Change

:::warning[Breaking Change Notice]
The default value of `--enable-cross-namespace` will change from `true` to `false` in a future release. The warning condition serves as a deprecation notice of existing default functionality.
:::

### Summary

Cross-namespace resource references (including `*Ref` fields, `SecretKeyReference`, and `FieldExport` targets across namespaces) will require explicit opt-in to improve namespace isolation.

### Timeline

| Phase | Description |
|:------|:------------|
| **Phase 1 (current)** | Flag added with default `true`. Warning condition set on resources using cross-namespace references |
| **Phase 2**<br/>**(future release)** | Flag default changes to `false`. Cross-namespace reference resolution and field exports blocked unless opted in |

### Who is affected

You are affected if any of your ACK resources:
- Use `*Ref` fields pointing to resources in a **different namespace**
- Use `SecretKeyReference` with a `namespace` field different from the resource's namespace
- Use `FieldExport` CRs targeting ConfigMaps/Secrets in a different namespace than the source

If all your references are within the same namespace, **no action is needed**.

### Action required

If you use cross-namespace references, explicitly opt in before upgrading to the Phase 2 release:

```yaml
# values.yaml
enableCrossNamespace: true
```

Or via controller flag:
```
--enable-cross-namespace=true
```
