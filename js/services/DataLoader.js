/**
 * DataLoader
 * Servicio para cargar datos en formato JSON de manera asincrónica utilizando Fetch API.
 */
export class DataLoader {
    /**
     * Carga un archivo JSON de forma asincrónica.
     * @param {string} url - La ruta del archivo JSON.
     * @returns {Promise<Object>} Promesa que resuelve a los datos JSON.
     */
    static async loadData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error al cargar el JSON: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`DataLoader Error: fallo al cargar los datos desde ${url}`, error);
            throw error;
        }
    }
}
