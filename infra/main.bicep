targetScope = 'subscription'

@description('Azure region for the dedicated Pulse360 deployment.')
param location string = 'centralus'

@description('Resource group containing only this deployment.')
param resourceGroupName string = 'rg-pulse360'

var suffix = uniqueString(subscription().id, resourceGroupName)

resource resourceGroup 'Microsoft.Resources/resourceGroups@2025-04-01' = {
  name: resourceGroupName
  location: location
  tags: {
    application: 'Pulse360'
  }
}

module hosting './web.bicep' = {
  name: 'pulse360-hosting'
  scope: resourceGroup
  params: {
    location: location
    appName: 'pulse360-${suffix}'
    planName: 'asp-pulse360-${suffix}'
  }
}

output appName string = hosting.outputs.appName
output appUrl string = hosting.outputs.appUrl
output resourceGroupName string = resourceGroup.name
