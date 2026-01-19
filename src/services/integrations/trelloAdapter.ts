import { IntegrationConfig } from '@/types/integration';

const BASE_URL = 'https://api.trello.com/1';

interface TrelloBoard {
    id: string;
    name: string;
}

interface TrelloList {
    id: string;
    name: string;
    idBoard: string;
}

export const trelloAdapter = {
    /**
     * Fetch all Boards and Lists accessible to the user
     * Returns a flat list of "Targets" (Lists) grouped by Board Name
     */
    getTargets: async (config: IntegrationConfig) => {
        const { apiKey, apiToken } = config.credentials;
        if (!apiKey || !apiToken) throw new Error("Missing credentials");

        // 1. Get Boards
        const boardsRes = await fetch(`${BASE_URL}/members/me/boards?key=${apiKey}&token=${apiToken}&fields=name,id`);
        if (!boardsRes.ok) throw new Error("Failed to fetch boards");
        const boards: TrelloBoard[] = await boardsRes.json();

        // 2. Get Lists for each board (Parallel)
        // Optimization: In a real app, we might load lists purely on demand. For MVP, we fetch all.
        const targets: { id: string, name: string, group: string }[] = [];

        await Promise.all(boards.map(async (board) => {
            try {
                const listsRes = await fetch(`${BASE_URL}/boards/${board.id}/lists?key=${apiKey}&token=${apiToken}&fields=name,id`);
                if (listsRes.ok) {
                    const lists: TrelloList[] = await listsRes.json();
                    lists.forEach(list => {
                        targets.push({
                            id: list.id,
                            name: list.name,
                            group: board.name
                        });
                    });
                }
            } catch (e) {
                console.warn(`Failed to fetch lists for board ${board.name}`);
            }
        }));

        return targets;
    },

    createCard: async (config: IntegrationConfig, data: { title: string, description: string }, listId: string) => {
        const { apiKey, apiToken } = config.credentials;
        const params = new URLSearchParams({
            key: apiKey as string,
            token: apiToken as string,
            idList: listId,
            name: data.title,
            desc: data.description
        });

        const res = await fetch(`${BASE_URL}/cards?${params.toString()}`, {
            method: 'POST'
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Trello API Error: ${err}`);
        }

        const card = await res.json();
        return card.url; // Return the URL of the created card
    }
};
