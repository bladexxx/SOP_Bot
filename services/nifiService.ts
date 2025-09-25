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

/**
 * Mocks a REST API call to a local NiFi instance to trigger a data processing flow.
 * In a real-world scenario, this would use HTTPS with client certificates for authentication
 * and would hit a specific NiFi API endpoint (e.g., /nifi-api/process-groups/{id}/processors/{id}/run).
 * 
 * @param params - The payload containing data path, benchmark, and configuration.
 * @returns A promise that resolves with the test results or rejects with an error.
 */
export const triggerNiFiFlow = (params: NiFiFlowParams): Promise<NiFiFlowResult> => {
    console.log('[MOCK NIFI API] Triggering NiFi flow with parameters:', {
        path: params.path || params.file?.name,
        benchmarkId: params.benchmarkId,
        configId: `${params.config.projectName}-${params.config.vendorId || 'project'}`
    });

    return new Promise((resolve, reject) => {
        // Simulate network latency and processing time (e.g., 3-6 seconds)
        const processingTime = 3000 + Math.random() * 3000;

        setTimeout(() => {
            // Simulate a small chance of failure
            if (Math.random() < 0.1) {
                console.error('[MOCK NIFI API] Simulated NiFi flow failure.');
                reject('Failed to communicate with the NiFi processor. It may be stopped or misconfigured.');
            } else {
                 // Simulate realistic-looking results based on input type
                const totalRecords = params.path ? 1250 + Math.floor(Math.random() * 100) : 85 + Math.floor(Math.random() * 20);
                const mismatched = Math.floor(Math.random() * (totalRecords * 0.1)); // up to 10% mismatch
                const matched = totalRecords - mismatched;
                
                const result: NiFiFlowResult = { matched, mismatched };
                console.log('[MOCK NIFI API] NiFi flow completed. Returning mock results:', result);

                resolve(result);
            }
        }, processingTime);
    });
};
