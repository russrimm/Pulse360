<#
.SYNOPSIS
  Creates the Microsoft Entra app registrations Pulse 360 needs, as an azd
  post-provision hook or standalone.

.DESCRIPTION
  Creates (or reuses) two single-tenant app registrations:

    1. Graph reader   - app-only Microsoft Graph application permissions
                        (default: ServiceMessage.Read.All) for Message Center.
                        Becomes AZURE_CLIENT_ID / AZURE_CLIENT_SECRET.
    2. Sign-in        - interactive next-auth sign-in (redirect URI
                        <app>/api/auth/callback/azure-ad, delegated User.Read).
                        Becomes AUTH_AZURE_AD_CLIENT_ID / AUTH_AZURE_AD_CLIENT_SECRET.

  Graph permissions are data, not code. They come from scripts/graph-permissions.json
  plus the optional GRAPH_APPLICATION_PERMISSIONS (comma-separated names) and the
  -GraphPermissions parameter, and are resolved to app-role IDs against the live
  Microsoft Graph service principal. A feature that needs another permission only
  adds its name; this script does not change.

  Under azd (AZURE_KEY_VAULT_NAME is set) client secrets are written straight to
  Key Vault and never to the azd environment or the console. The hook then
  attaches them to the running container app, and records client IDs and
  *_CREDENTIALS_READY flags with `azd env set` so the next `azd provision`
  keeps the same configuration. Without azd, secrets are written to .env.local.

  Requires: Azure CLI signed in (az login) as someone who can create app
  registrations and, for admin consent, a Global Administrator, Privileged Role
  Administrator, or Cloud Application Administrator.

.PARAMETER GraphPermissions
  Extra Graph application permission names, for example ServiceHealth.Read.All.

.PARAMETER SkipSignIn
  Do not create the interactive sign-in app registration.

.PARAMETER RotateSecrets
  Issue new client secrets even when ones already exist in Key Vault.

.PARAMETER SecretDays
  Client secret lifetime in days. Default 180.

.EXAMPLE
  azd env set GRAPH_APPLICATION_PERMISSIONS "ServiceHealth.Read.All"
  azd hooks run postprovision
#>
[CmdletBinding()]
param(
  [string[]]$GraphPermissions = @(),
  [string]$GraphAppName = $(if ($env:GRAPH_APP_NAME) { $env:GRAPH_APP_NAME } else { 'Pulse 360 - Graph reader' }),
  [string]$SignInAppName = $(if ($env:SIGNIN_APP_NAME) { $env:SIGNIN_APP_NAME } else { 'Pulse 360 - Sign-in' }),
  [switch]$SkipSignIn = ($env:SKIP_SIGNIN -eq 'true'),
  [switch]$RotateSecrets,
  [int]$SecretDays = $(if ($env:SECRET_DAYS) { [int]$env:SECRET_DAYS } else { 180 })
)

$ErrorActionPreference = 'Stop'
$GraphResourceAppId = '00000003-0000-0000-c000-000000000000'
$DelegatedUserRead = 'e1fe6dd8-ba31-4d61-89e7-88639da4683d' # User.Read (Scope)
$GraphSecretName = 'azure-client-secret'
$SignInSecretName = 'auth-azure-ad-client-secret'

$keyVaultName = $env:AZURE_KEY_VAULT_NAME
$resourceGroup = $env:AZURE_RESOURCE_GROUP
$webAppName = $env:SERVICE_WEB_NAME
$webUri = if ($env:SERVICE_WEB_URI) { $env:SERVICE_WEB_URI.TrimEnd('/') } else { '' }
$identityId = $env:AZURE_USER_ASSIGNED_IDENTITY_ID
$isAzd = [bool]$keyVaultName

function Invoke-Az {
  # Runs az, returns stdout, and throws with the CLI message on failure.
  $output = & az @args --only-show-errors 2>&1
  if ($LASTEXITCODE -ne 0) { throw "az $($args -join ' ') failed: $output" }
  return $output
}

function Get-AzJson {
  $text = (Invoke-Az @args) -join "`n"
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
  return $text | ConvertFrom-Json
}

function Set-AzdEnv([string]$Name, [string]$Value) {
  if (Get-Command azd -ErrorAction SilentlyContinue) {
    & azd env set $Name $Value | Out-Null
  }
}

function Get-AzdEnvValue([string]$Name) {
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ($value) { return $value }
  return $null
}

function Get-PermissionNames {
  $names = [System.Collections.Generic.List[string]]::new()
  $file = Join-Path $PSScriptRoot 'graph-permissions.json'
  if (Test-Path $file) {
    $config = Get-Content $file -Raw | ConvertFrom-Json
    foreach ($entry in @($config.graphApplicationPermissions)) {
      if ($entry.name) { $names.Add([string]$entry.name) }
    }
  }
  if ($env:GRAPH_APPLICATION_PERMISSIONS) {
    foreach ($n in ($env:GRAPH_APPLICATION_PERMISSIONS -split '[,;\s]+')) {
      if ($n) { $names.Add($n) }
    }
  }
  foreach ($n in $GraphPermissions) { if ($n) { $names.Add($n) } }
  return @($names | Sort-Object -Unique)
}

function Ensure-App([string]$DisplayName, [string]$KnownClientId) {
  # Returns the application object (appId, id), creating it only when absent.
  $app = $null
  if ($KnownClientId) {
    try { $app = Get-AzJson ad app show --id $KnownClientId } catch { $app = $null }
  }
  if (-not $app) {
    $candidates = @(Get-AzJson ad app list --display-name $DisplayName | Where-Object { $_.displayName -eq $DisplayName })
    if ($candidates.Count -gt 1) {
      throw "More than one app registration is named '$DisplayName'. Set the client ID with azd env set GRAPH_CLIENT_ID / SIGNIN_CLIENT_ID."
    }
    if ($candidates.Count -eq 1) { $app = $candidates[0] }
  }
  if ($app) {
    Write-Host "  Reusing '$($app.displayName)' (appId $($app.appId))"
    return $app
  }
  $app = Get-AzJson ad app create --display-name $DisplayName --sign-in-audience AzureADMyOrg
  Write-Host "  Created '$DisplayName' (appId $($app.appId))"
  return $app
}

function Ensure-ServicePrincipal([string]$AppId) {
  $sp = @(Get-AzJson ad sp list --filter "appId eq '$AppId'")
  if ($sp.Count -gt 0) { return $sp[0] }
  return Get-AzJson ad sp create --id $AppId
}

function Test-KeyVaultSecret([string]$Name) {
  & az keyvault secret show --vault-name $keyVaultName --name $Name --query id -o tsv --only-show-errors 2>$null | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Set-KeyVaultSecret([string]$Name, [string]$Value) {
  # The value goes through a temporary file, not the process command line.
  $file = [System.IO.Path]::GetTempFileName()
  try {
    Set-Content -Path $file -Value $Value -NoNewline -Encoding utf8NoBOM
    # Role assignments for the deployer can take a few minutes to propagate.
    for ($attempt = 1; $attempt -le 12; $attempt++) {
      & az keyvault secret set --vault-name $keyVaultName --name $Name --file $file --encoding utf-8 --only-show-errors 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) { return }
      Write-Host "  Waiting for Key Vault access to propagate (attempt $attempt of 12)..." -ForegroundColor DarkGray
      Start-Sleep -Seconds 15
    }
    throw "Could not write secret '$Name' to Key Vault '$keyVaultName'. The signed-in identity needs the Key Vault Secrets Officer role."
  }
  finally {
    Remove-Item $file -Force -ErrorAction SilentlyContinue
  }
}

function New-ClientSecret([string]$AppId, [string]$Label) {
  $end = (Get-Date).AddDays($SecretDays).ToString('yyyy-MM-ddTHH:mm:ssZ')
  $credential = Get-AzJson ad app credential reset --id $AppId --append --display-name "$Label-$(Get-Date -Format 'yyyyMMdd')" --end-date $end
  return [string]$credential.password
}

function Write-LocalEnv([hashtable]$Values) {
  $path = Join-Path (Split-Path $PSScriptRoot -Parent) '.env.local'
  $lines = @()
  if (Test-Path $path) {
    $lines = @(Get-Content $path | Where-Object { $key = ($_ -split '=', 2)[0]; -not $Values.ContainsKey($key) })
  }
  foreach ($key in $Values.Keys) { $lines += "$key=$($Values[$key])" }
  Set-Content -Path $path -Value $lines -Encoding utf8NoBOM
  Write-Host "  Wrote $($Values.Keys -join ', ') to .env.local (gitignored)." -ForegroundColor Green
}

Write-Host ''
Write-Host '=== Pulse 360: Microsoft Entra app registrations ===' -ForegroundColor Cyan

$account = Get-AzJson account show
$tenantId = $account.tenantId
Write-Host "Tenant: $tenantId ($($account.name))"
Write-Host "Mode  : $(if ($isAzd) { "azd (Key Vault $keyVaultName)" } else { 'standalone (.env.local)' })"

# --- 1. Graph reader app ------------------------------------------------------
Write-Host ''
Write-Host "[1/3] Graph reader app: $GraphAppName" -ForegroundColor Yellow
$graphApp = Ensure-App $GraphAppName (Get-AzdEnvValue 'GRAPH_CLIENT_ID')
$graphSp = Ensure-ServicePrincipal $graphApp.appId

$permissionNames = Get-PermissionNames
Write-Host "  Permissions requested: $($permissionNames -join ', ')"
$graphRoles = Get-AzJson ad sp show --id $GraphResourceAppId --query "appRoles[?contains(allowedMemberTypes, 'Application')].{value:value,id:id}"
$resolved = @()
foreach ($name in $permissionNames) {
  $role = $graphRoles | Where-Object { $_.value -eq $name } | Select-Object -First 1
  if (-not $role) {
    Write-Warning "  '$name' is not a Microsoft Graph application permission; skipping."
    continue
  }
  $resolved += $role
  Invoke-Az ad app permission add --id $graphApp.appId --api $GraphResourceAppId --api-permissions "$($role.id)=Role" | Out-Null
  Write-Host "  + $name"
}

try {
  Invoke-Az ad app permission admin-consent --id $graphApp.appId | Out-Null
  Write-Host '  Admin consent granted.' -ForegroundColor Green
}
catch {
  Write-Warning '  Could not grant admin consent automatically (needs an admin role). Grant it in'
  Write-Warning "  Entra admin center > App registrations > $GraphAppName > API permissions > Grant admin consent."
}

$graphReady = $false
$graphSecretValue = $null
if ($isAzd -and -not $RotateSecrets -and (Test-KeyVaultSecret $GraphSecretName)) {
  Write-Host "  Client secret already in Key Vault ($GraphSecretName); use -RotateSecrets to replace it." -ForegroundColor DarkGray
  $graphReady = $true
}
else {
  $graphSecretValue = New-ClientSecret $graphApp.appId 'pulse360-graph'
  if ($isAzd) {
    Set-KeyVaultSecret $GraphSecretName $graphSecretValue
    $graphSecretValue = $null
    Write-Host "  Client secret stored in Key Vault ($GraphSecretName)." -ForegroundColor Green
    $graphReady = $true
  }
}

# --- 2. Sign-in app -----------------------------------------------------------
$signInApp = $null
$signInReady = $false
$signInSecretValue = $null
Write-Host ''
if ($SkipSignIn) {
  Write-Host '[2/3] Sign-in app: skipped (-SkipSignIn)' -ForegroundColor DarkGray
}
else {
  Write-Host "[2/3] Sign-in app: $SignInAppName" -ForegroundColor Yellow
  $signInApp = Ensure-App $SignInAppName (Get-AzdEnvValue 'SIGNIN_CLIENT_ID')
  [void](Ensure-ServicePrincipal $signInApp.appId)
  Invoke-Az ad app permission add --id $signInApp.appId --api $GraphResourceAppId --api-permissions "$DelegatedUserRead=Scope" | Out-Null

  $redirectUri = if ($webUri) { "$webUri/api/auth/callback/azure-ad" } else { 'http://localhost:3000/api/auth/callback/azure-ad' }
  $existingRedirects = @($signInApp.web.redirectUris | Where-Object { $_ })
  if ($redirectUri -notin $existingRedirects) {
    $redirects = @($existingRedirects + $redirectUri)
    Invoke-Az ad app update --id $signInApp.appId --web-redirect-uris @redirects | Out-Null
    Write-Host "  Redirect URI added: $redirectUri" -ForegroundColor Green
  }
  else {
    Write-Host "  Redirect URI already present: $redirectUri" -ForegroundColor DarkGray
  }

  if ($isAzd -and -not $RotateSecrets -and (Test-KeyVaultSecret $SignInSecretName)) {
    Write-Host "  Client secret already in Key Vault ($SignInSecretName)." -ForegroundColor DarkGray
    $signInReady = $true
  }
  else {
    $signInSecretValue = New-ClientSecret $signInApp.appId 'pulse360-signin'
    if ($isAzd) {
      Set-KeyVaultSecret $SignInSecretName $signInSecretValue
      $signInSecretValue = $null
      Write-Host "  Client secret stored in Key Vault ($SignInSecretName)." -ForegroundColor Green
      $signInReady = $true
    }
  }
}

# --- 3. Hand the configuration to the deployment ------------------------------
Write-Host ''
Write-Host '[3/3] Applying configuration' -ForegroundColor Yellow
if ($isAzd) {
  Set-AzdEnv 'GRAPH_CLIENT_ID' $graphApp.appId
  Set-AzdEnv 'GRAPH_CREDENTIALS_READY' ([string]$graphReady).ToLower()
  if ($signInApp) {
    Set-AzdEnv 'SIGNIN_CLIENT_ID' $signInApp.appId
    Set-AzdEnv 'SIGNIN_CREDENTIALS_READY' ([string]$signInReady).ToLower()
  }

  # Update the running app now so a first `azd up` ends fully configured. The
  # same values come from Bicep on every later `azd provision`.
  if ($webAppName -and $resourceGroup -and $identityId -and (Get-Command az -ErrorAction SilentlyContinue)) {
    try {
      Invoke-Az extension add --name containerapp --upgrade | Out-Null
      $vaultUri = ((Get-AzJson keyvault show --name $keyVaultName --query properties.vaultUri -o json)).TrimEnd('/')
      $secretArgs = @()
      $envArgs = @("AZURE_TENANT_ID=$tenantId")
      if ($graphReady) {
        $secretArgs += "$GraphSecretName=keyvaultref:$vaultUri/secrets/$GraphSecretName,identityref:$identityId"
        $envArgs += "AZURE_CLIENT_ID=$($graphApp.appId)", "AZURE_CLIENT_SECRET=secretref:$GraphSecretName"
      }
      if ($signInReady) {
        $secretArgs += "$SignInSecretName=keyvaultref:$vaultUri/secrets/$SignInSecretName,identityref:$identityId"
        $envArgs += "AUTH_AZURE_AD_CLIENT_ID=$($signInApp.appId)", "AUTH_AZURE_AD_TENANT_ID=$tenantId", "AUTH_AZURE_AD_CLIENT_SECRET=secretref:$SignInSecretName"
      }
      if ($secretArgs.Count -gt 0) {
        Invoke-Az containerapp secret set --name $webAppName --resource-group $resourceGroup --secrets @secretArgs | Out-Null
        Invoke-Az containerapp update --name $webAppName --resource-group $resourceGroup --set-env-vars @envArgs | Out-Null
        Write-Host '  Container app updated with the new credentials.' -ForegroundColor Green
      }
    }
    catch {
      Write-Warning "  Could not update the container app automatically: $_"
      Write-Warning '  Run `azd provision` to apply the stored credentials.'
    }
  }
}
else {
  $values = @{ AZURE_TENANT_ID = $tenantId; AZURE_CLIENT_ID = $graphApp.appId }
  if ($graphSecretValue) { $values['AZURE_CLIENT_SECRET'] = $graphSecretValue }
  if ($signInApp) {
    $values['AUTH_AZURE_AD_TENANT_ID'] = $tenantId
    $values['AUTH_AZURE_AD_CLIENT_ID'] = $signInApp.appId
    if ($signInSecretValue) { $values['AUTH_AZURE_AD_CLIENT_SECRET'] = $signInSecretValue }
    Write-Host '  Also set NEXTAUTH_URL and NEXTAUTH_SECRET (openssl rand -base64 32) in .env.local.' -ForegroundColor DarkGray
  }
  Write-LocalEnv $values
}

Write-Host ''
Write-Host '=== Done ===' -ForegroundColor Green
Write-Host "Graph reader client ID : $($graphApp.appId)"
if ($signInApp) { Write-Host "Sign-in client ID      : $($signInApp.appId)" }
Write-Host 'Message Center data can take up to an hour to appear after the first consent.' -ForegroundColor DarkGray
