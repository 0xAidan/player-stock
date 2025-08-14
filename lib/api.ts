import axios from 'axios';

const NFL_API_BASE = 'https://api.sportsdata.io/v3/nfl/stats/json';
const HYPERLIQUID_API_BASE = 'https://api.hyperliquid.xyz';

export class NFLDataService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getPlayerStats(season: number, week: number): Promise<any[]> {
    try {
      const response = await axios.get(
        `${NFL_API_BASE}/PlayerGameStatsByWeek/${season}/${week}`,
        {
          headers: { 'Ocp-Apim-Subscription-Key': this.apiKey }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching NFL data:', error);
      throw error;
    }
  }

  async getPlayers(): Promise<any[]> {
    try {
      const response = await axios.get(
        `${NFL_API_BASE}/Players`,
        {
          headers: { 'Ocp-Apim-Subscription-Key': this.apiKey }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
  }
}

export class HyperliquidService {
  async getMarkets(): Promise<any[]> {
    try {
      const response = await axios.get(`${HYPERLIQUID_API_BASE}/info`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Hyperliquid markets:', error);
      throw error;
    }
  }

  async placeOrder(order: any): Promise<any> {
    try {
      const response = await axios.post(`${HYPERLIQUID_API_BASE}/exchange`, order);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }
} 