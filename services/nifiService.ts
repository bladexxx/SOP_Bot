import { Configuration } from '../types';

interface NiFiFlowParams {
    path?: string; // For batch tests
    file?: File; // For single file uploads
    benchmarkId: string;
    config: Configuration;
}

interface NiFiFlowResult {
    matched: number;
    mismatched: number;
}

interface NiFiSettings {
    nifiUrl: string;
    nifiEndpoint: string;
}

/**
 * Simulates triggering a data processing flow in NiFi.
 * This function now takes configuration for the NiFi instance and endpoint, constructs
 * the target URL, and logs it. It still returns mock results to ensure stability.
 *
 * @param params - The payload containing data path, benchmark, and configuration.
 * @param settings - The user-configured NiFi URL and endpoint.
 * @returns A promise that resolves with the test results.
 */
export const triggerNiFiFlow = (params: NiFiFlowParams, settings: NiFiSettings): Promise<NiFiFlowResult> => {
    console.log(`[BOT] Simulating trigger for NiFi flow with config:`, `${params.config.projectName}-${params.config.vendorId || 'project'}`);
    
    const { nifiUrl, nifiEndpoint } = settings;
    if (!nifiUrl || !nifiEndpoint) {
        console.error('[NiFi Service] NiFi URL or Endpoint is not configured in settings.');
        return Promise.reject('NiFi URL or Endpoint is not configured.');
    }
    
    // Construct the full URL, ensuring no double slashes
    const fullNifiUrl = `${nifiUrl.replace(/\/$/, '')}${nifiEndpoint}`;
    
    // In a real application, you would use the File API for uploads or send the path.
    // Here, we log the intended action.
    const body = params.file ? `(File data for: ${params.file.name})` : JSON.stringify({ path: params.path });

    console.log(`[NiFi Service] Preparing to POST to configured endpoint: %c${fullNifiUrl}`, 'font-weight: bold;');
    console.log('[NiFi Service] With body:', body);


    // Simulate the time it takes for the asynchronous NiFi flow to run.
    // A real implementation would involve a `fetch` call here and might use WebSockets
    // or polling on a backend to get the final result.
    return new Promise((resolve) => {
        const processingTime = 3000 + Math.random() * 2000; // 3-5 seconds
        console.log(`[BOT] Simulating NiFi processing time of ${processingTime}ms...`);

        setTimeout(() => {
            // Simulate realistic-looking results based on whether it's a batch or single file test.
            const totalRecords = params.path ? 1250 + Math.floor(Math.random() * 100) : 85 + Math.floor(Math.random() * 20);
            const mismatched = Math.floor(Math.random() * (totalRecords * 0.1)); // Up to 10% mismatch
            const matched = totalRecords - mismatched;
            
            const result: NiFiFlowResult = { matched, mismatched };
            console.log('[BOT] Mock NiFi flow completed. Returning mock results:', result);

            resolve(result);
        }, processingTime);
    });
};
