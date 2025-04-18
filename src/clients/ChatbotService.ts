import { ChatOpenAI } from "@langchain/openai";
import { ConversationSummaryBufferMemory, ConversationSummaryBufferMemoryInput } from "langchain/memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

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
interface ConversationEntry {
  message: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ApiResponse {
  data: ConversationEntry[];
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

// Utility functions for API calls (implement these based on your frontend setup)
async function apiGet(url: string): Promise<any> {
  const response = await fetch(url, { method: 'GET' });
  return response.json();
}

async function apiPost(url: string, data: any): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

// Custom memory class for MongoDB persistence
class PersistentConversationSummaryBufferMemory extends ConversationSummaryBufferMemory {
  private userId: string;

  constructor(userId: string, config: ConversationSummaryBufferMemoryInput) {
    super(config);
    this.userId = userId;
  }

  /** Load conversation history from MongoDB */
  async loadFromDatabase(): Promise<void> {
    try {
      const response = await fetch(`/conversation/${this.userId}`, { method: 'GET' });
      const { data }: ApiResponse = await response.json();
      
      // Clear existing chat history
      this.chatHistory.clear();
      
      // Add each message to the chat history
      for (const entry of data) {
        // Map 'user' to human message and 'bot' to AI message for LangChain format
        if (entry.sender === 'user') {
          this.chatHistory.addMessage(new HumanMessage(entry.message));
        } else {
          this.chatHistory.addMessage(new AIMessage(entry.message));
        }
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error);
    }
  }

  /** Override saveContext to persist to MongoDB */
  async saveContext(inputValues: Record<string, any>, outputValues: Record<string, any>): Promise<void> {
    try {
      // Get the input and output messages
      const input = inputValues[this.inputKey || 'input'] || '';
      const output = outputValues[this.outputKey || 'output'] || '';
      
      // Save the user message if present
      if (input) {
        await fetch('/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            message: input,
            sender: 'user',
            timestamp: new Date()
          })
        });
      }
      
      // Save the bot message if present
      if (output) {
        await fetch('/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            message: output,
            sender: 'bot',
            timestamp: new Date()
          })
        });
      }
      
      // Update in-memory history in LangChain
      await super.saveContext(inputValues, outputValues);
    } catch (error) {
      console.error("Failed to save conversation context:", error);
    }
  }
}

class ChatbotService {
  private model!: ChatOpenAI;
  private memory!: PersistentConversationSummaryBufferMemory;
  private apiKey: string;
  private userId: string = "user1"; // Default user ID
  private userProfile: UserProfile = {
    userId: "user1",
    riskTolerance: "medium",
    investmentGoals: "Balanced Growth (Mix of growth and income)",
    preferredSectors: ["Technology", "Healthcare", "Financial Services"]
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    this.initializeModel();
    this.setUserId(this.userId); // Initialize for default user
  }

  /** Initialize the OpenAI model */
  private initializeModel() {
    try {
      this.model = new ChatOpenAI({
        openAIApiKey: this.apiKey,
        modelName: "gpt-4",
        temperature: 0.7,
        streaming: true,
      });
    } catch (error) {
      console.error("Error initializing the chatbot model:", error);
    }
  }

  /** Initialize memory for the current user */
  private async initializeMemory() {
    this.memory = new PersistentConversationSummaryBufferMemory(this.userId, {
      llm: this.model,
      maxTokenLimit: 1000,
      returnMessages: true,
      memoryKey: "history",
    });
    await this.memory.loadFromDatabase();
  }

  /** Load user profile from MongoDB */
  private async loadUserProfile() {
    try {
      const profileData = await apiGet(`/api/users/${this.userId}/profile`);
      if (profileData) {
        this.userProfile = profileData;
      } else {
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
    }
  }

  /** Save user profile to MongoDB */
  private async saveUserProfile() {
    try {
      await apiPost(`/api/users/${this.userId}/profile`, this.userProfile);
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  }

  /** Update user profile and save changes */
  private updateProfile(updates: any) {
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
      if (!this.memory) {
        await this.initializeMemory();
      }

      await this.memory.saveContext({ input: message }, { output: "" });
      const memoryVariables = await this.memory.loadMemoryVariables({});
      const memoryMessages = memoryVariables.history || [];

      let summaryContent = "";
      const conversationHistory = [];
      for (const msg of memoryMessages) {
        if (msg._getType() === "system") {
          summaryContent = msg.content;
        } else if (msg._getType() === "human") {
          conversationHistory.push({ role: "user", content: msg.content });
        } else if (msg._getType() === "ai") {
          conversationHistory.push({ role: "assistant", content: msg.content });
        }
      }

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

        await this.memory.saveContext({ input: message }, { output: fullResponse });

        if (streamingResponse.additional_kwargs?.tool_calls) {
          const toolCall = streamingResponse.additional_kwargs.tool_calls[0];
          const functionName = toolCall.function?.name;
          const functionArgs = JSON.parse(toolCall.function?.arguments || "{}");

          if (functionName === "update_profile") {
            this.updateProfile(functionArgs);
            const updateMessage = "\n\nI've updated your financial profile based on this information.";
            onTokenStream(updateMessage);
            fullResponse += updateMessage;
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
            await this.memory.saveContext({ input: message }, { output: finalMessage });
            return finalMessage;
          }
        }

        const finalMessage = String(response.content);
        await this.memory.saveContext({ input: message }, { output: finalMessage });
        return finalMessage;
      }
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      return "Sorry, I'm having trouble processing your request. Please try again later.";
    }
  }

  /** Set the user ID and initialize user-specific data */
  setUserId(userId: string) {
    this.userId = userId;
    this.loadUserProfile();
    this.initializeMemory();
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
  startProfileSetup(riskTolerance: string, investmentGoals: string, preferredSectors: string[]) {
    this.userProfile = { userId: this.userId, riskTolerance, investmentGoals, preferredSectors };
    this.saveUserProfile();
    return this.userProfile;
  }
}

// Singleton instance
export const chatbotService = new ChatbotService();
export default chatbotService;