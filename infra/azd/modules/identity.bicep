@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

@description('User-assigned managed identity name.')
param name string

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: name
  location: location
  tags: tags
}

output id string = identity.id
output principalId string = identity.properties.principalId
