---
sidebar_position: 3
title: Field Export
---

# Field Export

The `FieldExport` resource allows you to copy any `spec` or `status` field from an ACK resource into a Kubernetes ConfigMap or Secret. This bridges the gap between managing AWS resources and using their properties in your applications.

:::tip
For more advanced resource composition and dependency management use cases, consider using [kro](https://kro.run).
:::

## How It Works

`FieldExport` is included in every ACK controller installation. It watches for changes to ACK resources and automatically updates the target ConfigMap or Secret when field values change.

## Using FieldExport

Create an ACK resource, a ConfigMap or Secret to receive the exported value, and a `FieldExport` to connect them:

```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: application-user-data
spec:
  name: doc-example-bucket
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: application-user-data-cm
data: {}
---
apiVersion: services.k8s.aws/v1alpha1
kind: FieldExport
metadata:
  name: export-user-data-bucket
spec:
  from:
    path: ".status.location"
    resource:
      group: s3.services.k8s.aws
      kind: Bucket
      name: application-user-data
  to:
    name: application-user-data-cm
    kind: configmap
```

After the bucket is created, the ConfigMap is automatically populated:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: application-user-data-cm
data:
  default.export-user-data-bucket: http://doc-example-bucket.s3.amazonaws.com/
```

The key format is `{namespace}.{fieldexport-name}` and the value is the resolved field from the resource.

## Using Exported Values in Pods

Mount the ConfigMap as an environment variable:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-application
spec:
  containers:
  - name: app
    image: my-app:latest
    env:
    - name: USER_DATA_BUCKET_LOCATION
      valueFrom:
        configMapKeyRef:
          name: application-user-data-cm
          key: "default.export-user-data-bucket"
```

## Exporting to Secrets

For sensitive values, export to a Secret instead:

```yaml
apiVersion: services.k8s.aws/v1alpha1
kind: FieldExport
metadata:
  name: export-db-password
spec:
  from:
    path: ".status.masterUserSecret.secretString"
    resource:
      group: rds.services.k8s.aws
      kind: DBInstance
      name: my-database
  to:
    name: db-credentials
    kind: secret
```

## Security Considerations

`FieldExport` only exports fields from resources in the **same namespace** as the `FieldExport` resource. This prevents users from exporting fields from resources they don't have access to in other namespaces.

## Next Steps

- [Learn about kro](https://kro.run) - Resource orchestration for Kubernetes
- [Create resources](/guides/create-resource) - Learn about ACK resource lifecycle
- [API Reference](/services) - Find available fields for each resource type
