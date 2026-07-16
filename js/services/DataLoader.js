
export class DataLoader {
    static async loadData(url) {
        try {
            const isUsers = url.includes("users.json");
            const storageKey = isUsers ? "aether_users" : "aether_data";
            
            const localData = localStorage.getItem(storageKey);
            if (localData) {
                return JSON.parse(localData);
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error al cargar el JSON: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            localStorage.setItem(storageKey, JSON.stringify(data));
            return data;
        } catch (error) {
            console.error(`Error: fallo al cargar los datos desde ${url}`, error);
            throw error;
        }
    }

    static saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
}
