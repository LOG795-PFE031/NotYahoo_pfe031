import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  GridItem,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import apiService, { StockPrediction, SentimentAnalysis, StockData } from '../../clients/ApiService';
import { getBusinessDateRange } from '../../utils/dateUtils';

const StockDetails: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentAnalysis[]>([]);
  const [historicalData, setHistoricalData] = useState<{date: string, price: number, volume:number}[]>([]);
  const [error, setError] = useState('');
  const [model, setModel] = useState('lstm');
  const [allModelType, setAllModelType] = useState([])
  
  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;
      
      setLoading(true);
      setError('');
      
      try {
        // Fetch all possible model type
        const listOfModelType = await apiService.getModelsTypes()
        setAllModelType(listOfModelType.types)

        // Fetch prediction data
        const predictionData = await apiService.getStockPrediction(ticker);
        setPrediction(predictionData);
        
        // Fetch sentiment analysis
        const sentimentAnalysis = await apiService.getSentimentAnalysis(ticker);
        setSentimentData(sentimentAnalysis);
        
        // Fetch historical data
        const { startDate, endDate } = getBusinessDateRange();
        const historicalData = await apiService.getStockDataHistory(ticker, startDate, endDate);
        const formattedHistoricalData = formatHistoricalData(historicalData.data);
        setHistoricalData(formattedHistoricalData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data. Please try again later.');
        setLoading(false);
        
        toast({
          title: 'Error',
          description: 'Failed to load stock data.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    
    fetchData();
  }, [ticker, toast]);
  
  // Helper to format the historical data into the correct format
  const formatHistoricalData = (rawHistoricalData: StockData[]) => {
    const data = rawHistoricalData.map(entry => ({
      date: entry.Date.split('T')[0],          // Extract YYYY-MM-DD
      price: entry.Close,                      // Using 'Close' as the price
      volume: entry.Volume,
    }));
    
    return data;
  };
  
  // Calculate sentiment averages
  const calculateSentimentAverages = () => {
    if (sentimentData.length === 0) return { positive: 0, neutral: 0, negative: 0 };
    
    const totals = sentimentData.reduce(
      (acc, item) => {
        acc.positive += item.sentiment_scores.positive;
        acc.neutral += item.sentiment_scores.neutral;
        acc.negative += item.sentiment_scores.negative;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );
    
    const count = sentimentData.length;
    return {
      positive: totals.positive / count,
      neutral: totals.neutral / count,
      negative: totals.negative / count,
    };
  };
  
  const sentimentAverages = calculateSentimentAverages();
  const dominantSentiment = Object.entries(sentimentAverages).reduce(
    (max, [key, value]) => (value > max.value ? { key, value } : max),
    { key: 'neutral', value: 0 }
  ).key;
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'green.500';
      case 'negative':
        return 'red.500';
      default:
        return 'gray.500';
    }
  };
  
  if (loading) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" color="brand.500" />
        <Text mt={4}>Loading stock data...</Text>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Heading as="h1" size="xl">
              {ticker}
            </Heading>
            <Text fontSize="lg" color="gray.600">
              {/* This would be the company name in a real implementation */}
              {ticker === 'AAPL' ? 'Apple Inc.' : 
               ticker === 'MSFT' ? 'Microsoft Corporation' : 
               ticker === 'GOOGL' ? 'Alphabet Inc.' : 
               ticker === 'AMZN' ? 'Amazon.com Inc.' : 'Stock Details'}
            </Text>
          </Box>
          <select onChange={(type) => console.log(type.target.value)}>
                {allModelType.map((val, index) => (
                  <option key={index} value={val}>
                    {val}
                  </option>
                  ))}
          </select>
          <Box>
            <Badge 
              colorScheme={dominantSentiment === 'positive' ? 'green' : dominantSentiment === 'negative' ? 'red' : 'gray'} 
              fontSize="md" 
              p={2} 
              borderRadius="md"
            >
              {dominantSentiment.charAt(0).toUpperCase() + dominantSentiment.slice(1)} Sentiment
            </Badge>
          </Box>
        </Flex>
        
        {/* Price information and prediction */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6} mb={8}>
          <GridItem>
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
              <Heading size="md" mb={4}>Current Price</Heading>
              <Stat>
                <StatLabel fontSize="md">Last traded price</StatLabel>
                <StatNumber fontSize="3xl">
                  ${historicalData.length > 0 ? historicalData[historicalData.length - 1].price.toFixed(2) : 'N/A'}
                </StatNumber>
                <StatHelpText>
                  {/* This would show actual change data in a real implementation */}
                  <Text color="green.500">+2.34 (+1.54%) Today</Text>
                </StatHelpText>
              </Stat>
            </Box>
          </GridItem>
          
          <GridItem>
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
              <Heading size="md" mb={4}>Price Prediction</Heading>
              {prediction ? (
                <Stat>
                  <StatLabel fontSize="md">Next trading day's predicted price</StatLabel>
                  <StatNumber fontSize="3xl">${prediction.predicted_price.toFixed(2)}</StatNumber>
                  <StatHelpText>
                    <Flex align="center" justify="space-between">
                      <Text>Confidence: {(prediction.confidence * 100).toFixed(1)}%</Text>
                      {/* <Text fontSize="sm" color="gray.500">Model: {prediction.model_type}</Text> */}
                    </Flex>
                  </StatHelpText>
                </Stat>
              ) : (
                <Text>No prediction data available</Text>
              )}
              <Flex align="center" justify="right">
                <Text fontSize="sm" color="gray.500">Model:</Text>
                <select onChange={(type) => console.log(type.target.value)} style={{backgroundColor:'beige', width:'150px'}}>
                {allModelType.map((val, index) => (
                  <option key={index} value={val}>
                    {val}
                  </option>
                  ))}
                </select>
              </Flex>
            </Box>
          </GridItem>
        </Grid>
      </Box>
      
      <Tabs variant="soft-rounded" colorScheme="blue" mb={8}>
        <TabList>
          <Tab>Price Chart</Tab>
          <Tab>Sentiment Analysis</Tab>
          <Tab>News Articles</Tab>
        </TabList>
        
        <TabPanels>
          {/* Price Chart */}
          <TabPanel>
            <Box height="400px" mb={6}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={historicalData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#0066ff" 
                    fill="#0066ff" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
            
            {prediction && (
              <Box p={4} borderWidth="1px" borderRadius="md" bg="blue.50">
                <Heading size="sm" mb={2}>Price Prediction Insight</Heading>
                <Text>
                  Based on our {prediction.model_type} model, we predict that {ticker} will be priced at 
                  ${prediction.predicted_price.toFixed(2)} on {new Date(prediction.date).toLocaleDateString()}. 
                  This prediction has a confidence score of {(prediction.confidence * 100).toFixed(1)}%.
                </Text>
              </Box>
            )}
          </TabPanel>
          
          {/* Sentiment Analysis */}
          <TabPanel>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
              <GridItem>
                <Box height="300px">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { name: 'Positive', value: sentimentAverages.positive },
                        { name: 'Neutral', value: sentimentAverages.neutral },
                        { name: 'Negative', value: sentimentAverages.negative },
                      ]}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 1]} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </GridItem>
              
              <GridItem>
                <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" height="100%">
                  <Heading size="md" mb={4}>Sentiment Overview</Heading>
                  
                  {Object.entries(sentimentAverages).map(([key, value]) => (
                    <Box key={key} mb={3}>
                      <Flex justify="space-between" mb={1}>
                        <Text fontWeight="medium">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Text>
                        <Text>{(value * 100).toFixed(1)}%</Text>
                      </Flex>
                      <Box 
                        w="100%" 
                        bg="gray.100" 
                        h="8px" 
                        borderRadius="full" 
                        overflow="hidden"
                      >
                        <Box 
                          bg={getSentimentColor(key)}
                          h="100%" 
                          w={`${value * 100}%`} 
                          borderRadius="full"
                        />
                      </Box>
                    </Box>
                  ))}
                  
                  <Text mt={4}>
                    Based on {sentimentData.length} news articles, the market sentiment for {ticker} is predominantly {dominantSentiment}.
                  </Text>
                </Box>
              </GridItem>
            </Grid>
          </TabPanel>
          
          {/* News Articles */}
          <TabPanel>
            <Box>
              <Heading size="md" mb={4}>Recent News Articles</Heading>
              
              {sentimentData.length > 0 ? (
                sentimentData.map((article, index) => (
                  <Box key={index} p={4} borderWidth="1px" borderRadius="md" mb={4}>
                    <Heading size="sm" mb={2}>
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        {article.title}
                      </a>
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      {new Date(article.date).toLocaleDateString()} 
                    </Text>
                    <Flex justify="space-between">
                      <Badge 
                        colorScheme={
                          article.sentiment_scores.positive > article.sentiment_scores.negative ? 'green' : 
                          article.sentiment_scores.negative > article.sentiment_scores.positive ? 'red' : 'gray'
                        }
                      >
                        {
                          article.sentiment_scores.positive > article.sentiment_scores.negative ? 'Positive' : 
                          article.sentiment_scores.negative > article.sentiment_scores.positive ? 'Negative' : 'Neutral'
                        }
                      </Badge>
                      <Box>
                        <Text fontSize="xs" as="span" mr={2}>
                          Positive: {(article.sentiment_scores.positive * 100).toFixed(1)}%
                        </Text>
                        <Text fontSize="xs" as="span" mr={2}>
                          Neutral: {(article.sentiment_scores.neutral * 100).toFixed(1)}%
                        </Text>
                        <Text fontSize="xs" as="span">
                          Negative: {(article.sentiment_scores.negative * 100).toFixed(1)}%
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                ))
              ) : (
                <Text>No news articles available for {ticker}</Text>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default StockDetails; 