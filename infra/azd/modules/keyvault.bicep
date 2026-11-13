@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

@description('Key Vault name.')
param name string

@description('Principal ID of the app identity that reads secrets (Key Vault Secrets User).')
param readerPrincipalId string

@description('Principal ID of the person or pipeline running azd (Key Vault Secrets Officer). Lets the post-provision hook store Entra client secrets. Leave empty to skip.')
param deployerPrincipalId string = ''

@secure()
param databaseUrl string

@secure()
@description('Stored so azd (secretOrRandomPassword) reuses it on every provision instead of rotating it.')
param postgresAdminPassword string

@secure()
param nextAuthSecret string

@secure()
param cronSecret string

var keyVaultSecretsUserRoleId = '4633458b-17de-48b2-acb3-3a14e3f9e1ae'
var keyVaultSecretsOfficerRoleId = 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7'

resource vault 'Microsoft.KeyVault/vaults@2024-11-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    tenantId: tenant().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled'
  }
}

resource readerAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: vault
  name: guid(vault.id, readerPrincipalId, keyVaultSecretsUserRoleId)
  properties: {
    principalId: readerPrincipalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
  }
}

resource deployerAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(deployerPrincipalId)) {
  scope: vault
  name: guid(vault.id, deployerPrincipalId, keyVaultSecretsOfficerRoleId)
  properties: {
    principalId: deployerPrincipalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsOfficerRoleId)
  }
}

resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2024-11-01' = {
  parent: vault
  name: 'database-url'
  properties: {
    value: databaseUrl
  }
}

resource postgresPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2024-11-01' = {
  parent: vault
  name: 'postgres-admin-password'
  properties: {
    value: postgresAdminPassword
  }
}

resource nextAuthSecretResource 'Microsoft.KeyVault/vaults/secrets@2024-11-01' = {
  parent: vault
  name: 'nextauth-secret'
  properties: {
    value: nextAuthSecret
  }
}

resource cronSecretResource 'Microsoft.KeyVault/vaults/secrets@2024-11-01' = {
  parent: vault
  name: 'cron-secret'
  properties: {
    value: cronSecret
  }
}

output name string = vault.name
output uri string = vault.properties.vaultUri
output readerAssignmentId string = readerAssignment.id
