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
 * Simulates triggering a data processing flow in NiFi.
 * This function simulates waiting for an asynchronous job to complete before returning mock results.
 * It does not make a real network request to ensure stability in the demo environment.
 *
 * @param params - The payload containing data path, benchmark, and configuration.
 * @returns A promise that resolves with the test results.
 */
export const triggerNiFiFlow = (params: NiFiFlowParams): Promise<NiFiFlowResult> => {
    console.log(`[BOT] Simulating trigger for NiFi flow with config:`, `${params.config.projectName}-${params.config.vendorId || 'project'}`);

    // Simulate the time it takes for the asynchronous NiFi flow to run.
    // A real implementation might use WebSockets or polling on a backend.
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
