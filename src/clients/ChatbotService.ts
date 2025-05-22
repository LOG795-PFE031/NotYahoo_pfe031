import { ChatOpenAI } from "@langchain/openai";
import { ConversationSummaryBufferMemory, ConversationSummaryBufferMemoryInput } from "langchain/memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { LLMChain, ConversationChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import axios from "axios";

// Risk tolerance options
export const RISK_TOLERANCE_OPTIONS = {
  '1': 'low',
  '2': 'medium',
  '3': 'high'
};

// Investment goals options
export const INVESTMENT_GOALS_OPTIONS = {
  '1': 'Conservative Income (Focus on stable, dividend-paying investments)',
  '2': 'Balanced Growth (Mix of growth and income)',
  '3': 'Aggressive Growth (Focus on capital appreciation)',
  '4': 'Retirement Planning',
  '5': 'Short-term Trading'
};

// Available sectors
export const AVAILABLE_SECTORS = {
  '1': 'Technology',
  '2': 'Healthcare',
  '3': 'Financial Services',
  '4': 'Consumer Goods',
  '5': 'Energy',
  '6': 'Real Estate',
  '7': 'Industrial',
  '8': 'Communications',
  '9': 'Materials',
  '10': 'Utilities'
};

// User profile interface
interface UserProfile {
  userId: string;
  riskTolerance: string;
  investmentGoals: string;
  preferredSectors: string[];
}

// Conversation interfaces
interface ProfileUpdate {
  risk_tolerance?: string;
  investment_goals?: string;
  preferred_sectors?: string[];
}

// Function definition for updating profile
const updateProfileFunction = {
  name: "update_profile",
  description: "Update the user's financial profile based on their input.",
  parameters: {
    type: "object",
    properties: {
      risk_tolerance: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "User's risk tolerance level"
      },
      investment_goals: {
        type: "string",
        description: "User's investment goals (e.g., growth, income)"
      },
      preferred_sectors: {
        type: "array",
        items: { type: "string" },
        description: "Sectors the user is interested in (e.g., tech, healthcare)"
      }
    },
    required: []
  }
};

// API URL
const API_URL = import.meta.env.VITE_PORTFOLIO_API_URL || 'http://localhost:55616';
const MONGODB_URI = import.meta.env.VITE_MONGODB_URL || 'mongodb://mongo:mongo@localhost:27017';

// Message interface for API response
interface ApiConversationMessage {
  userId: string;
  message: string;
  sender: string;
  timestamp: string | Date;
}

// Custom memory class for persistence via API
export class PersistentConversationSummaryBufferMemory extends ConversationSummaryBufferMemory {
  predictor: ChatOpenAI;
  private userId: string;
  private apiUrl: string;
  private mongoUrl: string;
  protected summarizer: LLMChain;

  constructor(userId: string, config: ConversationSummaryBufferMemoryInput) {
    super(config);
    this.userId = userId;
    this.apiUrl = API_URL;
    this.mongoUrl = MONGODB_URI;
    console.log(`PersistentConversationSummaryBufferMemory initializing with API URL: ${this.apiUrl}`);
    console.log(`MongoDB connection: ${this.mongoUrl}`);
    
    // Initialize the predictor with API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.predictor = new ChatOpenAI({ 
      temperature: 0,
      openAIApiKey: apiKey 
    });
    
    // Initialize the summarizer
    const summaryPrompt = PromptTemplate.fromTemplate(
      "Summarize this financial advisory conversation in a concise paragraph:\n\n{input}"
    );
    this.summarizer = new LLMChain({
      llm: this.predictor,
      prompt: summaryPrompt
    });
  }

  /** Load conversation history from API */
  async loadFromDatabase(): Promise<void> {
    try {
      console.log(`Loading conversation for user: ${this.userId}`);
      
      // Use browser-compatible API call
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      try {
        // API endpoint to get conversation history with MongoDB connection
        const response = await axios.get(
          `${this.apiUrl}/api/conversations/${this.userId}?mongoUrl=${encodeURIComponent(this.mongoUrl)}`, 
          { headers }
        );
        
        if (response.status === 200 && response.data && response.data.messages) {
          const messages = response.data.messages as ApiConversationMessage[];
          console.log(`Found ${messages.length} messages in conversation history`);
          
          if (messages.length > 0) {
            // Convert stored messages to LangChain message objects
            const messagesArray = messages.map((m: ApiConversationMessage) => {
              return m.sender === 'user' 
                ? new HumanMessage(m.message) 
                : new AIMessage(m.message);
            });
            
            console.log(`Converted ${messagesArray.length} messages to LangChain format`);
            
            // Add messages to memory through the parent class
            let previousInput = "";
            let previousOutput = "";
            let pairCount = 0;
            
            for (let i = 0; i < messagesArray.length; i++) {
              const message = messagesArray[i];
              
              if (message._getType && typeof message._getType === 'function') {
                const type = message._getType();
                
                if (type === 'human') {
                  previousInput = message.content as string;
                } else if (type === 'ai') {
                  previousOutput = message.content as string;
                  
                  // Save both messages as a pair when we have both input and output
                  if (previousInput) {
                    await this.saveContext({ input: previousInput }, { output: previousOutput });
                    previousInput = "";
                    previousOutput = "";
                    pairCount++;
                  }
                }
              }
            }
            
            console.log(`Saved ${pairCount} message pairs to memory context`);
            
            // If there's an unpaired human message at the end, save it too
            if (previousInput) {
              await this.saveContext({ input: previousInput }, { output: "" });
            }
          }
        } else {
          console.log("No conversation history found or invalid response format");
        }
      } catch (err) {
        console.error("Error fetching conversation history from API:", err);
      }
    } catch (error) {
      console.error("Error loading conversation from API:", error);
    }
  }

  /** Override saveContext to persist through API */
  async saveContext(inputValues: Record<string, unknown>, outputValues: Record<string, unknown>): Promise<void> {
    try {
      // Get the input and output messages
      const input = inputValues.input as string || '';
      const output = outputValues.output as string || '';
      
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Since direct MongoDB connections aren't supported in browsers,
      // we'll use the API endpoint but configure it to connect to MongoDB on the server
      
      // Save the user message if present
      if (input) {
        console.log(`Saving user message for ${this.userId}: "${input.substring(0, 50)}..."`);
        const userMessagePayload = {
          userId: this.userId,
          message: input,
          sender: 'user',
          timestamp: new Date(),
          mongoUrl: this.mongoUrl // Pass the MongoDB URL to the server
        };
        
        try {
          await axios.post(`${this.apiUrl}/api/conversations`, userMessagePayload, { headers });
          console.log(`Successfully saved user message to MongoDB for ${this.userId}`);
        } catch (err) {
          console.error("Error saving user message:", err);
          console.log("Falling back to in-memory storage only");
        }
      }
      
      // Save the bot message if present
      if (output) {
        console.log(`Saving bot message for ${this.userId}: "${output.substring(0, 50)}..."`);
        const botMessagePayload = {
          userId: this.userId,
          message: output,
          sender: 'bot',
          timestamp: new Date(),
          mongoUrl: this.mongoUrl // Pass the MongoDB URL to the server
        };
        
        try {
          await axios.post(`${this.apiUrl}/api/conversations`, botMessagePayload, { headers });
          console.log(`Successfully saved bot message to MongoDB for ${this.userId}`);
        } catch (err) {
          console.error("Error saving bot message:", err);
          console.log("Falling back to in-memory storage only");
        }
      }
      
      // Update in-memory history in LangChain
      await super.saveContext(inputValues, outputValues);
    } catch (error) {
      console.error("Failed to save conversation context:", error);
      // Continue with in-memory storage only
      await super.saveContext(inputValues, outputValues);
    }
  }
  
  /** Save conversation summary to API */
  async saveConversationSummary(): Promise<string> {
    try {
      // Use messages directly from memory if chatHistory isn't available
      let messagesForSummary;
      if (!this.chatHistory) {
        console.log("ChatHistory not available, using current memory");
        // Get messages from this memory instance itself
        const memoryVariables = await this.loadMemoryVariables({});
        messagesForSummary = memoryVariables.history || [];
      } else {
        console.log("Using chatHistory for summary");
        messagesForSummary = await this.chatHistory.getMessages();
      }
      console.log("Memory variables:", messagesForSummary);

      // Extract text from the messages for the summary
      const textMessages: string[] = [];
      
      for (const msg of messagesForSummary) {
        let role = 'assistant';
        let content = '';
        
        if (msg && typeof msg === 'object') {
          // Check if msg has the _getType method
          if ('_getType' in msg && typeof msg._getType === 'function') {
            const type = msg._getType();
            if (type === 'human') {
              role = 'user';
            } else if (type === 'ai') {
              role = 'assistant';
            } else if (type === 'system') {
              role = 'system';
            }
          } else if ('role' in msg) {
            role = String(msg.role);
          }
          
          // Get the message content as string
          if ('content' in msg && msg.content !== null && msg.content !== undefined) {
            content = String(msg.content);
          } else if ('text' in msg && msg.text !== null && msg.text !== undefined) {
            content = String(msg.text);
          } else {
            content = String(msg);
          }
        } else if (msg !== null && msg !== undefined) {
          content = String(msg);
        }
        
        if (content && content.trim() !== '') {
          textMessages.push(`${role}: ${content}`);
        }
      }
      
      console.log("Formatted messages for summary:", textMessages);

      try {
        // Generate the summary using the ChatOpenAI model directly
        const messagesText = textMessages.join('\n\n');
        const summaryPrompt = `Summarize this financial advisory conversation in a concise paragraph:\n\n${messagesText}`;
        
        // Use the predictor model with properly typed parameters
        const response = await this.predictor.call([
          { role: "system", content: "You are a helpful financial conversation summarizer." },
          { role: "user", content: summaryPrompt }
        ]);
        
        // Extract content as string with proper type checking
        let summary = "No summary generated";
        if (response && typeof response === 'object' && 'content' in response) {
          summary = String(response.content || "No summary generated");
        }
        
        console.log("Generated summary:", summary);

        // Save to API instead of MongoDB directly
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
          await axios.post(`${this.apiUrl}/api/conversations/${this.userId}/summary`, {
            userId: this.userId,
            summary,
            timestamp: new Date().toISOString(),
            mongoUrl: this.mongoUrl // Pass MongoDB connection string to the API
          }, { headers });
          
          console.log("Summary saved to MongoDB successfully");
        } catch (err) {
          console.error("Error saving summary to API:", err);
          console.log("Summary will be kept in memory only");
        }
        return summary;
      } catch (err) {
        console.error("Error generating or saving summary:", err);
        return "Error generating or saving summary";
      }
    } catch (error) {
      console.error("Error in saveConversationSummary:", error);
      return "Error in conversation summary process";
    }
  }

  /** Load previous conversation summary from API */
  async loadPreviousSummary(): Promise<string | null> {
    try {
      if (!this.userId) {
        console.warn("No userId provided, cannot load previous summary");
        return null;
      }
      
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      try {
        const response = await axios.get(
          `${this.apiUrl}/api/conversations/${this.userId}/summary?mongoUrl=${encodeURIComponent(this.mongoUrl)}`,
          { headers }
        );
        
        if (response.status === 200 && response.data && response.data.summary) {
          console.log(`Loaded previous summary for user ${this.userId}`);
          return response.data.summary;
        }
        
        console.log("No previous summary found for user");
        return null;
      } catch (err) {
        console.error("Error loading summary from API:", err);
        return null;
      }
    } catch (error) {
      console.error("Error loading previous summary:", error);
      return null;
    }
  }

  // Method to directly test API connection and create a test message
  async createTestMessage(message: string): Promise<boolean> {
    try {
      console.log(`Testing connection to: ${this.apiUrl} with MongoDB at ${this.mongoUrl}`);
      
      const payload = {
        userId: this.userId,
        message: message,
        sender: 'user',
        type: 'text',
        timestamp: new Date().toISOString(),
        mongoUrl: this.mongoUrl
      };
      
      console.log('Sending test payload:', payload);
      
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      try {
        const response = await axios.post(`${this.apiUrl}/api/test-connection`, payload, { headers });
        console.log('MongoDB connection test response:', response.data);
        return true;
      } catch (err) {
        console.error('MongoDB connection test failed:', err);
        return false;
      }
    } catch (error) {
      console.error('API test connection error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
      }
      return false;
    }
  }
}

export class ChatbotService {
  private model!: ChatOpenAI;
  private memory!: PersistentConversationSummaryBufferMemory | null;
  private apiKey: string;
  private userId: string;
  private userProfile: UserProfile = {
    userId: "user1",
    riskTolerance: "medium",
    investmentGoals: "Balanced Growth (Mix of growth and income)",
    preferredSectors: ["Technology", "Healthcare", "Financial Services"]
  };
  private apiUrl: string;
  private chatHistory!: PersistentConversationSummaryBufferMemory | null;
  private chain!: ConversationChain | null;
  private summarizer!: LLMChain;
  private mongoUrl: string;

  constructor(userId: string = "user1") {
    console.log("ChatbotService constructor called");
    this.apiUrl = API_URL;
    this.mongoUrl = MONGODB_URI;
    console.log(`API URL: ${this.apiUrl}, MongoDB URI: ${this.mongoUrl}`);
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    
    // Try to restore session from localStorage
    const savedUserId = localStorage.getItem('chatbot_user_id');
    const lastAuth = localStorage.getItem('chatbot_last_auth');
    
    // Use saved userId if available and not older than 24 hours
    if (savedUserId && lastAuth) {
      const lastAuthTime = new Date(lastAuth).getTime();
      const currentTime = new Date().getTime();
      const hoursSinceLastAuth = (currentTime - lastAuthTime) / (1000 * 60 * 60);
      
      if (hoursSinceLastAuth < 24) {
        console.log(`Restoring session for user ${savedUserId}`);
        this.userId = savedUserId;
      } else {
        console.log('Previous session expired, using provided userId');
        this.userId = userId;
      }
    } else {
      console.log('No previous session found, using provided userId');
      this.userId = userId;
    }
    
    console.log(`ChatbotService initialized with userId: ${this.userId}, API URL: ${this.apiUrl}, MongoDB: ${this.mongoUrl}`);
    this.initializeModel();
    
    // Test connection to MongoDB
    this.testDatabaseConnection().then(success => {
      if (success) {
        console.log("MongoDB connection successful");
      } else {
        console.warn("MongoDB connection failed - continuing with in-memory storage only");
      }
      
      this.setUserId(this.userId); // Initialize for current user
    });
  }

  /** Initialize the OpenAI model */
  private initializeModel() {
    try {
      this.model = new ChatOpenAI({
        openAIApiKey: this.apiKey,
        modelName: "gpt-4.1",
        temperature: 0.7,
        streaming: true,
      });
    } catch (error) {
      console.error("Error initializing the chatbot model:", error);
    }
  }

  /** Initialize memory for the current user */
  private async initializeMemory() {
    if (this.userId) {
      console.log(`Initializing memory for user: ${this.userId}`);
      
      // Make sure model is initialized with API key
      if (!this.model) {
        this.initializeModel();
      }
      
      // Create a new memory instance with this user's ID
      this.memory = new PersistentConversationSummaryBufferMemory(this.userId, {
        llm: this.model,
        maxTokenLimit: 2000, // Increased token limit to store more conversation history
        returnMessages: true,
        memoryKey: "history",
      });
      
      // Also set it as chatHistory for consistency
      this.chatHistory = this.memory;
      
      // Load previous conversations from API
      await this.memory.loadFromDatabase();
      
      // Load the previous summary if available
      const previousSummary = await this.memory.loadPreviousSummary();
      if (previousSummary) {
        console.log("Loaded previous conversation summary");
        // We can add the summary as a system message if needed
      }
      
      console.log("Memory initialized successfully");
    } else {
      console.warn("No userId provided, using default memory");
    }
  }

  /** Load user profile from API */
  private async loadUserProfile() {
    try {
      console.log(`Loading profile for user ${this.userId}`);
      
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.get(
        `${this.apiUrl}/api/users/${this.userId}/profile`,
        { headers }
      );
      
      if (response.status === 200 && response.data) {
        this.userProfile = response.data;
        console.log(`Loaded profile for ${this.userId}:`, this.userProfile);
      } else {
        console.log(`No profile found for ${this.userId}, creating default profile`);
        // Create a default profile if none exists
        this.userProfile = {
          userId: this.userId,
          riskTolerance: "medium",
          investmentGoals: "Balanced Growth (Mix of growth and income)",
          preferredSectors: ["Technology", "Healthcare", "Financial Services"]
        };
        await this.saveUserProfile();
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      // Create a default profile if error occurs
      this.userProfile = {
        userId: this.userId,
        riskTolerance: "medium",
        investmentGoals: "Balanced Growth (Mix of growth and income)",
        preferredSectors: ["Technology", "Healthcare", "Financial Services"]
      };
      await this.saveUserProfile();
    }
  }

  /** Save user profile to API */
  private async saveUserProfile() {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      await axios.post(
        `${this.apiUrl}/api/users/${this.userId}/profile`,
        this.userProfile,
        { headers }
      );
      
      console.log(`Saved profile for ${this.userId}`);
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  }

  /** Update user profile and save changes */
  private updateProfile(updates: ProfileUpdate): boolean {
    try {
      if (updates.risk_tolerance) {
        this.userProfile.riskTolerance = updates.risk_tolerance;
      }
      if (updates.investment_goals) {
        this.userProfile.investmentGoals = updates.investment_goals;
      }
      if (updates.preferred_sectors && Array.isArray(updates.preferred_sectors)) {
        updates.preferred_sectors.forEach((sector: string) => {
          if (!this.userProfile.preferredSectors.includes(sector)) {
            this.userProfile.preferredSectors.push(sector);
          }
        });
      }
      this.saveUserProfile();
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      return false;
    }
  }

  /** Send a message to the chatbot with streaming support */
  async sendMessage(message: string, onTokenStream?: (token: string) => void): Promise<string> {
    try {
      if (!this.model) {
        this.initializeModel();
      }
      
      // Ensure memory is initialized
      if (!this.memory) {
        await this.initializeMemory();
      }

      // Return error if memory is still null
      if (!this.memory) {
        console.error("Failed to initialize memory");
        return "Sorry, I'm having trouble accessing your conversation history. Please try again later.";
      }

      // First save the user's message to memory
      await this.memory.saveContext({ input: message }, { output: "" });
      
      // Load memory including previous conversation history
      const memoryVariables = await this.memory.loadMemoryVariables({});
      const memoryMessages = memoryVariables.history || [];

      // Extract previous conversation summary if available
      let summaryContent = "";
      const conversationHistory = [];
      
      for (const msg of memoryMessages) {
        if (msg._getType && typeof msg._getType === 'function') {
          const type = msg._getType();
          if (type === "system") {
            summaryContent = msg.content;
          } else if (type === "human") {
            conversationHistory.push({ role: "user", content: msg.content });
          } else if (type === "ai") {
            conversationHistory.push({ role: "assistant", content: msg.content });
          }
        }
      }

      // Create a detailed system message that includes all user profile information
      const systemContent = `You are a financial advisor specializing in stocks. 
The user has the following established profile:
- Risk Tolerance: ${this.userProfile.riskTolerance}
- Investment Goals: ${this.userProfile.investmentGoals}
- Preferred Sectors: ${this.userProfile.preferredSectors.join(', ')}

Use this profile information to provide personalized advice. 
Always reference specific details from past conversations, including exact investment amounts and stocks mentioned. 
Be precise when recalling past information.
Previous conversation summary: ${summaryContent}`;

      const messages = [
        { role: "system", content: systemContent },
        ...conversationHistory,
        { role: "user", content: message }
      ];

      let fullResponse = "";
      if (onTokenStream) {
        const streamingResponse = await this.model.invoke(messages, {
          tools: [{ type: "function", function: updateProfileFunction }],
          callbacks: [{
            handleLLMNewToken(token: string) {
              fullResponse += token;
              onTokenStream(token);
            },
          }],
        });

        // Explicitly save the bot's response to memory
        if (this.memory) {
          await this.memory.saveContext({ input: message }, { output: fullResponse });
        }

        if (streamingResponse.additional_kwargs?.tool_calls) {
          const toolCall = streamingResponse.additional_kwargs.tool_calls[0];
          const functionName = toolCall.function?.name;
          const functionArgs = JSON.parse(toolCall.function?.arguments || "{}");

          if (functionName === "update_profile") {
            this.updateProfile(functionArgs);
            const updateMessage = "\n\nI've updated your financial profile based on this information.";
            onTokenStream(updateMessage);
            fullResponse += updateMessage;
            // Save the updated response
            if (this.memory) {
              await this.memory.saveContext({ input: message }, { output: fullResponse });
            }
          }
        }
        return fullResponse;
      } else {
        const response = await this.model.invoke(messages, {
          tools: [{ type: "function", function: updateProfileFunction }]
        });

        if (response.additional_kwargs?.tool_calls) {
          const toolCall = response.additional_kwargs.tool_calls[0];
          const functionName = toolCall.function?.name;
          const functionArgs = JSON.parse(toolCall.function?.arguments || "{}");

          if (functionName === "update_profile") {
            this.updateProfile(functionArgs);
            const secondMessages = [
              { role: "system", content: systemContent },
              ...conversationHistory,
              { role: "assistant", content: "Profile updated successfully. " + response.content }
            ];
            const secondResponse = await this.model.invoke(secondMessages);
            const finalMessage = String(secondResponse.content);
            // Ensure message is saved to memory
            if (this.memory) {
              await this.memory.saveContext({ input: message }, { output: finalMessage });
            }
            return finalMessage;
          }
        }

        const finalMessage = String(response.content);
        // Ensure message is saved to memory
        if (this.memory) {
          await this.memory.saveContext({ input: message }, { output: finalMessage });
        }
        return finalMessage;
      }
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      return "Sorry, I'm having trouble processing your request. Please try again later.";
    }
  }

  /** Set the user ID and initialize user-specific data */
  async setUserId(userId: string) {
    try {
      console.log(`Setting user ID from ${this.userId} to ${userId}`);
      
      if (this.userId !== userId) {
        // User has changed, we need to reinitialize everything
        this.userId = userId;
        
        // Store user ID in localStorage for session persistence
        localStorage.setItem('chatbot_user_id', userId);
        
        // Save current time as last authentication time
        localStorage.setItem('chatbot_last_auth', new Date().toISOString());
        
        console.log(`Reinitializing memory and profile for user ${userId}`);
        
        // Load user profile first
        await this.loadUserProfile();
        
        // Then initialize memory with conversation history
        await this.initializeMemory();
        
        console.log(`Successfully reinitialized for user ${userId}`);
        return true;
      } else {
        // Same user, just refresh data
        await this.loadUserProfile();
        console.log(`Refreshed data for existing user ${userId}`);
        return true;
      }
    } catch (error) {
      console.error(`Error setting user ID to ${userId}:`, error);
      return false;
    }
  }

  /** Set the OpenAI API key */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.initializeModel();
  }

  /** Get the user's current profile */
  getUserProfile(): UserProfile {
    return { ...this.userProfile };
  }

  /** Start the profile setup process */
  async startProfileSetup(riskTolerance: string, investmentGoals: string, preferredSectors: string[]) {
    this.userProfile = { userId: this.userId, riskTolerance, investmentGoals, preferredSectors };
    await this.saveUserProfile();
    return this.userProfile;
  }
  
  /** End conversation and save summary */
  async endConversation(): Promise<string> {
    try {
      if (!this.memory) {
        await this.initializeMemory();
      }
      
      // Create and save a summary of the conversation
      return this.memory ? await this.memory.saveConversationSummary() : "No active memory to summarize";
    } catch (error) {
      console.error("Error ending conversation:", error);
      return "Error ending conversation";
    }
  }

  /** Handle user login event */
  async handleLogin(userId: string, authToken: string): Promise<boolean> {
    try {
      console.log(`User logged in: ${userId}`);
      
      // Store the auth token for API requests if needed
      localStorage.setItem('auth_token', authToken);
      
      // Set the user ID which will load memory and profile
      const success = await this.setUserId(userId);
      
      if (success) {
        console.log('Successfully restored user session after login');
        return true;
      } else {
        console.error('Failed to set userId after login');
        return false;
      }
    } catch (error) {
      console.error('Error handling login:', error);
      return false;
    }
  }

  /** Handle user logout event */
  async handleLogout(): Promise<boolean> {
    try {
      console.log('Ending and saving conversation before logout');
      
      // Get the current summary
      const summary = await this.endConversation();
      console.log('Conversation summary saved:', summary);
      
      return true;
    } catch (error) {
      console.error('Error handling logout:', error);
      return false;
    }
  }

  /** Debug method to trace API endpoints */
  async debugMongoDB(): Promise<string> {
    try {
      let report = "DATABASE CONNECTION DEBUG REPORT\n";
      report += "================================\n\n";
      
      // Create a memory instance if needed
      if (!this.memory) {
        await this.initializeMemory();
      }

      if (!this.memory) {
        report += "ERROR: Failed to initialize memory\n";
        return report;
      }
      
      report += "1. Testing API connection\n";
      try {
        // Test the API connection
        const apiResponse = await axios.get(`${this.apiUrl}/health`);
        if (apiResponse.status === 200) {
          report += "   API Connection: SUCCESS ✅\n";
        } else {
          report += "   API Connection: FAILED ❌\n";
        }
      } catch (error) {
        report += `   API Connection Exception: ${error}\n`;
        report += "   API Connection: FAILED ❌\n";
      }
      
      report += "\n2. Testing MongoDB connection\n";
      try {
        // Test the MongoDB connection
        const mongoResponse = await axios.post(`${this.apiUrl}/api/test-mongodb`, {
          mongoUrl: this.mongoUrl
        });
        
        if (mongoResponse.status === 200) {
          report += "   MongoDB Connection: SUCCESS ✅\n";
          if (mongoResponse.data && mongoResponse.data.message) {
            report += `   MongoDB Response: ${mongoResponse.data.message}\n`;
          }
        } else {
          report += "   MongoDB Connection: FAILED ❌\n";
        }
      } catch (error) {
        report += `   MongoDB Connection Exception: ${error}\n`;
        report += "   MongoDB Connection: FAILED ❌\n";
      }
      
      report += "\n";
      
      // Config info
      report += "CONNECTION CONFIG\n";
      report += `API URL: ${this.apiUrl}\n`;
      report += `MongoDB URI: ${this.mongoUrl}\n`;
      report += `Current User ID: ${this.userId}\n`;
      report += `Is Authenticated: ${this.getAuthToken() ? 'Yes' : 'No'}\n`;
      
      // Browser environment info
      report += "\nBROWSER ENVIRONMENT\n";
      report += `User Agent: ${navigator.userAgent}\n`;
      report += `Online: ${navigator.onLine ? 'Yes' : 'No'}\n`;
      
      return report;
    } catch (error) {
      return `Error generating debug report: ${error}`;
    }
  }

  /**
   * Safely get auth token from storage
   */
  private getAuthToken(): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('auth_token');
      }
      return null;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }

  /**
   * Safely set auth token in storage
   */
  private setAuthToken(token: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('auth_token', token);
      }
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  }

  /** Create a direct test message to verify API connection */
  async createTestMessage(content: string = "Test message"): Promise<boolean> {
    try {
      console.log("Creating test message to verify API and MongoDB connection...");
      
      // Create a memory instance if needed
      if (!this.memory) {
        await this.initializeMemory();
      }
      
      if (!this.memory) {
        console.error("Failed to initialize memory");
        return false;
      }
      
      // Test direct MongoDB connection through API
      try {
        const testResponse = await axios.post(`${this.apiUrl}/api/test-mongodb`, {
          mongoUrl: this.mongoUrl,
          message: content,
          userId: this.userId
        });
        
        if (testResponse.status === 200) {
          console.log("MongoDB test successful:", testResponse.data);
          
          // If MongoDB test was successful, try saving a message
          await this.memory.saveContext(
            { input: "Test input" }, 
            { output: content }
          );
          
          console.log("Successfully saved test message");
          return true;
        } else {
          console.error("MongoDB test failed with status:", testResponse.status);
          return false;
        }
      } catch (error) {
        console.error("Error testing MongoDB connection:", error);
        return false;
      }
    } catch (error) {
      console.error("Error creating test message:", error);
      return false;
    }
  }

  /** Test connection to MongoDB through API */
  private async testDatabaseConnection(): Promise<boolean> {
    try {
      const testPayload = {
        mongoUrl: this.mongoUrl
      };
      
      const response = await axios.post(`${this.apiUrl}/api/test-mongodb`, testPayload);
      return response.status === 200;
    } catch (error) {
      console.error("Error testing MongoDB connection:", error);
      return false;
    }
  }
}

// Create a single instance of the ChatbotService
export const chatbotService = new ChatbotService();
export default chatbotService;