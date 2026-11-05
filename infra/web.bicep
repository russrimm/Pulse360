@description('Azure region for hosting.')
param location string

@description('Globally unique web app name.')
param appName string

@description('Dedicated hosting plan name.')
param planName string

resource plan 'Microsoft.Web/serverfarms@2026-08-01' = {
  name: planName
  location: location
  kind: 'linux'
  tags: {
    application: 'Pulse360'
  }
  sku: {
    name: 'B1'
    tier: 'Basic'
    capacity: 1
  }
  properties: {
    reserved: true
  }
}

resource web 'Microsoft.Web/sites@2026-08-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  tags: {
    application: 'Pulse360'
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|24-lts'
      // Preserve pnpm and Turbopack symlinks on the container's local filesystem.
      appCommandLine: 'mkdir -p /tmp/pulse360 && tar -xzf /home/site/wwwroot/application.tar.gz -C /tmp/pulse360 && cd /tmp/pulse360 && node server.js'
      alwaysOn: true
      healthCheckPath: '/api/health'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'HOSTNAME'
          value: '0.0.0.0'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }
        // No source-tenant credentials are needed for public feeds.
        {
          name: 'MESSAGE_CENTER_PUBLIC'
          value: 'false'
        }
      ]
    }
  }
}

resource scmPolicy 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2026-08-01' = {
  parent: web
  name: 'scm'
  properties: {
    allow: false
  }
}

resource ftpPolicy 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2026-08-01' = {
  parent: web
  name: 'ftp'
  properties: {
    allow: false
  }
}

output appName string = web.name
output appUrl string = 'https://${web.properties.defaultHostName}'
