/**
 * Google Sheets Service using modern Google Identity Services (GIS)
 * This replaces the deprecated gapi-script library
 */

declare global {
    interface Window {
        google: any;
    }
}

let tokenClient: any = null;
let accessToken: string | null = null;

export const GoogleSheetsService = {
    /**
     * Initialize the Google Identity Services client
     */
    initClient: async (clientId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            // Load the Google Identity Services library
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                // Initialize the token client
                tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
                    callback: (response: any) => {
                        if (response.error) {
                            reject(response);
                        } else {
                            accessToken = response.access_token;
                            resolve();
                        }
                    },
                });
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
            document.head.appendChild(script);
        });
    },

    /**
     * Request access token (triggers OAuth popup)
     */
    signIn: async (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!tokenClient) {
                reject(new Error('Token client not initialized'));
                return;
            }

            // Override callback for this specific request
            tokenClient.callback = (response: any) => {
                if (response.error) {
                    reject(response);
                } else {
                    accessToken = response.access_token;
                    resolve();
                }
            };

            // Request access token
            tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    },

    /**
     * Sign out (revoke token)
     */
    signOut: async (): Promise<void> => {
        if (accessToken) {
            window.google.accounts.oauth2.revoke(accessToken, () => {
                accessToken = null;
            });
        }
    },

    /**
     * Check if signed in
     */
    isSignedIn: (): boolean => {
        return accessToken !== null;
    },

    /**
     * Fetch data from the spreadsheet using the Sheets API
     * Uses the EXACT SAME column mapping logic as CSV parser
     */
    fetchSheetData: async (spreadsheetId: string) => {
        if (!accessToken) {
            throw new Error('Not authenticated. Please sign in first.');
        }

        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:E`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const rows = data.values;

            if (!rows || rows.length === 0) {
                return [];
            }

            // Parse header row (SAME AS CSV PARSER)
            const headers = rows[0].map((h: string) => h.trim().toLowerCase());
            const dataRows = rows.slice(1);

            // Find column indices by matching header names (SAME AS CSV PARSER)
            const nomeIndex = headers.findIndex(h =>
                h.includes('nome') && (h.includes('completo') || h === 'nome')
            );
            const documentoIndex = headers.findIndex(h =>
                h.includes('cpf') || h.includes('rg') || h.includes('documento')
            );
            const telefoneIndex = headers.findIndex(h =>
                h.includes('telefone') || h.includes('celular') || h.includes('phone')
            );

            console.log('📊 Headers from Google Sheets:', headers);
            console.log('📍 Column indices:', { nomeIndex, documentoIndex, telefoneIndex });

            return dataRows.map((row: any[], rowIndex: number) => {
                // Extract data using the found indices (SAME AS CSV PARSER)
                const nome = nomeIndex >= 0 ? (row[nomeIndex]?.toString().trim() || '') : '';
                const documento = documentoIndex >= 0 ? (row[documentoIndex]?.toString().trim() || '') : '';
                const telefone = telefoneIndex >= 0 ? (row[telefoneIndex]?.toString().trim() || '') : '';

                const passenger = { nome, documento, telefone };

                if (rowIndex < 3) { // Log first 3 rows for debugging
                    console.log(`👤 Row ${rowIndex + 1}:`, passenger);
                }

                return passenger;
            });
        } catch (error) {
            console.error('Error fetching sheet data:', error);
            throw error;
        }
    }
};
