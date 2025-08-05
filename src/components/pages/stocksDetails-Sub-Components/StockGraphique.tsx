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
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import apiService, { SentimentAnalysis } from '../../../clients/ApiService';


type StockGraphiqueProps = {
    ticker: string | undefined;
    historicalData: { date: string, price: number, volume: number }[]
};

const StockGraphique: React.FC<StockGraphiqueProps> = ({ ticker, historicalData }) => {
    const [loading, setLoading] = useState(true);
    const [sentimentData, setSentimentData] = useState<SentimentAnalysis[]>([]);

    useEffect(() => {

        setLoading(true);

        const fetchInformation = async () => {
            try {
                // Fetch sentiment analysis
                const sentimentAnalysis = await apiService.getSentimentAnalysis(ticker);
                setSentimentData(sentimentAnalysis);
                setLoading(false);
            }
            catch (error) {
                console.log(error)
                setLoading(false);
            }
        }

        fetchInformation()
    }, [])

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



    return (
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

                    {/* {prediction && (
                        <Box p={4} borderWidth="1px" borderRadius="md" bg="blue.50">
                            <Heading size="sm" mb={2}>Price Prediction Insight</Heading>
                            <Text>
                                Based on our {prediction.model_type} model, we predict that {ticker} will be priced at
                                ${prediction.predicted_price.toFixed(2)} on {new Date(prediction.date).toLocaleDateString()}.
                                This prediction has a confidence score of {(prediction.confidence * 100).toFixed(1)}%.
                            </Text>
                        </Box>
                    )} */}
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
    )
}

export default StockGraphique;