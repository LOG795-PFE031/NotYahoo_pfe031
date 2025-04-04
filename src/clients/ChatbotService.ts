import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

// Risk tolerance options
const RISK_TOLERANCE_OPTIONS = {
  '1': 'low',
  '2': 'medium',
  '3': 'high'
};

// Investment goals options
const INVESTMENT_GOALS_OPTIONS = {
  '1': 'Conservative Income (Focus on stable, dividend-paying investments)',
  '2': 'Balanced Growth (Mix of growth and income)',
  '3': 'Aggressive Growth (Focus on capital appreciation)',
  '4': 'Retirement Planning',
  '5': 'Short-term Trading'
};

// Available sectors
const AVAILABLE_SECTORS = {
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

class ChatbotService {
  private model!: ChatOpenAI;
  private memory!: ConversationSummaryBufferMemory;
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
    this.loadUserProfile();
  }

  /**
   * Initialize the OpenAI model and conversation chain with memory
   */
  private initializeModel() {
    try {
      this.model = new ChatOpenAI({
        openAIApiKey: this.apiKey,
        modelName: "gpt-4", // or any other model you prefer
        temperature: 0.7,
      });

      // Create a memory with conversation summary
      this.memory = new ConversationSummaryBufferMemory({
        llm: this.model,
        maxTokenLimit: 1000,
        returnMessages: true,
        memoryKey: "history",
      });
      
    } catch (error) {
      console.error("Error initializing the chatbot model:", error);
    }
  }

  /**
   * Load user profile from localStorage
   */
  private loadUserProfile() {
    try {
      const profileData = localStorage.getItem(`profile_${this.userId}`);
      if (profileData) {
        this.userProfile = JSON.parse(profileData);
      } else {
        // Create a default profile if none exists
        this.saveUserProfile();
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }

  /**
   * Save user profile to localStorage
   */
  private saveUserProfile() {
    try {
      localStorage.setItem(`profile_${this.userId}`, JSON.stringify(this.userProfile));
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  }

  /**
   * Update user profile and save changes
   */
  private updateProfile(updates: any) {
    try {
      // Update risk tolerance if provided
      if (updates.risk_tolerance) {
        this.userProfile.riskTolerance = updates.risk_tolerance;
      }
      
      // Update investment goals if provided
      if (updates.investment_goals) {
        this.userProfile.investmentGoals = updates.investment_goals;
      }
      
      // Update preferred sectors if provided
      if (updates.preferred_sectors && Array.isArray(updates.preferred_sectors)) {
        // Add new sectors without duplicates
        updates.preferred_sectors.forEach((sector: string) => {
          if (!this.userProfile.preferredSectors.includes(sector)) {
            this.userProfile.preferredSectors.push(sector);
          }
        });
      }
      
      // Save the updated profile
      this.saveUserProfile();
      
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      return false;
    }
  }

  /**
   * Send a message to the chatbot and get a response
   * @param message The user message
   * @returns Promise with the chatbot response
   */
  async sendMessage(message: string): Promise<string> {
    try {
      if (!this.model) {
        this.initializeModel();
      }
      
      // Save user message to memory first
      await this.memory.saveContext(
        { input: message },
        { output: "" }
      );
      
      // Load conversation history from memory
      const memoryVariables = await this.memory.loadMemoryVariables({});
      const memoryMessages = memoryVariables.history || [];
      
      // Extract summary and recent messages
      let summaryContent = "";
      const conversationHistory = [];
      
      for (const msg of memoryMessages) {
        if (msg._getType() === "system") {
          summaryContent = msg.content;
        } else if (msg._getType() === "human") {
          conversationHistory.push({
            role: "user",
            content: msg.content
          });
        } else if (msg._getType() === "ai") {
          conversationHistory.push({
            role: "assistant",
            content: msg.content
          });
        }
      }
      
      // Create system message with profile and summary
      const systemContent = `You are a financial advisor specializing in stocks. 
The user has the following established profile:
- Risk Tolerance: ${this.userProfile.riskTolerance}
- Investment Goals: ${this.userProfile.investmentGoals}
- Preferred Sectors: ${this.userProfile.preferredSectors.join(', ')}

Use this profile information to provide personalized advice. 
Always reference specific details from past conversations, including exact investment amounts and stocks mentioned. 
Be precise when recalling past information.
Previous conversation summary: ${summaryContent}`;
      
      // First API call with function calling
      const messages = [
        { role: "system", content: systemContent },
        ...conversationHistory,
        { role: "user", content: message }
      ];
      
      const response = await this.model.invoke(messages, {
        tools: [{ type: "function", function: updateProfileFunction }]
      });
      
      // Handle function call if present
      if (response.additional_kwargs?.tool_calls) {
        const toolCall = response.additional_kwargs.tool_calls[0];
        
        // Extract function name and arguments
        const functionName = toolCall.function?.name;
        const functionArgs = JSON.parse(toolCall.function?.arguments || "{}");
        
        if (functionName === "update_profile") {
          // Update user profile
          this.updateProfile(functionArgs);
          
          // Second API call for final response
          const secondMessages = [
            { role: "system", content: systemContent },
            ...conversationHistory,
            { role: "assistant", content: "Profile updated successfully. " + response.content }
          ];
          
          const secondResponse = await this.model.invoke(secondMessages);
          const finalMessage = String(secondResponse.content);
          
          // Save assistant response to memory
          await this.memory.saveContext(
            { input: message },
            { output: finalMessage }
          );
          
          return finalMessage;
        }
      }
      
      // No function call; direct response
      const finalMessage = String(response.content);
      
      // Save assistant response to memory
      await this.memory.saveContext(
        { input: message },
        { output: finalMessage }
      );
      
      return finalMessage;
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      return "Sorry, I'm having trouble processing your request. Please try again later.";
    }
  }

  /**
   * Set the OpenAI API key
   * @param apiKey The OpenAI API key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.initializeModel();
  }
  
  /**
   * Set the user ID
   * @param userId The user's ID
   */
  setUserId(userId: string) {
    this.userId = userId;
    this.loadUserProfile();
  }
  
  /**
   * Get the user's current profile
   * @returns The user profile
   */
  getUserProfile(): UserProfile {
    return { ...this.userProfile };
  }
  
  /**
   * Start the profile setup process
   * This can be connected to a UI component
   */
  startProfileSetup(
    riskTolerance: string, 
    investmentGoals: string, 
    preferredSectors: string[]
  ) {
    this.userProfile = {
      userId: this.userId,
      riskTolerance,
      investmentGoals,
      preferredSectors
    };
    
    this.saveUserProfile();
    return this.userProfile;
  }
}

// Create a singleton instance
export const chatbotService = new ChatbotService();
export default chatbotService; 