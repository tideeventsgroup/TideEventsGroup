import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as dbforpostgresql from "@pulumi/azure-native/dbforpostgresql";
import * as web from "@pulumi/azure-native/web";
import * as storage from "@pulumi/azure-native/storage";
import * as signalrservice from "@pulumi/azure-native/signalrservice";

const config = new pulumi.Config();
const location = config.get("location") ?? "westeurope";
const dbPassword = config.requireSecret("dbPassword");
const jwtSecret = config.requireSecret("jwtSecret");
const customDomain = config.get("customDomain");

const rg = new resources.ResourceGroup("tide-ims-rg", {
  resourceGroupName: "tide-ims",
  location,
  tags: { project: "tide-ims" },
});

// PostgreSQL Flexible Server
const pgServer = new dbforpostgresql.Server("tide-pg", {
  serverName: "tide-ims-pg",
  resourceGroupName: rg.name,
  location,
  sku: { name: "Standard_B1ms", tier: "Burstable" },
  storage: { storageSizeGB: 32 },
  backup: { backupRetentionDays: 7, geoRedundantBackup: "Disabled" },
  version: "16",
  administratorLogin: "tideadmin",
  administratorLoginPassword: dbPassword,
  highAvailability: { mode: "Disabled" },
  tags: { project: "tide-ims" },
});

const pgDb = new dbforpostgresql.Database("tide-db", {
  databaseName: "tideims",
  resourceGroupName: rg.name,
  serverName: pgServer.name,
  charset: "UTF8",
  collation: "en_US.utf8",
});

// Storage account for Functions
const sa = new storage.StorageAccount("tidefnsa", {
  resourceGroupName: rg.name,
  location,
  sku: { name: "Standard_LRS" },
  kind: "StorageV2",
});

const saKeys = storage.listStorageAccountKeysOutput({ resourceGroupName: rg.name, accountName: sa.name });
const storageConnectionString = pulumi.interpolate`DefaultEndpointsProtocol=https;AccountName=${sa.name};AccountKey=${saKeys.keys[0].value};EndpointSuffix=core.windows.net`;

// Web PubSub for realtime
const pubsub = new signalrservice.WebPubSub("tide-pubsub", {
  resourceName: "tide-ims-pubsub",
  resourceGroupName: rg.name,
  location,
  sku: { name: "Free_F1", tier: "Free", capacity: 1 },
  tags: { project: "tide-ims" },
});

const pubsubKeys = signalrservice.listWebPubSubKeysOutput({ resourceGroupName: rg.name, resourceName: pubsub.name });

// App Service Plan (Consumption Y1 for Functions)
const plan = new web.AppServicePlan("tide-fn-plan", {
  resourceGroupName: rg.name,
  location,
  name: "tide-ims-fn-plan",
  sku: { name: "Y1", tier: "Dynamic" },
  kind: "FunctionApp",
});

const dbConnectionString = pulumi.interpolate`postgresql://tideadmin:${dbPassword}@${pgServer.fullyQualifiedDomainName}/tideims?sslmode=require`;

// Function App
const fnApp = new web.WebApp("tide-fn", {
  name: "tide-ims-api",
  resourceGroupName: rg.name,
  location,
  kind: "FunctionApp",
  serverFarmId: plan.id,
  siteConfig: {
    appSettings: [
      { name: "AzureWebJobsStorage", value: storageConnectionString },
      { name: "FUNCTIONS_EXTENSION_VERSION", value: "~4" },
      { name: "FUNCTIONS_WORKER_RUNTIME", value: "node" },
      { name: "WEBSITE_NODE_DEFAULT_VERSION", value: "~20" },
      { name: "DATABASE_URL", value: dbConnectionString },
      { name: "JWT_SECRET", value: jwtSecret },
      { name: "WEBPUBSUB_CONNECTION_STRING", value: pubsubKeys.primaryConnectionString },
    ],
    cors: { allowedOrigins: ["*"] },
    nodeVersion: "~20",
  },
  httpsOnly: true,
  tags: { project: "tide-ims" },
});

// Static Web App
const swa = new web.StaticSite("tide-swa", {
  name: "tide-ims",
  resourceGroupName: rg.name,
  location,
  sku: { name: "Free", tier: "Free" },
  buildProperties: {
    appLocation: "/",
    outputLocation: "dist",
    appBuildCommand: "npm run build",
  },
  tags: { project: "tide-ims" },
});

if (customDomain) {
  new web.StaticSiteCustomDomain("tide-domain", {
    resourceGroupName: rg.name,
    name: swa.name,
    domainName: customDomain,
    validationMethod: "cname-delegation",
  });
}

export const resourceGroupName = rg.name;
export const staticWebAppHostname = swa.defaultHostname;
export const functionsAppName = fnApp.name;
export const postgresServerName = pgServer.name;
export const postgresConnectionString = pulumi.secret(dbConnectionString);
export const webPubSubConnectionString = pulumi.secret(pubsubKeys.primaryConnectionString);
