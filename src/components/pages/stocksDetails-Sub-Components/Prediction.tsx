import { useEffect, useState } from "react";
import apiService, { StockPrediction } from "../../../clients/ApiService";
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
    useToast,
    Button
} from '@chakra-ui/react';

type PredictionProps = {
    ticker: string;
};

const Prediction: React.FC<PredictionProps> = ({ ticker }) => {
    const toast = useToast();
    const [buttonClickable, setButtonClickable] = useState(false);
    const [model, setModel] = useState('lstm');
    const [allModelType, setAllModelType] = useState([])

    const [loading, setLoading] = useState(true);
    const [prediction, setPrediction] = useState<StockPrediction | null>(null);
    useEffect(() => {
        const executeAsync = async () => {
            try {
                const listOfModelType = await apiService.getModelsTypes()
                setAllModelType(listOfModelType.types)

                // Fetch prediction data
                const predictionData = await apiService.getStockPrediction(ticker, model);
                setPrediction(predictionData);
                setLoading(false)

            }
            catch (error) {
                setLoading(false)
                console.log(error)
            }
        }

        executeAsync()

    }, [])

    if (loading) {
        return (
            <Container centerContent py={10}>
                <Spinner size="xl" color="brand.500" />
                <Text mt={4}>Loading stock data...</Text>
            </Container>
        );
    }

    const trainData = async () => {
        try {
            if (!ticker) throw new Error('Ticker is undefined');
            apiService.trainStock(ticker, model).then(async (response) => {
                if (response == 200) {
                    setLoading(true)
                    toast({
                        title: 'Training Stock Successful',
                        description: 'You have been successfully train the stock',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                    });

                    const predictionData = await apiService.getStockPrediction(ticker, model);
                    setPrediction(predictionData);
                    setButtonClickable(false)
                    setLoading(false)
                }
            })
        } catch (err) {
            console.error('Error fetching prediction:', err);
            toast({
                title: 'Error',
                description: 'Failed to train stock data.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }
    const updateModelType = async (model_type: string) => {
        setModel(model_type)
        setLoading(true);

        try {
            if (!ticker) throw new Error('Ticker is undefined');
            const dataPredict = await apiService.getStockPrediction(ticker, model_type);
            setPrediction(dataPredict);
            setButtonClickable(false)
        } catch (err) {
            console.error('Error fetching prediction:', err);
            toast({
                title: 'Error',
                description: 'Failed to load stock data.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    }


    return (
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
                            </Flex>
                        </StatHelpText>
                    </Stat>
                ) : (
                    <Text>No prediction data available</Text>
                )}
                <Flex align="center" justify="space-between">
                    {!prediction ? (
                        <Button
                            size="sm"
                            colorScheme="brand"
                            disabled={buttonClickable}
                            onClick={() => { setButtonClickable(true); trainData() }}
                        >
                            Train Data
                        </Button>

                    ) : ""

                    }

                    <Text fontSize="sm" color="gray.500">Model:</Text>
                    <select value={model} onChange={(type) => updateModelType(type.target.value)} style={{ backgroundColor: 'beige', width: '150px' }}>
                        {allModelType.map((val, index) => (
                            <option key={index} value={val}>
                                {val}
                            </option>
                        ))}
                    </select>
                </Flex>
            </Box>
        </GridItem>
    )
}

export default Prediction;