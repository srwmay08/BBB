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
            // Re-throw the error to be handled by the caller
            throw error;
        }
    }
    // In the future, functions like `updateCharacter(id, data)` would go here.
};