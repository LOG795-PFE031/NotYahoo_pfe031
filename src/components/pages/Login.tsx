import { Box, Button, Container, Flex, Heading, Input } from "@chakra-ui/react";
import { AuthServer } from "../../clients/AuthServer";
import { PasswordInput } from "../ui/password-input";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const authServer = new AuthServer('https://localhost:8081');
type LoginProps ={
    setIsLoggedIn: (value: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setIsLoggedIn }) => {
    const navigate = useNavigate();
    
    const [accountUsername, setAccountUsername] = useState('');
    const [accountPassword, setAccountPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleAccountLogin = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      try {
        const loginResponse = await authServer.login(accountUsername, accountPassword);
        console.log('Login successful, token:', loginResponse);
        // Optionally: Save token (e.g., localStorage) and close modal on success
        axios.defaults.headers.common['Authorization'] = `Bearer ${loginResponse}`;
        axios.defaults.headers.post['Content-Type'] = 'application/json';

        setIsLoggedIn(true);
        navigate("/portfolio");
      } catch (error: any) {
        console.error('Login error:', error);
        setLoginError(error.message || 'Login failed');
      }
    };
    return(
        <form onSubmit={handleAccountLogin}>
            <Container>
                <Flex align="center">
                    <Box p={5}>
                        <Heading size="sm" my={3}>Username</Heading>
                        <Input onChange={(e) => setAccountUsername(e.target.value)}/>
                        <Heading size="sm" my={3}>Password</Heading>
                        <PasswordInput onChange={(e) => setAccountPassword(e.target.value)}/>
                        <Button type="submit" my={3}>Login</Button>
                    </Box>
                </Flex>
            </Container>
        </form>
        
    )
};

export default Login;