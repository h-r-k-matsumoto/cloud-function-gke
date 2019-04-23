# Cloud Functions for GKE

This is an example of calling Kubernetes(GKE) API from [Cloud Functions](https://cloud.google.com/functions/).

This example used [Javascript Kubernetes Client](https://github.com/kubernetes-client/javascript)
- https://github.com/kubernetes-client/javascript
- https://kubernetes.io/docs/reference/using-api/client-libraries/

# Feature

- Display a list of pods in the default namespace.

# Points

## Cloud Function probably doesn't support cloud_auth.

[cloud_auth.ts](https://github.com/kubernetes-client/javascript/blob/master/src/cloud_auth.ts) is used `gcloud` .It is not available on Cloud Functions.

I responded as follows.
**Do not define authProvider** . Because CloudAuth is executed, it will be an error.

```
    users: [
      {
        name: env.k8s.clusterFullName,
        user: {
          token: token,
        }
      }
    ]
```

`user.token` : Google API Authentication token.<br>
The token is obtained using the Google Auth Library.

```
async function getToken() {
  let authResult = await auth.getClient({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
  let accessToken = await authResult.getAccessToken().catch((err) => {
    throw err;
  })
  return accessToken.token
}
```

# Deploy

```
gcloud beta functions deploy kubefunc --entry-point ctl --trigger-http --project=${project-id} --env-vars-file .env.yaml --memory=128MB --runtime=nodejs8
```



