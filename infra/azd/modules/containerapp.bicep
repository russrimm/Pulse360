@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

@description('Container registry name (alphanumeric).')
param registryName string

@description('Container Apps environment name.')
param environmentName string

@description('Container app name.')
param appName string

@description('Log Analytics workspace name used for container logs.')
param logAnalyticsName string

@description('User-assigned managed identity resource ID (ACR pull and Key Vault secret access).')
param identityId string

@description('Principal ID of that identity.')
param identityPrincipalId string

@description('Key Vault URI, for example https://kv-x.vault.azure.net/.')
param keyVaultUri string

@description('Full image name. Empty on the first provision, when azd has not built an image yet.')
param imageName string = ''

@description('Application Insights connection string.')
param appInsightsConnectionString string

@description('Directory (tenant) ID used for Microsoft Graph and sign-in.')
param tenantId string

@description('Client ID of the Microsoft Graph (app-only) app registration. Empty disables Graph credentials.')
param graphClientId string = ''

@description('True once the post-provision hook stored `azure-client-secret` in Key Vault.')
param graphClientSecretConfigured bool = false

@description('Client ID of the interactive sign-in app registration. Empty disables sign-in.')
param signInClientId string = ''

@description('True once the post-provision hook stored `auth-azure-ad-client-secret` in Key Vault.')
param signInClientSecretConfigured bool = false

@description('Value of MESSAGE_CENTER_PUBLIC: "true", "false", or empty to defer to whether sign-in is configured.')
param messageCenterPublic string = 'false'

@minValue(0)
param minReplicas int = 1

@minValue(1)
param maxReplicas int = 3

@description('CPU cores per replica.')
param cpu string = '0.5'

@description('Memory per replica.')
param memory string = '1Gi'

var containerPort = 3000
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var placeholderImage = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
var hasGraphCredentials = !empty(graphClientId) && graphClientSecretConfigured
var hasSignIn = !empty(signInClientId) && signInClientSecretConfigured
var vaultBase = endsWith(keyVaultUri, '/') ? keyVaultUri : '${keyVaultUri}/'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsName
}

resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: registry
  name: guid(registry.id, identityPrincipalId, acrPullRoleId)
  properties: {
    principalId: identityPrincipalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
  }
}

resource environment 'Microsoft.App/managedEnvironments@2025-01-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

var baseSecrets = [
  {
    name: 'database-url'
    keyVaultUrl: '${vaultBase}secrets/database-url'
    identity: identityId
  }
  {
    name: 'nextauth-secret'
    keyVaultUrl: '${vaultBase}secrets/nextauth-secret'
    identity: identityId
  }
  {
    name: 'cron-secret'
    keyVaultUrl: '${vaultBase}secrets/cron-secret'
    identity: identityId
  }
]

var graphSecrets = hasGraphCredentials
  ? [
      {
        name: 'azure-client-secret'
        keyVaultUrl: '${vaultBase}secrets/azure-client-secret'
        identity: identityId
      }
    ]
  : []

var signInSecrets = hasSignIn
  ? [
      {
        name: 'auth-azure-ad-client-secret'
        keyVaultUrl: '${vaultBase}secrets/auth-azure-ad-client-secret'
        identity: identityId
      }
    ]
  : []

// The default hostname is deterministic, so NEXTAUTH_URL needs no second pass.
var appFqdn = '${appName}.${environment.properties.defaultDomain}'

var baseEnv = [
  { name: 'NODE_ENV', value: 'production' }
  { name: 'PORT', value: string(containerPort) }
  { name: 'HOSTNAME', value: '0.0.0.0' }
  { name: 'DATABASE_URL', secretRef: 'database-url' }
  { name: 'NEXTAUTH_URL', value: 'https://${appFqdn}' }
  { name: 'NEXTAUTH_SECRET', secretRef: 'nextauth-secret' }
  { name: 'CRON_SECRET', secretRef: 'cron-secret' }
  { name: 'AZURE_TENANT_ID', value: tenantId }
  { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
]

var messageCenterEnv = empty(messageCenterPublic)
  ? []
  : [
      { name: 'MESSAGE_CENTER_PUBLIC', value: messageCenterPublic }
    ]

var graphEnv = hasGraphCredentials
  ? [
      { name: 'AZURE_CLIENT_ID', value: graphClientId }
      { name: 'AZURE_CLIENT_SECRET', secretRef: 'azure-client-secret' }
    ]
  : []

var signInEnv = hasSignIn
  ? [
      { name: 'AUTH_AZURE_AD_CLIENT_ID', value: signInClientId }
      { name: 'AUTH_AZURE_AD_TENANT_ID', value: tenantId }
      { name: 'AUTH_AZURE_AD_CLIENT_SECRET', secretRef: 'auth-azure-ad-client-secret' }
    ]
  : []

resource app 'Microsoft.App/containerApps@2025-01-01' = {
  name: appName
  location: location
  // azd locates the deploy target through this tag.
  tags: union(tags, { 'azd-service-name': 'web' })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: containerPort
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: registry.properties.loginServer
          identity: identityId
        }
      ]
      secrets: concat(baseSecrets, graphSecrets, signInSecrets)
    }
    template: {
      containers: [
        {
          name: 'web'
          image: empty(imageName) ? placeholderImage : imageName
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: concat(baseEnv, messageCenterEnv, graphEnv, signInEnv)
          probes: [
            {
              type: 'Startup'
              httpGet: {
                path: '/api/health'
                port: containerPort
              }
              initialDelaySeconds: 5
              periodSeconds: 5
              failureThreshold: 60
            }
            {
              // Generous thresholds: the endpoint reports 503 when the
              // database is unreachable, which should not cause restart loops.
              type: 'Liveness'
              httpGet: {
                path: '/api/health'
                port: containerPort
              }
              periodSeconds: 30
              timeoutSeconds: 5
              failureThreshold: 10
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
  dependsOn: [
    acrPull
  ]
}

output appName string = app.name
output fqdn string = appFqdn
output registryEndpoint string = registry.properties.loginServer
output registryName string = registry.name
output environmentName string = environment.name
