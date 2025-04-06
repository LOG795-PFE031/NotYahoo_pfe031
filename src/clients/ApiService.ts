import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

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
  symbol: string;
  price: number;
  timestamp: string;
  confidence_score: number;
  model_type: string;
}

export interface HistoricalData {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        symbol: string;
        exchangeName: string;
        instrumentType: string;
        firstTradeDate: number;
        regularMarketTime: number;
        gmtoffset: number;
        timezone: string;
        exchangeTimezoneName: string;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          high: number[];
          low: number[];
          open: number[];
          close: number[];
          volume: number[];
        }>;
        adjclose?: Array<{
          adjclose: number[];
        }>;
      };
    }>;
    error: null | string;
  };
}

// Create base API clients with default configurations
const createApiClient = (baseURL: string): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout: 10000, // 10 seconds timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Stock prediction service client
const predictionServiceClient = createApiClient(
  import.meta.env.VITE_PREDICTION_SERVICE_URL || 'http://localhost:8000'
);

// Sentiment analysis service client
const sentimentServiceClient = createApiClient(
  import.meta.env.VITE_SENTIMENT_SERVICE_URL || 'http://localhost:8092'
);

class ApiService {
  // Get stock prediction for a ticker
  async getStockPrediction(ticker: string): Promise<StockPrediction> {
    try {
      const response = await predictionServiceClient.get<StockPrediction>(`/docs/${ticker}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching stock prediction for ${ticker}:`, error);
      throw error;
    }
  }

  // Get sentiment analysis for a ticker
  async getSentimentAnalysis(ticker: string): Promise<SentimentAnalysis[]> {
    try {
      const response = await sentimentServiceClient.get<SentimentAnalysis[]>(`/analyze/${ticker}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sentiment analysis for ${ticker}:`, error);
      throw error;
    }
  }

  // Fetch historical stock data
  async getHistoricalData(ticker: string, period: string = '1y', interval: string = '1d'): Promise<HistoricalData> {
    try {
      // This could be another microservice in the future
      const response = await axios.get<HistoricalData>(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${period}&interval=${interval}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
      throw error;
    }
  }

  // Generic method for calling any API endpoint (for future services)
  async callApi<T, D = Record<string, unknown>>(
    client: AxiosInstance,
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete' = 'get',
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await client[method](endpoint, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error calling API endpoint ${endpoint}:`, error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService; 