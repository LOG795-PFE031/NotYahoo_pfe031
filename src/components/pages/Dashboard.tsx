import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Text, 
  SimpleGrid, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  Button, 
  Flex, 
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Spinner,
  Center,
  
} from '@chakra-ui/react';
import { IconArrowUpRight, IconChartLine, IconNews, IconRobot } from '@tabler/icons-react';
import { apiService } from '../../clients/ApiService';

// Sample data for popular stocks
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 191.56, change: 2.37, percentChange: 1.25 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 176.32, change: 1.76, percentChange: 1.01 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 417.82, change: 3.45, percentChange: 0.83 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 180.75, change: -0.83, percentChange: -0.46 },
];

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [trending, setTrending] = useState(POPULAR_STOCKS);
  
  // In a real application, this would fetch actual data
  useEffect(() => {
    // Simulating API call
    setIsLoading(true);
    
    // Fake delay to simulate API call
    const timer = setTimeout(() => {
      setTrending(POPULAR_STOCKS);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <Box>
      {/* Hero section */}
      <Box bg="brand.500" color="white" py={12} px={4} borderRadius="lg" mb={8}>
        <Flex maxW="1200px" mx="auto" direction={{ base: 'column', md: 'row' }} align="center">
          <Box flex="1" mr={{ base: 0, md: 8 }} mb={{ base: 8, md: 0 }}>
            <Heading as="h1" size="2xl" mb={4}>
              Make Smarter Investment Decisions
            </Heading>
            <Text fontSize="lg" mb={6}>
              Advanced stock predictions and market sentiment analysis powered by AI. 
              Get insights to help optimize your portfolio and maximize returns.
            </Text>
            <Flex gap={4}>
              <Button 
                as={RouterLink} 
                to="/stock/AAPL" 
                colorScheme="white" 
                variant="outline" 
                size="lg"
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                Explore Stocks
              </Button>
              <Button 
                as={RouterLink} 
                to="/advisor" 
                bg="white" 
                color="brand.500" 
                size="lg"
                _hover={{ bg: 'whiteAlpha.900' }}
              >
                AI Advisor
              </Button>
            </Flex>
          </Box>
          <Box flex="1">
            {/* This could be a stock chart or an illustration */}
            <Box 
              bg="whiteAlpha.200" 
              borderRadius="lg" 
              p={8} 
              height="300px" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
            >
              <Icon as={IconChartLine} w={24} h={24} />
            </Box>
          </Box>
        </Flex>
      </Box>
      
      {/* Trending stocks section */}
      <Box mb={12}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h2" size="lg">
            Popular Stocks
          </Heading>
          <Button 
            as={RouterLink} 
            to="/stocks" 
            rightIcon={<IconArrowUpRight size={16} />} 
            variant="ghost" 
            colorScheme="blue"
          >
            View All
          </Button>
        </Flex>
        
        {isLoading ? (
          <Center py={10}>
            <Spinner size="xl" color="brand.500" />
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
            {trending.map((stock) => (
              <Card key={stock.symbol} as={RouterLink} to={`/stock/${stock.symbol}`} _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}>
                <CardBody>
                  <Stat>
                    <Flex justify="space-between" mb={2}>
                      <StatLabel fontSize="md">{stock.symbol}</StatLabel>
                      <Text fontSize="sm" color="gray.500">{stock.name}</Text>
                    </Flex>
                    <StatNumber fontSize="2xl">${stock.price.toFixed(2)}</StatNumber>
                    <StatHelpText>
                      <StatArrow type={stock.percentChange >= 0 ? 'increase' : 'decrease'} />
                      {stock.percentChange.toFixed(2)}% ({stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)})
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Box>
      
      {/* Features section */}
      <Box mb={12}>
        <Heading as="h2" size="lg" mb={6}>
          Our Features
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          <Card>
            <CardHeader>
              <Flex align="center">
                <Icon as={IconChartLine} w={6} h={6} color="brand.500" mr={2} />
                <Heading size="md">Stock Predictions</Heading>
              </Flex>
            </CardHeader>
            <CardBody>
              <Text>Get AI-powered predictions for stock prices with confidence scores, backed by sophisticated machine learning models.</Text>
            </CardBody>
            <CardFooter>
              <Button as={RouterLink} to="/stock/AAPL" variant="outline" colorScheme="blue" size="sm">
                Try It Now
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <Flex align="center">
                <Icon as={IconNews} w={6} h={6} color="brand.500" mr={2} />
                <Heading size="md">Sentiment Analysis</Heading>
              </Flex>
            </CardHeader>
            <CardBody>
              <Text>Analyze market sentiment from news articles and social media to understand the emotional context behind market movements.</Text>
            </CardBody>
            <CardFooter>
              <Button as={RouterLink} to="/stock/AAPL" variant="outline" colorScheme="blue" size="sm">
                Explore Sentiment
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <Flex align="center">
                <Icon as={IconRobot} w={6} h={6} color="brand.500" mr={2} />
                <Heading size="md">AI Financial Advisor</Heading>
              </Flex>
            </CardHeader>
            <CardBody>
              <Text>Chat with our AI advisor to get personalized investment advice and answers to your financial questions in real-time.</Text>
            </CardBody>
            <CardFooter>
              <Button as={RouterLink} to="/advisor" variant="outline" colorScheme="blue" size="sm">
                Chat Now
              </Button>
            </CardFooter>
          </Card>
        </SimpleGrid>
      </Box>
    </Box>
  );
};

export default Dashboard; 