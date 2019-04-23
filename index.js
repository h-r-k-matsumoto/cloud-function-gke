const k8s = require('@kubernetes/client-node')
const container = require('@google-cloud/container')
const { auth } = require('google-auth-library')
const env = require("./env").env

function rejectError(e) { console.log(e); }

/**
 * クラスタ情報の取得.
 * ClusterManagerClientを呼び出して、GKEクラスタ情報を取得します。
 * 
 * @see https://cloud.google.com/nodejs/docs/reference/container/0.3.x/v1.ClusterManagerClient
 */
async function getCluster() {
  let clusterClient = new container.v1.ClusterManagerClient({})
  let request = {
    projectId: env.k8s.projectId,
    zone: env.k8s.zone,
    clusterId: env.k8s.clusterId
  }
  let responses = await clusterClient.getCluster(request)
  return responses[0]
}

/**
 * GCPトークン情報の取得。
 * @kubernetes/client-nodeにも、
 * 　https://github.com/kubernetes-client/javascript/blob/master/src/cloud_auth.ts
 * の実装があります。でも、これはCloud Functionsでは動きません。
 * 
 * @see https://github.com/kubernetes-client/java/issues/143
 * @see https://github.com/googleapis/google-auth-library-nodejs
 */
async function getToken() {
  let authResult = await auth.getClient({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
  let accessToken = await authResult.getAccessToken().catch((err) => {
    throw err;
  })
  return accessToken.token
}

/**
 * Kubernetes接続用のKubeConfigを取得します。
 * @param {*} cluster  https://cloud.google.com/nodejs/docs/reference/container/0.3.x/google.container.v1#.Cluster
 * @param {string} token 認証トークン
 */
async function getClient(cluster, token) {
  let kubeConfig = {
    apiVersion: "v1",
    kind: "Config",
    clusters: [
      {
        cluster: {
          skipTLSVerify: true,
          server: `https://${cluster.endpoint}`
        },
        name: env.k8s.clusterFullName
      }
    ],
    contexts: [
      {
        context: {
          cluster: env.k8s.clusterFullName,
          user: env.k8s.clusterFullName
        },
        name: env.k8s.clusterFullName
      }
    ],
    currentContext: env.k8s.clusterFullName,
    users: [
      {
        name: env.k8s.clusterFullName,
        user: {
          token: token,
          authProvider: {
            config: {
            }
          }
        }
      }
    ]
  }
  let kc = new k8s.KubeConfig();
  kc.loadFromOptions(kubeConfig);
  return kc
}

// https://github.com/kubernetes-client/javascript
async function podList() {
  let cluster = await getCluster().catch((e) => rejectError(e));
  let token = await getToken().catch((e) => rejectError(e));
  let kc = await getClient(cluster, token).catch((e) => rejectError(e));

  const k8sApi = kc.makeApiClient(k8s.Core_v1Api);

  k8sApi.listNamespacedPod('default').then((res) => {
    if (res.body.items) {
      var i = 0;
      res.body.items.forEach((item) => {
        i++;
        if (i < 5) {
          console.log(`pod =  name:${item.metadata.name} - status:${item.status.phase}`)
        }
      })
    } else {
      console.log("unknown response.");
      console.log(res);
    }
    console.log(`res.body.items`);
  }).catch((e) => rejectError(e));
}

exports.ctl = (req, res) => {
  podList();
  res.status(200).send();
}