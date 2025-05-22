import { NextResponse } from 'next/server';
import { getAzureHealthData } from '@/lib/azureHealth';

// Use Node.js runtime instead of Edge
export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('API route: Starting to fetch Azure health data...');
    console.log('Environment variables:', {
      hasTenantId: !!process.env.NEXT_PUBLIC_TENANT_ID,
      hasClientId: !!process.env.NEXT_PUBLIC_CLIENT_ID,
      hasApiKey: !!process.env.NEXT_PUBLIC_API_KEY
    });
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_TENANT_ID || !process.env.NEXT_PUBLIC_CLIENT_ID || !process.env.NEXT_PUBLIC_API_KEY) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { 
          error: 'Configuration error',
          details: 'Missing required Azure credentials',
          missingVars: {
            tenantId: !process.env.NEXT_PUBLIC_TENANT_ID,
            clientId: !process.env.NEXT_PUBLIC_CLIENT_ID,
            apiKey: !process.env.NEXT_PUBLIC_API_KEY
          }
        },
        { status: 500 }
      );
    }

    try {
      console.log('Calling getAzureHealthData...');
      const data = await getAzureHealthData();
      console.log('Raw data from Azure:', data);
      
      // Return empty array if no data
      if (!data) {
        console.log('No data returned from Azure API');
        return NextResponse.json([]);
      }

      // Ensure we're returning an array
      if (!Array.isArray(data)) {
        console.error('API route: Invalid data format received:', data);
        return NextResponse.json(
          { 
            error: 'Invalid data format',
            details: 'Expected array but got ' + typeof data,
            receivedData: data
          },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (innerError) {
      console.error('Error in getAzureHealthData:', innerError);
      return NextResponse.json(
        {
          error: 'Azure API error',
          details: innerError instanceof Error ? innerError.message : 'Unknown error',
          type: innerError instanceof Error ? innerError.name : typeof innerError,
          stack: innerError instanceof Error ? innerError.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API route: Error fetching Azure health data:', error);
    
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to fetch Azure health data',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 