// Pulse 360 on Azure Container Apps, provisioned by `azd up`.
//
// Separate from ../main.bicep (a package-deployed App Service). This template
// runs the Docker image built from the repository Dockerfile.
targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the azd environment; used to derive resource names.')
param environmentName string

@minLength(1)
@description('Primary Azure region for all resources.')
param location string

@description('Principal ID of the person or pipeline running azd (azd sets AZURE_PRINCIPAL_ID). Granted Key Vault Secrets Officer so the post-provision hook can store Entra client secrets.')
param principalId string = ''

@description('Image built and pushed by `azd deploy` (azd sets SERVICE_WEB_IMAGE_NAME). Empty on the first provision.')
param webImageName string = ''

@secure()
@description('PostgreSQL administrator password. Generated once and kept in Key Vault by azd.')
param postgresAdminPassword string

@secure()
@description('NextAuth session secret. Generated once and kept in Key Vault by azd.')
param nextAuthSecret string

@secure()
@description('Bearer secret for /api/cron/sync-messages. Generated once and kept in Key Vault by azd.')
param cronSecret string

@description('Client ID of the Microsoft Graph (app-only) app registration. Set by the post-provision hook.')
param graphClientId string = ''

@description('"true" once the post-provision hook stores the Graph client secret in Key Vault. A string because azd substitutes environment values as strings.')
param graphCredentialsReady string = 'false'

@description('Client ID of the interactive sign-in app registration. Set by the post-provision hook.')
param signInClientId string = ''

@description('"true" once the post-provision hook stores the sign-in client secret in Key Vault.')
param signInCredentialsReady string = 'false'

@description('Value of MESSAGE_CENTER_PUBLIC. "false" keeps Message Center behind sign-in; "true" allows anonymous access; empty defers to whether sign-in is configured.')
param messageCenterPublic string = 'false'

@description('PostgreSQL compute SKU.')
param postgresSkuName string = 'Standard_B1ms'

@allowed([
  'Burstable'
  'GeneralPurpose'
  'MemoryOptimized'
])
param postgresSkuTier string = 'Burstable'

@description('Minimum replicas (integer as string). Keep at 1 or more so the scheduled Message Center sync reaches a running instance quickly.')
param minReplicas string = '1'

@description('Maximum replicas (integer as string).')
param maxReplicas string = '3'

var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = {
  'azd-env-name': environmentName
  application: 'Pulse360'
}

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  scope: rg
  params: {
    location: location
    tags: tags
    logAnalyticsName: 'log-${resourceToken}'
    appInsightsName: 'appi-${resourceToken}'
  }
}

module identity 'modules/identity.bicep' = {
  name: 'identity'
  scope: rg
  params: {
    location: location
    tags: tags
    name: 'id-${resourceToken}'
  }
}

module postgres 'modules/postgres.bicep' = {
  name: 'postgres'
  scope: rg
  params: {
    location: location
    tags: tags
    serverName: 'psql-${resourceToken}'
    administratorPassword: postgresAdminPassword
    skuName: postgresSkuName
    skuTier: postgresSkuTier
  }
}

module keyVault 'modules/keyvault.bicep' = {
  name: 'keyvault'
  scope: rg
  params: {
    location: location
    tags: tags
    name: 'kv-${resourceToken}'
    readerPrincipalId: identity.outputs.principalId
    deployerPrincipalId: principalId
    databaseUrl: 'postgresql://${postgres.outputs.administratorLogin}:${uriComponent(postgresAdminPassword)}@${postgres.outputs.fqdn}:5432/${postgres.outputs.databaseName}?sslmode=require'
    postgresAdminPassword: postgresAdminPassword
    nextAuthSecret: nextAuthSecret
    cronSecret: cronSecret
  }
}

module web 'modules/containerapp.bicep' = {
  name: 'web'
  scope: rg
  params: {
    location: location
    tags: tags
    registryName: 'cr${resourceToken}'
    environmentName: 'cae-${resourceToken}'
    appName: 'ca-${resourceToken}'
    logAnalyticsName: monitoring.outputs.logAnalyticsName
    identityId: identity.outputs.id
    identityPrincipalId: identity.outputs.principalId
    keyVaultUri: keyVault.outputs.uri
    imageName: webImageName
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    tenantId: tenant().tenantId
    graphClientId: graphClientId
    graphClientSecretConfigured: toLower(graphCredentialsReady) == 'true'
    signInClientId: signInClientId
    signInClientSecretConfigured: toLower(signInCredentialsReady) == 'true'
    messageCenterPublic: messageCenterPublic
    minReplicas: int(minReplicas)
    maxReplicas: int(maxReplicas)
  }
}

// Outputs become azd environment variables (and hook inputs).
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = rg.name
output AZURE_KEY_VAULT_NAME string = keyVault.outputs.name
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = web.outputs.registryEndpoint
output AZURE_CONTAINER_REGISTRY_NAME string = web.outputs.registryName
output AZURE_CONTAINER_ENVIRONMENT_NAME string = web.outputs.environmentName
output AZURE_USER_ASSIGNED_IDENTITY_ID string = identity.outputs.id
output SERVICE_WEB_NAME string = web.outputs.appName
output SERVICE_WEB_URI string = 'https://${web.outputs.fqdn}'
