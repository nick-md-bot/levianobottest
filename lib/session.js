const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Must match the pair/session-generator app (same DB + collection)
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'paircode';
const COLLECTION = process.env.MONGODB_COLLECTION || 'sessions';

async function MakeSession(sessionId, folderPath) {
    let client;
    try {
        if (!sessionId) throw new Error('SESSION_ID is not set');
        if (!MONGODB_URI) throw new Error('MONGODB_URI is not set');

        // SESSION_ID format: bot~<id>
        const id = sessionId.includes('~') ? sessionId.split('~')[1] : sessionId;

        client = await new MongoClient(MONGODB_URI).connect();
        const doc = await client.db(DB_NAME).collection(COLLECTION).findOne({ _id: id });

        if (!doc || !doc.content) {
            throw new Error('Session not found in MongoDB for id: ' + id);
        }

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const dataToWrite = typeof doc.content === 'string'
            ? doc.content
            : JSON.stringify(doc.content);

        fs.writeFileSync(path.join(folderPath, 'creds.json'), dataToWrite);
        console.log('Session file saved successfully!');
    } catch (error) {
        console.error('An error occurred while saving session:', error.message);
    } finally {
        if (client) await client.close().catch(() => {});
    }
}

module.exports = { MakeSession };
