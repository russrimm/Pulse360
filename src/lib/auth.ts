import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';

let graphClient: Client | null = null;

export async function getGraphClient() {
  try {
    if (graphClient) return graphClient;

    console.log('Creating new Graph client...');
    console.log('Environment variables:', {
      tenantId: process.env.NEXT_PUBLIC_TENANT_ID ? 'Set' : 'Not set',
      clientId: process.env.NEXT_PUBLIC_CLIENT_ID ? 'Set' : 'Not set',
      clientSecret: process.env.NEXT_PUBLIC_API_KEY ? 'Set' : 'Not set'
    });

    const credential = new ClientSecretCredential(
      process.env.NEXT_PUBLIC_TENANT_ID!,
      process.env.NEXT_PUBLIC_CLIENT_ID!,
      process.env.NEXT_PUBLIC_API_KEY!
    );

    console.log('Initializing Graph client with credential...');
    graphClient = Client.init({
      authProvider: async (done) => {
        try {
          console.log('Getting token...');
          const token = await credential.getToken(['https://graph.microsoft.com/.default']);
          console.log('Token received successfully');
          done(null, token.token);
        } catch (error) {
          console.error('Error getting token:', error);
          if (error instanceof Error) {
            console.error('Token error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
          }
          done(error as Error, null);
        }
      }
    });

    return graphClient;
  } catch (error) {
    console.error('Error in getGraphClient:', error);
    if (error instanceof Error) {
      console.error('Graph client error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    throw error;
  }
} 