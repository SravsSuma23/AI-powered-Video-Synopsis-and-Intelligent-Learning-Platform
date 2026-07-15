import { synopsisService } from './synopsisService';
import type { SynopsisData } from './synopsisService';

export const historyService = {
  /**
   * Retrieves all processed video synopses from the workspace.
   */
  async getHistory(): Promise<SynopsisData[]> {
    return synopsisService.getHistory();
  },

  /**
   * Fetch specific synopsis details by its ID.
   */
  async getById(id: string): Promise<SynopsisData | null> {
    return synopsisService.getById(id);
  },

  /**
   * Delete a processed synopsis log permanently from storage.
   */
  async deleteSynopsis(id: string): Promise<void> {
    return synopsisService.deleteSynopsis(id);
  },

  /**
   * Toggle a bookmark status for favorites filtering.
   */
  async toggleSave(id: string): Promise<SynopsisData> {
    return synopsisService.toggleSave(id);
  },

  /**
   * Clear all workspace records.
   */
  async clearHistory(): Promise<void> {
    localStorage.removeItem('mock_synopsis_history');
  }
};
export default historyService;
