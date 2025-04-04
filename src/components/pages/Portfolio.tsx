import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow
} from '@chakra-ui/react';
import { IconPlus, IconTrash, IconEdit, IconChartPie } from '@tabler/icons-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

// Sample portfolio data
interface StockHolding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
}

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#48C9B0'];

const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Sample portfolio data
  const [holdings, setHoldings] = useState<StockHolding[]>([
    { id: '1', symbol: 'AAPL', name: 'Apple Inc.', shares: 10, purchasePrice: 150.75, currentPrice: 191.56 },
    { id: '2', symbol: 'MSFT', name: 'Microsoft Corp.', shares: 5, purchasePrice: 380.50, currentPrice: 417.82 },
    { id: '3', symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 8, purchasePrice: 130.25, currentPrice: 176.32 },
    { id: '4', symbol: 'AMZN', name: 'Amazon.com Inc.', shares: 12, purchasePrice: 140.80, currentPrice: 180.75 },
  ]);
  
  const [newStock, setNewStock] = useState<Partial<StockHolding>>({
    symbol: '',
    name: '',
    shares: 0,
    purchasePrice: 0
  });
  
  // Calculate portfolio value and performance metrics
  const calculatePortfolioMetrics = () => {
    let totalValue = 0;
    let totalCost = 0;
    
    holdings.forEach(stock => {
      totalValue += stock.currentPrice * stock.shares;
      totalCost += stock.purchasePrice * stock.shares;
    });
    
    const totalGainLoss = totalValue - totalCost;
    const percentageGainLoss = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    
    return {
      totalValue,
      totalCost,
      totalGainLoss,
      percentageGainLoss
    };
  };
  
  const metrics = calculatePortfolioMetrics();
  
  // Prepare data for pie chart
  const pieChartData = holdings.map(stock => ({
    name: stock.symbol,
    value: stock.currentPrice * stock.shares
  }));
  
  // Handle adding a new stock
  const handleAddStock = () => {
    if (newStock.symbol && newStock.shares && newStock.purchasePrice) {
      setHoldings([
        ...holdings,
        {
          id: crypto.randomUUID(),
          symbol: newStock.symbol.toUpperCase(),
          name: newStock.name || newStock.symbol.toUpperCase(),
          shares: Number(newStock.shares),
          purchasePrice: Number(newStock.purchasePrice),
          currentPrice: Number(newStock.purchasePrice) // For demo purposes, setting current price same as purchase price
        }
      ]);
      
      setNewStock({
        symbol: '',
        name: '',
        shares: 0,
        purchasePrice: 0
      });
      
      onClose();
    }
  };
  
  // Handle removing a stock
  const handleRemoveStock = (id: string) => {
    setHoldings(holdings.filter(stock => stock.id !== id));
  };
  
  // Handle viewing a stock
  const handleViewStock = (symbol: string) => {
    navigate(`/stock/${symbol}`);
  };
  
  // Calculate individual stock metrics
  const calculateStockPerformance = (stock: StockHolding) => {
    const value = stock.currentPrice * stock.shares;
    const cost = stock.purchasePrice * stock.shares;
    const gainLoss = value - cost;
    const percentageGainLoss = (gainLoss / cost) * 100;
    
    return {
      value,
      gainLoss,
      percentageGainLoss
    };
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>Your Portfolio</Heading>
          <Text color="gray.600">Track and manage your investments</Text>
        </Box>
        <Button 
          leftIcon={<IconPlus size={16} />} 
          colorScheme="blue" 
          onClick={onOpen}
        >
          Add Stock
        </Button>
      </Flex>
      
      {/* Portfolio Overview */}
      <Box mb={10}>
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={6}>
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
            <Stat>
              <StatLabel>Total Value</StatLabel>
              <StatNumber>${metrics.totalValue.toFixed(2)}</StatNumber>
              <StatHelpText>
                <StatArrow type={metrics.totalGainLoss >= 0 ? 'increase' : 'decrease'} />
                ${Math.abs(metrics.totalGainLoss).toFixed(2)} ({metrics.percentageGainLoss.toFixed(2)}%)
              </StatHelpText>
            </Stat>
          </Box>
          
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
            <Stat>
              <StatLabel>Total Cost</StatLabel>
              <StatNumber>${metrics.totalCost.toFixed(2)}</StatNumber>
            </Stat>
          </Box>
          
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
            <Stat>
              <StatLabel>Total Gain/Loss</StatLabel>
              <StatNumber color={metrics.totalGainLoss >= 0 ? 'green.500' : 'red.500'}>
                ${metrics.totalGainLoss.toFixed(2)}
              </StatNumber>
            </Stat>
          </Box>
          
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
            <Stat>
              <StatLabel>Performance</StatLabel>
              <StatNumber color={metrics.percentageGainLoss >= 0 ? 'green.500' : 'red.500'}>
                {metrics.percentageGainLoss.toFixed(2)}%
              </StatNumber>
              <StatHelpText>Since purchase</StatHelpText>
            </Stat>
          </Box>
        </SimpleGrid>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <Box shadow="md" borderWidth="1px" borderRadius="md" p={5}>
            <Heading size="md" mb={4}>Portfolio Allocation</Heading>
            <Box height="300px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [
                    `$${typeof value === 'number' ? value.toFixed(2) : Number(value).toFixed(2)}`, 
                    'Value'
                  ]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>
          
          <Box shadow="md" borderWidth="1px" borderRadius="md" p={5}>
            <Heading size="md" mb={4}>Performance Overview</Heading>
            <Box overflowY="auto" maxH="300px">
              {holdings.map(stock => {
                const performance = calculateStockPerformance(stock);
                const percentWidth = Math.min(Math.abs(performance.percentageGainLoss), 100);
                
                return (
                  <Box key={stock.id} mb={4}>
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text fontWeight="bold">{stock.symbol}</Text>
                      <Text 
                        fontWeight="medium" 
                        color={performance.percentageGainLoss >= 0 ? 'green.500' : 'red.500'}
                      >
                        {performance.percentageGainLoss.toFixed(2)}%
                      </Text>
                    </Flex>
                    <Progress 
                      value={percentWidth} 
                      colorScheme={performance.percentageGainLoss >= 0 ? 'green' : 'red'} 
                      size="sm" 
                      borderRadius="full"
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        </SimpleGrid>
      </Box>
      
      {/* Holdings Table */}
      <Box shadow="md" borderWidth="1px" borderRadius="md" overflow="hidden">
        <Heading size="md" p={5} borderBottomWidth="1px">
          Your Holdings
        </Heading>
        
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Symbol</Th>
                <Th>Name</Th>
                <Th isNumeric>Shares</Th>
                <Th isNumeric>Purchase Price</Th>
                <Th isNumeric>Current Price</Th>
                <Th isNumeric>Total Value</Th>
                <Th isNumeric>Gain/Loss</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {holdings.map(stock => {
                const performance = calculateStockPerformance(stock);
                
                return (
                  <Tr key={stock.id}>
                    <Td fontWeight="medium">{stock.symbol}</Td>
                    <Td>{stock.name}</Td>
                    <Td isNumeric>{stock.shares}</Td>
                    <Td isNumeric>${stock.purchasePrice.toFixed(2)}</Td>
                    <Td isNumeric>${stock.currentPrice.toFixed(2)}</Td>
                    <Td isNumeric>${performance.value.toFixed(2)}</Td>
                    <Td isNumeric color={performance.gainLoss >= 0 ? 'green.500' : 'red.500'}>
                      ${performance.gainLoss.toFixed(2)} ({performance.percentageGainLoss.toFixed(2)}%)
                    </Td>
                    <Td>
                      <Flex>
                        <Button 
                          size="sm" 
                          colorScheme="blue" 
                          variant="ghost" 
                          onClick={() => handleViewStock(stock.symbol)}
                          mr={2}
                        >
                          <IconChartPie size={18} />
                        </Button>
                        <Button 
                          size="sm" 
                          colorScheme="red" 
                          variant="ghost" 
                          onClick={() => handleRemoveStock(stock.id)}
                        >
                          <IconTrash size={18} />
                        </Button>
                      </Flex>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </Box>
      
      {/* Add Stock Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Stock to Portfolio</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Symbol</FormLabel>
              <Input 
                value={newStock.symbol}
                onChange={(e) => setNewStock({...newStock, symbol: e.target.value})}
                placeholder="e.g. AAPL"
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Company Name (Optional)</FormLabel>
              <Input 
                value={newStock.name}
                onChange={(e) => setNewStock({...newStock, name: e.target.value})}
                placeholder="e.g. Apple Inc."
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Number of Shares</FormLabel>
              <Input 
                type="number"
                value={newStock.shares || ''}
                onChange={(e) => setNewStock({...newStock, shares: parseInt(e.target.value)})}
                placeholder="e.g. 10"
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Purchase Price Per Share</FormLabel>
              <Input 
                type="number"
                value={newStock.purchasePrice || ''}
                onChange={(e) => setNewStock({...newStock, purchasePrice: parseFloat(e.target.value)})}
                placeholder="e.g. 150.75"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleAddStock}
              isDisabled={!newStock.symbol || !newStock.shares || !newStock.purchasePrice}
            >
              Add to Portfolio
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Portfolio; 