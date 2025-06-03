import path from 'path';
import { google } from 'googleapis';

const sheets = google.sheets('v4');

// Obtiene la fecha actual en formato DD/MM/YYYY
function getTodaySheetName() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
}

// Crea una hoja si no existe
async function ensureSheetExists(auth, spreadsheetId, sheetName) {
    const getSheets = await sheets.spreadsheets.get({
        spreadsheetId,
        auth,
    });
    const exists = getSheets.data.sheets.some(
        (sheet) => sheet.properties.title === sheetName
    );
    if (!exists) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            auth,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: sheetName,
                            },
                        },
                    },
                ],
            },
        });
    }
}

async function addRowToSheet(auth, spreadsheetId, values, sheetName) {
    const request = {
        spreadsheetId,
        range: `datos`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
            values: [values],
        },
        auth,
    };

    try {
        const response = (await sheets.spreadsheets.values.append(request)).data;
        return response;
    } catch (error) {
        console.error(error);
    }
}

const appendToSheet = async (data, spreadsheetId) => {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: process.env.GOOGLE_TYPE,
                project_id: process.env.GOOGLE_PROJECT_ID,
                private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                client_id: process.env.GOOGLE_CLIENT_ID,
                auth_uri: process.env.GOOGLE_AUTH_URI,
                token_uri: process.env.GOOGLE_TOKEN_URI,
                auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
                client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const authClient = await auth.getClient();

        const sheetName = getTodaySheetName();
        await ensureSheetExists(authClient, spreadsheetId, sheetName);
        await addRowToSheet(authClient, spreadsheetId, data, sheetName);

        return 'Datos correctamente agregados';
    } catch (error) {
        console.error(error);
    }
};

export default appendToSheet;