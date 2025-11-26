// @ts-ignore
import { gapi } from 'gapi-script';

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

export interface GoogleSheetConfig {
    clientId: string;
    spreadsheetId: string;
}

export const GoogleSheetsService = {
    /**
     * Initialize the Google API client
     */
    initClient: async (clientId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', () => {
                gapi.client.init({
                    clientId: clientId,
                    discoveryDocs: DISCOVERY_DOCS,
                    scope: SCOPES,
                }).then(() => {
                    resolve();
                }).catch((error: any) => {
                    reject(error);
                });
            });
        });
    },

    /**
     * Sign in with Google
     */
    signIn: async (): Promise<gapi.auth2.GoogleUser> => {
        const authInstance = gapi.auth2.getAuthInstance();
        if (!authInstance) {
            throw new Error('Google Auth not initialized');
        }
        return authInstance.signIn();
    },

    /**
     * Sign out
     */
    signOut: async (): Promise<void> => {
        const authInstance = gapi.auth2.getAuthInstance();
        if (authInstance) {
            await authInstance.signOut();
        }
    },

    /**
     * Check if signed in
     */
    isSignedIn: (): boolean => {
        const authInstance = gapi.auth2.getAuthInstance();
        return authInstance ? authInstance.isSignedIn.get() : false;
    },

    /**
     * Fetch data from the spreadsheet
     */
    fetchSheetData: async (spreadsheetId: string) => {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: 'A:E', // Fetch first 5 columns, adjust as needed
            });

            const rows = response.result.values;
            if (!rows || rows.length === 0) {
                return [];
            }

            // Assume first row is header
            const headers = rows[0].map((h: string) => h.toLowerCase().trim());
            const data = rows.slice(1);

            return data.map((row: any[]) => {
                const passenger: any = {};
                headers.forEach((header: string, index: number) => {
                    if (index < row.length) {
                        // Map common header names to our internal fields
                        if (header.includes('nome')) passenger.nome = row[index];
                        else if (header.includes('documento') || header.includes('cpf') || header.includes('rg')) passenger.documento = row[index];
                        else if (header.includes('telefone') || header.includes('celular')) passenger.telefone = row[index];
                        else if (header.includes('email')) passenger.email = row[index];
                    }
                });
                return passenger;
            });
        } catch (error) {
            console.error('Error fetching sheet data:', error);
            throw error;
        }
    }
};
