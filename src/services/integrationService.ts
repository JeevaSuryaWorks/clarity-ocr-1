import { db } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, setDoc, query, getDoc } from 'firebase/firestore';
import { IntegrationConfig, IntegrationType } from '@/types/integration';

const COLLECTION = 'integrations';

export const getUserIntegrations = async (userId: string): Promise<IntegrationConfig[]> => {
    try {
        const q = query(collection(db, `users/${userId}/${COLLECTION}`));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as IntegrationConfig);
    } catch (error) {
        console.error("Error fetching integrations:", error);
        return [];
    }
};

export const saveIntegration = async (userId: string, config: IntegrationConfig) => {
    try {
        const docRef = doc(db, `users/${userId}/${COLLECTION}`, config.type); // One per type for now? Or generic ID. Let's use generic ID or type. 
        // Allowing multiple accounts of same type might be useful, but for V1 let's limit to one per type for simplicity.
        // actually, let's use config.type as ID to enforce singleton per service for now.

        await setDoc(docRef, config);
        return true;
    } catch (error) {
        console.error("Error saving integration:", error);
        return false;
    }
};

export const removeIntegration = async (userId: string, type: IntegrationType) => {
    try {
        const docRef = doc(db, `users/${userId}/${COLLECTION}`, type);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error removing integration:", error);
        return false;
    }
};

export const getIntegration = async (userId: string, type: IntegrationType): Promise<IntegrationConfig | null> => {
    try {
        const docRef = doc(db, `users/${userId}/${COLLECTION}`, type);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data() as IntegrationConfig;
        }
        return null;
    } catch (error) {
        console.error(`Error getting integration ${type}:`, error);
        return null;
    }
}

// --- Adapter Registry ---
import { trelloAdapter } from './integrations/trelloAdapter';

export const fetchExportTargets = async (config: IntegrationConfig) => {
    try {
        if (config.type === 'trello') {
            return await trelloAdapter.getTargets(config);
        }
        // Future: Add Notion/Jira here
        return [];
    } catch (error) {
        console.error("Adapter Error (fetchTargets):", error);
        throw error;
    }
};

export const executeExport = async (config: IntegrationConfig, targetId: string, data: { title: string, content: string }) => {
    try {
        if (config.type === 'trello') {
            return await trelloAdapter.createCard(config, { title: data.title, description: data.content }, targetId);
        }
        return null;
    } catch (error) {
        console.error("Adapter Error (executeExport):", error);
        throw error;
    }
};

