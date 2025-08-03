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
  Spinner,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Button
} from '@chakra-ui/react';
import apiService, { StockData } from '../../clients/ApiService';
import { getBusinessDateRange } from '../../utils/dateUtils';
import StockGraphique from './stocksDetails-Sub-Components/StockGraphique';
import Prediction from './stocksDetails-Sub-Components/Prediction';
import StockInformation from './stocksDetails-Sub-Components/StockInformation';

const StockDetails: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState<{date: string, price: number, volume:number}[]>([]);
  const [stockName, setStockName] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;

      setLoading(true);
      setError('');

      try {

        // Fetch historical data
        const { startDate, endDate } = getBusinessDateRange();
        const historicalData = await apiService.getStockDataHistory(ticker, startDate, endDate);

        // // Set the company name from the response
        setStockName(historicalData.name);

        // // Set the historical data as before
        const formattedHistoricalData = formatHistoricalData(historicalData.data);
        console.log(formattedHistoricalData)
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

  // Helper to calculate price change and percent change
  const getPriceChange = () => {
    if (historicalData.length < 2) return null;
    const last = historicalData[historicalData.length - 1];
    const prev = historicalData[historicalData.length - 2];
    const change = last.price - prev.price;
    const percent = (change / prev.price) * 100;
    return {
      change: change.toFixed(2),
      percent: percent.toFixed(2),
      isPositive: change >= 0
    };
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Flex justify="space-between" align="center" mb={4}>
            <Container centerContent py={10}>
              <Spinner size="xl" color="brand.500" />
              <Text mt={4}>Loading Information...</Text>
            </Container> 
          </Flex>
        </Box>

        <Container centerContent py={10}>
          <Spinner size="xl" color="brand.500" />
          <Text mt={4}>Loading stock data...</Text>
        </Container>
      </Container>
    )
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
          <StockInformation ticker={ticker} stockName= {stockName}/>

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
                  {(() => {
                    const priceChange = getPriceChange();
                    if (priceChange) {
                      return (
                        <Text color={priceChange.isPositive ? "green.500" : "red.500"}>
                          {priceChange.isPositive ? "+" : ""}
                          {priceChange.change} ({priceChange.isPositive ? "+" : ""}
                          {priceChange.percent}%) Today
                        </Text>
                      );
                    } else {
                      return <Text color="gray.500">No change data</Text>;
                    }
                  })()}
                </StatHelpText>
              </Stat>
            </Box>
          </GridItem>

          <Prediction ticker={ticker}/>
        </Grid>
      </Box>

      <StockGraphique ticker = {ticker} historicalData={historicalData} />
    </Container>
  );
};

export default StockDetails; 
