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
        const publickey = await fetch(`${this.baseUrl}/auth/publickey`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
        const publicKeyResponse: PublicKeyResponse = await publickey.json();

        const loginBody: LoginRequest = { username, password };

        const response = await fetch(`${this.baseUrl}/auth/signin`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({EncryptedData: encryptCredentials(publicKeyResponse.publicKey, loginBody)
            }),
        });
    
        if (!response.ok) {
            // You can handle specific status codes or error messages as needed
            throw new Error(`Login failed with status: ${response.status}`);
        }
    
        const token = await response.text();

        const validationResponse = await fetch(`${this.baseUrl}/user/validate`, {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
            }
        });

        if (!validationResponse.ok) {
            // You can handle specific status codes or error messages as needed
            throw new Error(`Login Validation failed with status: ${response.status}`);
        }

        return token;
    }
}

export const encryptCredentials = (publicKeyPem: string, credentials: LoginRequest): string => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encryptedData = publicKey.encrypt(JSON.stringify(credentials), 'RSA-OAEP', {
    md: forge.md.sha256.create(),
  });
  return forge.util.encode64(encryptedData);
};

export interface PublicKeyResponse {
    publicKey: string;
  }

export interface LoginRequest {
    username: string;
    password: string;
  }