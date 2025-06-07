const ApiService = {
    /**
     * Fetches all characters from the backend.
     * @returns {Promise<Array>} A promise that resolves to an array of character objects.
     */
    async getAllCharacters() {
        try {
            const response = await fetch('http://127.0.0.1:5001/api/characters');
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error("ApiService: Failed to fetch characters.", error);
            throw error;
        }
    },

    async getScenesForWorld(worldId) {
        // For now, we'll assume a single, hardcoded world.
        // In the future, this would be dynamic.
        const tempWorldId = "default-world"; // Replace with actual world management
        try {
            const response = await fetch(`http://127.0.0.1:5001/api/worlds/${tempWorldId}/scenes`);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("ApiService: Failed to fetch scenes.", error);
            throw error;
        }
    },

    async createScene(name, worldId) {
        const tempWorldId = "default-world"; // Replace with actual world management
        try {
            const response = await fetch('http://127.0.0.1:5001/api/scenes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, game_world_id: tempWorldId }),
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("ApiService: Failed to create scene.", error);
            throw error;
        }
    },

    async generateDialogue(sceneId, npcId, topic) {
        try {
            const response = await fetch(`http://127.0.0.1:5001/api/scenes/${sceneId}/generate-dialogue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ npc_id: npcId, topic: topic }),
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("ApiService: Failed to generate dialogue.", error);
            throw error;
        }
    }
};