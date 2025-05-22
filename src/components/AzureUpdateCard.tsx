'use client';

import { AzureUpdate } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

interface AzureUpdateCardProps {
  update: AzureUpdate;
  onClick: (id: string) => void;
}

// Helper function to get icon path for a product
export function getProductIcon(product: string): string | null {
  // Common mappings for special cases
  const specialMappings: { [key: string]: string } = {
    'entra': '/icons/entra.svg',
    'intune': '/icons/intune.svg',
    'purview': '/icons/purview.svg',
    'defender': '/icons/defender.svg',
    'sharepoint': '/icons/sharepoint.svg',
    'teams': '/icons/teams.svg',
    'viva': '/icons/viva.svg',
    'exchange': '/icons/exchange.svg',
    'forms': '/icons/forms.svg',
    'onedrive': '/icons/onedrive.svg',
    'planner': '/icons/planner.svg',
    'stream': '/icons/stream.svg',
    'windows': '/icons/Windows.svg',
    'visual studio': '/icons/azure/devops/VisualStudio.svg',
    'visual studio code': '/icons/azure/devops/VisualStudioCode.svg',
    'vs code': '/icons/azure/devops/VisualStudioCode.svg',
  };

  // Check for special mappings first
  for (const [key, path] of Object.entries(specialMappings)) {
    if (product.toLowerCase().includes(key)) {
      return path;
    }
  }

  // Azure service mappings with exact icon filenames
  const azureMappings: Record<string, string> = {
    // Integration
    'api management': '/icons/azure/integration/10042-icon-service-API-Management-Services.svg',
    'logic apps': '/icons/azure/integration/02631-icon-service-Logic-Apps.svg',
    'azure logic apps': '/icons/azure/integration/02631-icon-service-Logic-Apps.svg',
    'azure signalr service': '/icons/azure/integration/10052-icon-service-SignalR.svg',
    'signalr': '/icons/azure/integration/10052-icon-service-SignalR.svg',

    // Networking
    'azure front door': '/icons/azure/networking/10073-icon-service-Front-Door-and-CDN-Profiles.svg',
    'front door': '/icons/azure/networking/10073-icon-service-Front-Door-and-CDN-Profiles.svg',
    'azure expressroute': '/icons/azure/networking/10079-icon-service-ExpressRoute-Circuits.svg',
    'expressroute': '/icons/azure/networking/10079-icon-service-ExpressRoute-Circuits.svg',
    'virtual network': '/icons/azure/networking/10061-icon-service-Virtual-Networks.svg',
    'virtual networks': '/icons/azure/networking/10061-icon-service-Virtual-Networks.svg',
    'load balancer': '/icons/azure/networking/10062-icon-service-Load-Balancers.svg',
    'load balancers': '/icons/azure/networking/10062-icon-service-Load-Balancers.svg',
    'azure firewall': '/icons/azure/networking/10084-icon-service-Firewalls.svg',
    'firewall': '/icons/azure/networking/10084-icon-service-Firewalls.svg',
    'network watcher': '/icons/azure/networking/10066-icon-service-Network-Watcher.svg',
    'azure network watcher': '/icons/azure/networking/10066-icon-service-Network-Watcher.svg',

    // Databases
    'cosmos db': '/icons/azure/databases/10121-icon-service-Azure-Cosmos-DB.svg',
    'mysql': '/icons/azure/databases/10122-icon-service-Azure-Database-MySQL-Server.svg',
    'mariadb': '/icons/azure/databases/10123-icon-service-Azure-Database-MariaDB-Server.svg',
    'sql': '/icons/azure/databases/10130-icon-service-SQL-Database.svg',
    'postgresql': '/icons/azure/databases/10131-icon-service-Azure-Database-PostgreSQL-Server.svg',
    'sql server': '/icons/azure/databases/10132-icon-service-SQL-Server.svg',
    'database migration': '/icons/azure/databases/10133-icon-service-Azure-Database-Migration-Services.svg',
    'sql elastic pools': '/icons/azure/databases/10134-icon-service-SQL-Elastic-Pools.svg',
    'managed database': '/icons/azure/databases/10135-icon-service-Managed-Database.svg',
    'sql managed instance': '/icons/azure/databases/10136-icon-service-SQL-Managed-Instance.svg',
    'azure cache for redis': '/icons/azure/databases/10137-icon-service-Cache-Redis.svg',
    'redis cache': '/icons/azure/databases/10137-icon-service-Cache-Redis.svg',
    'data explorer': '/icons/azure/databases/10145-icon-service-Azure-Data-Explorer-Clusters.svg',
    'oracle database': '/icons/azure/databases/03490-icon-service-Oracle-Database.svg',
    'synapse analytics': '/icons/azure/databases/00606-icon-service-Azure-Synapse-Analytics.svg',

    // AI + Machine Learning
    'machine learning': '/icons/azure/ai + machine learning/10166-icon-service-Machine-Learning.svg',
    'cognitive services': '/icons/azure/ai + machine learning/10162-icon-service-Cognitive-Services.svg',
    'openai': '/icons/azure/ai + machine learning/03438-icon-service-Azure-OpenAI.svg',
    'ai studio': '/icons/azure/ai + machine learning/03513-icon-service-AI-Studio.svg',
    'cognitive search': '/icons/azure/ai + machine learning/10044-icon-service-Cognitive-Search.svg',
    'bot service': '/icons/azure/ai + machine learning/10165-icon-service-Bot-Services.svg',
    'content safety': '/icons/azure/ai + machine learning/03390-icon-service-Content-Safety.svg',
    'language': '/icons/azure/ai + machine learning/02876-icon-service-Language.svg',
    'anomaly detector': '/icons/azure/ai + machine learning/00814-icon-service-Anomaly-Detector.svg',
    'form recognizer': '/icons/azure/ai + machine learning/00819-icon-service-Form-Recognizers.svg',
    'speech services': '/icons/azure/ai + machine learning/00797-icon-service-Speech-Services.svg',
    'translator': '/icons/azure/ai + machine learning/00800-icon-service-Translator-Text.svg',
    'language understanding': '/icons/azure/ai + machine learning/00801-icon-service-Language-Understanding.svg',
    'computer vision': '/icons/azure/ai + machine learning/00792-icon-service-Computer-Vision.svg',
    'custom vision': '/icons/azure/ai + machine learning/00793-icon-service-Custom-Vision.svg',
    'face api': '/icons/azure/ai + machine learning/00794-icon-service-Face-APIs.svg',
    'content moderator': '/icons/azure/ai + machine learning/00795-icon-service-Content-Moderators.svg',

    // Compute
    'virtual machine': '/icons/azure/compute/10021-icon-service-Virtual-Machine.svg',
    'kubernetes': '/icons/azure/compute/10023-icon-service-Kubernetes-Services.svg',
    'mesh applications': '/icons/azure/compute/10024-icon-service-Mesh-Applications.svg',
    'availability sets': '/icons/azure/compute/10025-icon-service-Availability-Sets.svg',
    'disks snapshots': '/icons/azure/compute/10026-icon-service-Disks-Snapshots.svg',
    'azure functions': '/icons/azure/compute/10029-icon-service-Function-Apps.svg',
    'function apps': '/icons/azure/compute/10029-icon-service-Function-Apps.svg',
    'batch accounts': '/icons/azure/compute/10031-icon-service-Batch-Accounts.svg',
    'disks': '/icons/azure/compute/10032-icon-service-Disks.svg',
    'images': '/icons/azure/compute/10033-icon-service-Images.svg',
    'vm scale sets': '/icons/azure/compute/10034-icon-service-VM-Scale-Sets.svg',
    'app service': '/icons/azure/compute/10035-icon-service-App-Services.svg',
    'service fabric': '/icons/azure/compute/10036-icon-service-Service-Fabric-Clusters.svg',
    'shared image galleries': '/icons/azure/compute/10039-icon-service-Shared-Image-Galleries.svg',
    'spring apps': '/icons/azure/compute/10370-icon-service-Azure-Spring-Apps.svg',
    'compute galleries': '/icons/azure/compute/02864-icon-service-Azure-Compute-Galleries.svg',
    'compute fleet': '/icons/azure/compute/03487-icon-service-Compute-Fleet.svg',
    'aks automatic': '/icons/azure/compute/03543-icon-service-AKS-Automatic.svg',

    // Security
    'sentinel': '/icons/azure/security/10248-icon-service-Azure-Sentinel.svg',
    'key vault': '/icons/azure/security/10245-icon-service-Key-Vaults.svg',
    'defender for cloud': '/icons/azure/security/10241-icon-service-Microsoft-Defender-for-Cloud.svg',
    'defender for iot': '/icons/azure/security/02247-icon-service-Microsoft-Defender-for-IoT.svg',
    'defender easm': '/icons/azure/security/03336-icon-service-Microsoft-Defender-EASM.svg',
    'information protection': '/icons/azure/security/10229-icon-service-Azure-Information-Protection.svg',
    'conditional access': '/icons/azure/security/10233-icon-service-Conditional-Access.svg',
    'multifactor authentication': '/icons/azure/security/03344-icon-service-Multifactor-Authentication.svg',
    'identity secure score': '/icons/azure/security/03340-icon-service-Identity-Secure-Score.svg',
    'risky signins': '/icons/azure/security/03341-icon-service-Entra-Identity-Risky-Signins.svg',
    'risky users': '/icons/azure/security/03342-icon-service-Entra-Identity-Risky-Users.svg',
    'application security groups': '/icons/azure/security/10244-icon-service-Application-Security-Groups.svg',
    'extended security updates': '/icons/azure/security/10572-icon-service-ExtendedSecurityUpdates.svg',
    'azure dedicated hsm': '/icons/azure/other/02322-icon-service-Dedicated-HSM.svg',
    'dedicated hsm': '/icons/azure/other/02322-icon-service-Dedicated-HSM.svg',

    // Storage
    'storage account': '/icons/azure/storage/10086-icon-service-Storage-Accounts.svg',
    'storage accounts': '/icons/azure/storage/10086-icon-service-Storage-Accounts.svg',
    'archive storage': '/icons/azure/storage/10086-icon-service-Storage-Accounts.svg',
    'azure files': '/icons/azure/storage/10400-icon-service-Azure-Fileshares.svg',
    'data lake': '/icons/azure/storage/10090-icon-service-Data-Lake-Storage-Gen1.svg',
    'netapp files': '/icons/azure/storage/10096-icon-service-Azure-NetApp-Files.svg',
    'data box': '/icons/azure/storage/10094-icon-service-Data-Box.svg',
    'data shares': '/icons/azure/storage/10098-icon-service-Data-Shares.svg',
    'import export': '/icons/azure/storage/10100-icon-service-Import-Export-Jobs.svg',
    'storage explorer': '/icons/azure/storage/10091-icon-service-Storage-Explorer.svg',
    'storsimple': '/icons/azure/storage/10089-icon-service-StorSimple-Device-Managers.svg',
    'storage sync': '/icons/azure/storage/10093-icon-service-Storage-Sync-Services.svg',
    'data share invitations': '/icons/azure/storage/10097-icon-service-Data-Share-Invitations.svg',
    'managed file shares': '/icons/azure/storage/03549-icon-service-Managed-File-Shares.svg',
    'hcp cache': '/icons/azure/storage/00776-icon-service-Azure-HCP-Cache.svg',
    'storage actions': '/icons/azure/storage/03502-icon-service-Storage-Actions.svg',
    'recovery services vaults': '/icons/azure/storage/00017-icon-service-Recovery-Services-Vaults.svg',
    'databox gateway': '/icons/azure/storage/00691-icon-service-Azure-Databox-Gateway.svg',
    'azure stack edge': '/icons/azure/storage/10095-icon-service-Azure-Stack-Edge.svg',
    'stack edge': '/icons/azure/storage/10095-icon-service-Azure-Stack-Edge.svg',
    'azure container storage': '/icons/azure/storage/10839-icon-service-Storage-Container.svg',
    'container storage': '/icons/azure/storage/10839-icon-service-Storage-Container.svg',

    // Containers
    'container registry': '/icons/azure/containers/10105-icon-service-Container-Registries.svg',
    'azure container apps': '/icons/azure/containers/10104-icon-service-Container-Instances.svg',
    'container instances': '/icons/azure/containers/10104-icon-service-Container-Instances.svg',
    'red hat openshift': '/icons/azure/containers/03331-icon-service-Azure-Red-Hat-OpenShift.svg',

    // Monitor
    'monitor': '/icons/azure/monitor/00001-icon-service-Monitor.svg',
    'application insights': '/icons/azure/monitor/00012-icon-service-Application-Insights.svg',
    'log analytics': '/icons/azure/monitor/00009-icon-service-Log-Analytics-Workspaces.svg',
    'activity log': '/icons/azure/monitor/00007-icon-service-Activity-Log.svg',

    // Chaos Engineering
    'azure chaos studio': '/icons/azure/management + governance/02223-icon-service-Azure-Chaos-Studio.svg',
    'chaos studio': '/icons/azure/management + governance/02223-icon-service-Azure-Chaos-Studio.svg',

    // Management
    'azure portal': '/icons/azure/management/10002-icon-service-Azure-Portal.svg',
    'resource groups': '/icons/azure/management/10003-icon-service-Resource-Groups.svg',
    'resource group': '/icons/azure/management/10003-icon-service-Resource-Groups.svg',
    'azure resource graph': '/icons/azure/management + governance/10318-icon-service-Resource-Graph-Explorer.svg',
    'resource graph': '/icons/azure/management + governance/10318-icon-service-Resource-Graph-Explorer.svg',
    'azure managed applications': '/icons/azure/management + governance/10313-icon-service-Managed-Applications-Center.svg',
    'managed applications': '/icons/azure/management + governance/10313-icon-service-Managed-Applications-Center.svg',
    'azure blueprints': '/icons/azure/management + governance/00006-icon-service-Blueprints.svg',
    'blueprints': '/icons/azure/management + governance/00006-icon-service-Blueprints.svg',
    'microsoft cost management': '/icons/azure/management + governance/00004-icon-service-Cost-Management-and-Billing.svg',
    'cost management': '/icons/azure/management + governance/00004-icon-service-Cost-Management-and-Billing.svg',
    'cloud shell': '/icons/azure/other/00559-icon-service-Azure-Cloud-Shell.svg',
    'azure cloud shell': '/icons/azure/other/00559-icon-service-Azure-Cloud-Shell.svg',
    'Microsoft OneDrive': '/icons/onedrive.svg',
  };

  // Check for Azure service mappings
  const productLower = product.toLowerCase();
  for (const [key, path] of Object.entries(azureMappings)) {
    if (productLower.includes(key)) {
      return path;
    }
  }

  return null;
}

export function AzureUpdateCard({ update, onClick }: AzureUpdateCardProps) {
  const handleClick = () => {
    onClick(update.id);
  };

  return (
    <Link href={`/azure-update/${update.id}`}>
      <div 
        className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-1 h-full cursor-pointer flex flex-col"
        onClick={handleClick}
      >
        <div className="p-6 pb-2">
          <div className="flex flex-wrap gap-2 mb-3">
            {update.products.map((product) => {
              const iconPath = getProductIcon(product);
              return (
                <span
                  key={product}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap shrink-0 bg-gray-50/90 text-gray-700 dark:bg-gray-800/20 dark:text-gray-200 border border-gray-200/30 dark:border-gray-700/20 group-hover:bg-primary-50/50 dark:group-hover:bg-primary-900/20 group-hover:border-primary-200/50 dark:group-hover:border-primary-800/50 transition-colors"
                >
                  {iconPath && (
                    <Image
                      src={iconPath}
                      alt=""
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                  )}
                  {product}
                </span>
              );
            })}
          </div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors tracking-tight">{update.title}</h3>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400 gap-1.5 px-6">
            <span className="font-medium">Created</span>
            <span>{format(new Date(update.created), 'MMM d, yyyy')}</span>
            {format(new Date(update.created), 'MMM d, yyyy') !== format(new Date(update.modified), 'MMM d, yyyy') && (
              <>
                <span>•</span>
                <span className="font-medium">Last Modified</span>
                <span>{format(new Date(update.modified), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
        </div>
        <div className="p-6 pt-2 flex flex-col flex-grow">
          <div className="flex flex-col flex-grow justify-end">
            <div className="mt-2 text-sm prose dark:prose-invert max-w-none [&_*]:!text-gray-600 [&_*]:dark:!text-gray-300 [&_a]:!text-primary-600 [&_a]:dark:!text-primary-400 [&_a]:!no-underline [&_a:hover]:!text-primary-700 [&_a:hover]:dark:!text-primary-300 [&_strong]:!text-gray-900 [&_strong]:dark:!text-white [&_h1]:!text-gray-900 [&_h1]:dark:!text-white [&_h2]:!text-gray-900 [&_h2]:dark:!text-white [&_h3]:!text-gray-900 [&_h3]:dark:!text-white [&_h4]:!text-gray-900 [&_h4]:dark:!text-white [&_h5]:!text-gray-900 [&_h5]:dark:!text-white [&_h6]:!text-gray-900 [&_h6]:dark:!text-white [&_code]:!text-gray-900 [&_code]:dark:!text-gray-100 [&_code]:!bg-gray-100 [&_code]:dark:!bg-gray-800 [&_pre]:!text-gray-900 [&_pre]:dark:!text-gray-100 [&_pre]:!bg-gray-100 [&_pre]:dark:!bg-gray-800 [&_p]:!text-gray-600 [&_p]:dark:!text-gray-300 [&_ul]:!text-gray-600 [&_ul]:dark:!text-gray-300 [&_ol]:!text-gray-600 [&_ol]:dark:!text-gray-300 [&_li]:!text-gray-600 [&_li]:dark:!text-gray-300 [&_blockquote]:!text-gray-600 [&_blockquote]:dark:!text-gray-300 [&_blockquote]:!border-gray-200 [&_blockquote]:dark:!border-gray-700 [&_*]:!bg-transparent [&_*]:dark:!bg-transparent">
              <div className="line-clamp-3" dangerouslySetInnerHTML={{ __html: update.description }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 