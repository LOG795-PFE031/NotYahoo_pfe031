import forge from 'node-forge';

export class AuthServer {
    private baseUrl: string;

    constructor(baseUrl: string) {
      this.baseUrl = baseUrl;
    }
  
    /**
     * Sends a POST request to the /login endpoint with username/password.
     * Returns a Promise with the parsed JSON data on success.
     */
    public async login(
      username: string,
      password: string
    ): Promise<string> {
        try {
            console.log(`Connecting to auth server at: ${this.baseUrl}`);
            
            // Create the expected format - simple username and password
            const requestBody = {
                username,
                password
            };
            
            console.log('Sending signin request with credentials');
            
            const response = await fetch(`${this.baseUrl}/auth/signin`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
        
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error(`Login failed with status: ${response.status} - ${errorText}`);
            }
        
            const token = await response.text();
            console.log('Got token, length:', token.length);

            console.log('Validating token...');
            const validationResponse = await fetch(`${this.baseUrl}/user/validate`, {
                method: 'GET',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                }
            });

            if (!validationResponse.ok) {
                const errorText = await validationResponse.text();
                throw new Error(`Login Validation failed with status: ${validationResponse.status} - ${errorText}`);
            }

            console.log('Token validated successfully');
            return token;
        } catch (error) {
            console.error('AuthServer login error:', error);
            throw error;
        }
    }

    /**
     * Alternative login method using encrypted credentials.
     * This can be used if the first approach doesn't work.
     */
    public async loginEncrypted(
        username: string,
        password: string
    ): Promise<string> {
        try {
            console.log(`[Encrypted] Connecting to auth server at: ${this.baseUrl}`);
            
            const publicKeyResponse = await fetch(`${this.baseUrl}/auth/publickey`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
            });
              
            if (!publicKeyResponse.ok) {
                throw new Error(`Failed to get public key: ${publicKeyResponse.status} - ${await publicKeyResponse.text()}`);
            }

            const publicKeyData: PublicKeyResponse = await publicKeyResponse.json();
            console.log('[Encrypted] Got public key');

            const credentials: LoginRequest = { username, password };
            
            // Encrypt the data
            const encryptedData = encryptCredentials(publicKeyData.publicKey, credentials);
            
            // Try with encrypted data format
            const response = await fetch(`${this.baseUrl}/auth/signin`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username: encryptedData,
                    password: encryptedData
                }),
            });
        
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Encrypted] Server error response:', errorText);
                throw new Error(`Login failed with status: ${response.status} - ${errorText}`);
            }
        
            const token = await response.text();
            console.log('[Encrypted] Got token');

            const validationResponse = await fetch(`${this.baseUrl}/user/validate`, {
                method: 'GET',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                }
            });

            if (!validationResponse.ok) {
                const errorText = await validationResponse.text();
                throw new Error(`Login Validation failed with status: ${validationResponse.status} - ${errorText}`);
            }

            return token;
        } catch (error) {
            console.error('[Encrypted] AuthServer login error:', error);
            throw error;
        }
    }
}

export const encryptCredentials = (publicKeyPem: string, credentials: LoginRequest): string => {
  try {
    // Make sure the public key is properly formatted
    if (!publicKeyPem.includes('-----BEGIN')) {
      throw new Error('Invalid public key format');
    }
    
    // Parse the public key
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    
    // Stringify the credentials with proper JSON
    const credentialsJson = JSON.stringify(credentials);
    console.log('Credentials JSON length:', credentialsJson.length);
    
    // Encrypt with RSA-OAEP
    const encryptedData = publicKey.encrypt(credentialsJson, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
    });
    
    // Base64 encode the result
    const base64Result = forge.util.encode64(encryptedData);
    console.log('Encrypted data length (base64):', base64Result.length);
    
    return base64Result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt credentials: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export interface PublicKeyResponse {
    publicKey: string;
  }

export interface LoginRequest {
    username: string;
    password: string;
  }