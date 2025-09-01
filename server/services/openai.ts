import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateTopicFromContent(content: string, title?: string): Promise<{
  topic: string;
  confidence: number;
}> {
  try {
    const prompt = `Analyze the following content and suggest the most appropriate topic category for a social learning platform.

Content: ${title ? `Title: ${title}\n` : ''}${content}

Available topics:
- AI & Machine Learning
- Technology & Programming  
- Business & Entrepreneurship
- Design & Creativity
- Science & Research
- Education & Learning
- Health & Wellness
- Philosophy & Ethics
- History & Culture
- Personal Development
- Finance & Economics
- Environment & Sustainability

Respond with JSON in this format: { "topic": "most_appropriate_topic", "confidence": 0.85 }
The confidence should be a number between 0 and 1 indicating how certain you are about the topic assignment.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert content categorizer for a social learning platform. Analyze content and suggest the most appropriate topic category."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      topic: result.topic || 'General',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
    };
  } catch (error) {
    console.error('Error generating topic:', error);
    return {
      topic: 'General',
      confidence: 0.1
    };
  }
}

export async function generatePostExcerpt(content: string, maxLength: number = 150): Promise<string> {
  try {
    const prompt = `Create a compelling excerpt from this content for a social media post. Keep it under ${maxLength} characters and make it engaging.

Content: ${content}

Respond with just the excerpt text, no JSON or formatting.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert content writer who creates engaging social media excerpts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const excerpt = response.choices[0].message.content?.trim() || '';
    return excerpt.length > maxLength ? excerpt.substring(0, maxLength - 3) + '...' : excerpt;
  } catch (error) {
    console.error('Error generating excerpt:', error);
    return content.length > maxLength ? content.substring(0, maxLength - 3) + '...' : content;
  }
}

export async function generateIndependentResponse(message: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for a social learning platform. Provide thoughtful, educational responses."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating response:', error);
    return "I'm experiencing technical difficulties. Please try again later.";
  }
}

export async function generateCollectionResponse(
  message: string, 
  documents: any[], 
  collectionName: string, 
  conversationHistory?: any[]
): Promise<{ content: string; sources: string[] | null }> {
  try {
    // Build context from documents
    const documentContext = documents.map(doc => 
      `Document: ${doc.filename}\nContent: ${doc.content?.substring(0, 1000) || 'No content available'}...`
    ).join('\n\n');

    // Build conversation history context
    const historyContext = conversationHistory?.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n') || '';

    const systemPrompt = `You are an AI assistant helping users with questions about documents in their "${collectionName}" collection. 
    Use the provided document context to give accurate, helpful responses. If the answer isn't in the documents, say so clearly.
    
    Available documents:
    ${documentContext}
    
    ${historyContext ? `Previous conversation:\n${historyContext}\n` : ''}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    
    // Extract sources if documents were referenced
    const sources = documents.length > 0 ? documents.map(doc => doc.filename) : null;

    return { content, sources };
  } catch (error) {
    console.error('Error generating collection response:', error);
    return { 
      content: "I'm experiencing technical difficulties. Please try again later.", 
      sources: null 
    };
  }
}

export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    const prompt = `Generate a short, descriptive title (max 50 characters) for a conversation that starts with: "${firstMessage}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating concise, descriptive conversation titles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 20,
    });

    const title = response.choices[0].message.content?.trim() || '';
    return title.length > 50 ? title.substring(0, 47) + '...' : title || 'New Conversation';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
}