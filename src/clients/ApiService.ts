import axios from 'axios';

export interface SentimentScore {
  positive: number;
  neutral: number;
  negative: number;
}

export interface SentimentAnalysis {
  url: string;
  title: string;
  ticker: string;
  content: string;
  date: string;
  sentiment_scores: SentimentScore;
}

export interface StockPrediction {
  prediction: number;
  timestamp: string;
  confidence_score: number;
  model_version: string;
  model_type: string;
}

class ApiService {
  // Get stock prediction for a ticker
  async getStockPrediction(ticker: string): Promise<StockPrediction> {
    try {
      const response = await axios.get<StockPrediction>(`/prediction/${ticker}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stock prediction:', error);
      throw error;
    }
  }

  // Get sentiment analysis for a ticker
  async getSentimentAnalysis(ticker: string): Promise<SentimentAnalysis[]> {
    try {
      const response = await axios.get<SentimentAnalysis[]>(`/sentiment/${ticker}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sentiment analysis:', error);
      throw error;
    }
  }

  // Fetch historical stock data from Yahoo Finance API
  async getHistoricalData(ticker: string, period: string = '1y', interval: string = '1d'): Promise<any> {
    try {
      // In a real implementation, you would use the Yahoo Finance API
      // For now, let's simulate it with a placeholder
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${period}&interval=${interval}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService; 