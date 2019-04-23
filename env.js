const env = {
  version: process.env.VERSION || 'unset-version',
  k8s: {
    projectId: process.env.PROJECT_ID || 'projectId is unset.',
    zone: process.env.ZONE || 'zone is unset.',
    clusterId: process.env.CLUSTER_ID || 'clusterId is unset.',
    clusterFullName: process.env.CLUSTER_FULL_NAME || 'clusterFullName is unset.'
  }
}
exports.env = env;