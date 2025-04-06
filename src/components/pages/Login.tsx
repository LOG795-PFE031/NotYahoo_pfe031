import { Box, Button, Container, Flex, FormLabel, Heading, Input } from "@chakra-ui/react";
import React from "react";
import { PasswordInput } from "../ui/password-input";


function Login() {
    
    return(
        <Container py={8}>
            <Flex align="center">
                <Box p={5} shadow="md">
                    <Heading size="sm" my={3}>Username</Heading>
                    <Input/>
                    <Heading size="sm" my={3}>Password</Heading>
                    <PasswordInput/>
                    <Button my={3}>Login</Button>
                </Box>
            </Flex>
        </Container>
    )
};

export default Login;