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
  date: string;
  sentiment_scores: SentimentScore;
}

export interface StockPrediction {
  symbol: string;
  date: string;
  predicted_price: number;
  confidence: number;
  model_type: string;
}

// Interface for individual stock data
export interface StockData {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  Dividends: number;
  'Stock Splits': number;
  Returns: number;
  MA_5: number;
  MA_20: number;
  Volatility: number | null;
  RSI: number;
  MACD: number;
  MACD_Signal: number;
  'Adj Close': number;
}

// Interface for historical stock data
export interface StockDataHistory {
  symbol: string;
  data: StockData[];
  meta: {
    message: string;
    version: string;
    documentation: string;
    endpoints: string[];
  };
  timestamp: string;
}

export interface StockDataHistoryResponse {
  symbol: string;
  name: string;
  data: StockData[];
  meta: {
    message: string;
    version: string;
    documentation: string;
    endpoints: string[];
  };
  timestamp: string;
}

// Define the real News API response type
export interface NewsApiResponse {
  symbol: string;
  articles: Array<{
    confidence: number;
    sentiment: string;
    published_date: string;
    source: string;
    title: string;
    url: string;
  }>;
  total_articles: number;
  sentiment_metrics: {
    positive: number;
    negative: number;
    neutral: number;
    average_confidence: number;
  };
  meta: {
    message: string;
    version: string;
    documentation: string;
    endpoints: string[];
  };
}

export interface NewsData {
    title: string;
    publishedAt: string;
    opinion: number;
    url: string;
    source: string;
    confidence: number;
};

export interface Stock {
  companyName: string,
  deltaIndicator: string,
  lastSalePrice: string,
  marketCap: string,
  netChange: string,
  percentageChange:  string,
  sector:  string,
  symbol:  string
}

// Create base API clients with default configurations
const createApiClient = (baseURL: string): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout: 100000, // 100 seconds timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Stock prediction service client
const predictionServiceClient = createApiClient(
  import.meta.env.VITE_PREDICTION_SERVICE_URL || 'http://localhost:8000'
);

const dataServiceClient = createApiClient(
  import.meta.env.VITE_DATA_SERVICE_URL || 'http://localhost:8000'
);

const stockAIServiceClient = createApiClient('http://localhost:8000');

class ApiService {
  // Get stock prediction for a ticker
  async getStockPrediction(ticker: string, model_type: string): Promise<StockPrediction | null> {
    try {

      const response = await predictionServiceClient.get(`/api/predict`,{
        params:{
          symbol: ticker,
          model_type: model_type
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching stock prediction for ${ticker}:`, error);
      // Return no prediction if no models are available
      return null;
    }
  }

  // Get sentiment analysis for a ticker
  async getSentimentAnalysis(ticker: string): Promise<SentimentAnalysis[]> {

    try {
      const response = await this.getNewsData(ticker);
      return response.articles.map((article: NewsData) => ({
        url: article.url,
        title: article.title,
        ticker: ticker,
        date: article.publishedAt,
        sentiment_scores: {
          positive: article.opinion == 1 ? article.confidence : 0,
          neutral: article.opinion == 0 ? article.confidence: 0,
          negative: article.opinion == -1 ? article.confidence : 0
        }
      }));
    } catch (error) {
      console.error(`ApiService: Failed to get sentiment analysis for ${ticker}:`, error);
      return []; // Return empty list on failure
    }

  }

  // Fetch stock data
  async getStockDataHistory(ticker: string, start_date: string = "", end_date: string = ""): Promise<StockDataHistoryResponse> {
    try {
      const url = `/api/data/stock/historical`;

      const response = await dataServiceClient.get<StockDataHistoryResponse>(url,{
        params:{
          symbol: ticker,
          start_date: start_date,
          end_date: end_date
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching stock data for ${ticker}:`, error);
      throw error;
    }
  }

  // Fetch all model type
  async getModelsTypes() {
    try {
      const url = `/api/train/trainers`;
      const response = await stockAIServiceClient.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching all models types`, error);
      throw error;
    }
  }

  // Fetch all stocks
  async getStocks(): Promise<Stock[]> {
    try {
      const url = `/api/data/stocks`;
      const response = await stockAIServiceClient.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching all stocks`, error);
      throw error;
    }
  }

  // Get news data for a ticker
  async getNewsData(ticker: string): Promise<{ 
    articles: Array<NewsData>,
    sentiment_metrics?: {
      positive: number,
      negative: number,
      neutral: number,
      average_confidence: number
    }
  }> {
    try {
      console.log(`ApiService: Getting news data for ${ticker}`);
      
      try {
        // Direct API call to the news endpoint
        const response = await axios.get<NewsApiResponse>(`${import.meta.env.VITE_PREDICTION_SERVICE_URL || 'http://localhost:8000'}/api/data/news`, {
          params:{
            symbol: ticker
          }
        });
        console.log(`ApiService: Got news data for ${ticker}:`, response.data);
        
        // Transform API response to match our expected format
        const articles = response.data.articles.map(article => ({
          title: article.title,
          publishedAt: article.published_date,
          // Convert sentiment string to numeric opinion value
          opinion: article.sentiment === "POSITIVE" ? 1 : 
                  article.sentiment === "NEGATIVE" ? -1 : 0,
          url: article.url,
          source: article.source,
          confidence: article.confidence
        }));
        
        console.log(`ApiService: Transformed news data for ${ticker}:`, articles);
        return { 
          articles,
          sentiment_metrics: response.data.sentiment_metrics
        };
      } catch (newsError) {
        console.error(`ApiService: Error in news API call for ${ticker}:`, newsError);
        
        // Fallback to mock data if API call fails
        console.log(`ApiService: Using mock data for ${ticker}`);
        const mockArticles = [
          {
            title: `${ticker} Stock Shows Strong Performance in Recent Trading`,
            publishedAt: new Date().toISOString(),
            opinion: 1,
            url: `https://finance.yahoo.com/quote/${ticker}`,
            source: "Yahoo Finance",
            confidence: 0.85
          },
          {
            title: `Market Analysis: What's Next for ${ticker}?`,
            publishedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            opinion: 0,
            url: `https://www.marketwatch.com/investing/stock/${ticker}`,
            source: "MarketWatch",
            confidence: 0.65
          },
          {
            title: `Investors Concerned About ${ticker}'s Recent Announcement`,
            publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            opinion: -1,
            url: `https://www.investing.com/equities/${ticker.toLowerCase()}`,
            source: "Investing.com",
            confidence: 0.75
          }
        ];
        
        // Mock sentiment metrics
        const mockMetrics = {
          positive: 0.33,
          negative: 0.33,
          neutral: 0.34,
          average_confidence: 0.75
        };
        
        return { 
          articles: mockArticles,
          sentiment_metrics: mockMetrics
        };
      }
    } catch (error) {
      console.error(`ApiService: Error fetching news data for ${ticker}:`, error);
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
