@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

@description('Globally unique PostgreSQL Flexible Server name.')
param serverName string

@description('Administrator login name.')
param administratorLogin string = 'pulse360admin'

@secure()
@description('Administrator password. Stored in Key Vault by the caller.')
param administratorPassword string

@description('Application database name.')
param databaseName string = 'pulse360'

@description('Compute SKU name, for example Standard_B1ms (Burstable).')
param skuName string = 'Standard_B1ms'

@allowed([
  'Burstable'
  'GeneralPurpose'
  'MemoryOptimized'
])
@description('Compute tier matching skuName.')
param skuTier string = 'Burstable'

@description('Storage size in GiB.')
param storageSizeGB int = 32

@allowed([
  '16'
  '17'
])
param postgresVersion string = '17'

@description('Allow connections from Azure services (firewall rule 0.0.0.0). Required for Container Apps without a VNet; replace with private networking for stricter isolation.')
param allowAzureServices bool = true

resource server 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: serverName
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    version: postgresVersion
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
    storage: {
      storageSizeGB: storageSizeGB
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: server
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Flexible Server rejects concurrent child-resource operations, so serialize.
resource allowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2024-08-01' = if (allowAzureServices) {
  parent: server
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
  dependsOn: [
    database
  ]
}

output fqdn string = server.properties.fullyQualifiedDomainName
output databaseName string = database.name
output administratorLogin string = administratorLogin
