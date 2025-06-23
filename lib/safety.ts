// Safety and content moderation utilities for SattaGPT

export interface SafetyCheckResult {
  isSafe: boolean;
  reason?: string;
  category?: 'inappropriate' | 'off-topic' | 'harmful' | 'spam' | 'political_violence';
}

// Keywords and patterns that indicate inappropriate content
const INAPPROPRIATE_KEYWORDS = [
  // Explicit content
  'porn', 'sex', 'nude', 'explicit', 'adult content',
  // Violence and threats
  'kill', 'murder', 'assassinate', 'bomb', 'terrorist', 'attack',
  'violence', 'blood', 'death', 'suicide', 'harm', 'hurt',
  // Hate speech indicators
  'hate', 'racist', 'discriminate', 'genocide', 'ethnic cleansing',
  // Illegal activities
  'drugs', 'illegal', 'crime', 'fraud', 'scam', 'hack',
  // Personal attacks
  'personal', 'private', 'individual', 'specific person',
  // Offensive language
  'curse', 'swear', 'profanity', 'abuse'
];

// Topics that are off-topic for Indian political debate
const OFF_TOPIC_PATTERNS = [
  // Non-political topics
  'movie', 'film', 'entertainment', 'sports', 'game', 'music',
  'food', 'recipe', 'cooking', 'fashion', 'beauty', 'lifestyle',
  // International topics not related to India
  'america', 'usa', 'china', 'russia', 'europe', 'africa',
  // Technical topics
  'programming', 'coding', 'software', 'hardware', 'technology',
  'python', 'javascript', 'java', 'recruiter', 'recruitment', 'interview',
  'developer', 'engineer', 'programmer', 'coding', 'algorithm',
  // Personal topics
  'dating', 'relationship', 'marriage', 'family', 'personal life',
  // AI prompt manipulation
  'ignore all previous', 'ignore previous', 'you are now', 'act as',
  'pretend to be', 'roleplay as', 'you are an expert', 'expert in',
  'ask me questions', 'interview me', 'test me', 'quiz me'
];

// Political violence and extremism indicators
const POLITICAL_VIOLENCE_KEYWORDS = [
  'revolution', 'overthrow', 'coup', 'rebellion', 'insurgency',
  'separatist', 'secession', 'independence movement', 'armed struggle',
  'militant', 'extremist', 'radical', 'violent protest', 'riots'
];

// Spam and abuse patterns
const SPAM_PATTERNS = [
  /(.)\1{10,}/, // Repeated characters
  /[A-Z]{20,}/, // All caps
  /[!@#$%^&*()]{10,}/, // Excessive symbols
  /\b(spam|advertisement|promote|buy|sell|offer)\b/i
];

// Prompt injection patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+(?:prompts?|instructions?)/i,
  /you\s+are\s+now\s+(?:an?\s+)?(?:expert|professional|specialist)/i,
  /act\s+as\s+(?:an?\s+)?(?:expert|professional|specialist)/i,
  /pretend\s+to\s+be\s+(?:an?\s+)?(?:expert|professional|specialist)/i,
  /roleplay\s+as\s+(?:an?\s+)?(?:expert|professional|specialist)/i,
  /you\s+are\s+(?:an?\s+)?(?:expert|professional|specialist)\s+in/i,
  /ask\s+me\s+(?:questions?|problems?|challenges?)/i,
  /interview\s+me/i,
  /test\s+me/i,
  /quiz\s+me/i,
  /give\s+me\s+(?:questions?|problems?|challenges?)/i
];

function detectPromptInjection(topic: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(topic));
}

export function validateDebateTopic(topic: string): SafetyCheckResult {
  const lowerTopic = topic.toLowerCase().trim();
  
  // Check for empty or too short topics
  if (!lowerTopic || lowerTopic.length < 10) {
    return {
      isSafe: false,
      reason: 'Topic is too short. Please provide a more detailed debate topic.',
      category: 'off-topic'
    };
  }
  
  // Check for too long topics
  if (lowerTopic.length > 500) {
    return {
      isSafe: false,
      reason: 'Topic is too long. Please keep it under 500 characters.',
      category: 'spam'
    };
  }
  
  // Check for prompt injection attempts
  if (detectPromptInjection(topic)) {
    return {
      isSafe: false,
      reason: 'Topic contains prompt manipulation attempts. Please choose a different topic.',
      category: 'off-topic'
    };
  }
  
  // Check for inappropriate keywords
  for (const keyword of INAPPROPRIATE_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lowerTopic)) {
      return {
        isSafe: false,
        reason: `Topic contains inappropriate content related to "${keyword}". Please choose a different topic.`,
        category: 'inappropriate'
      };
    }
  }
  
  // Check for off-topic patterns
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (lowerTopic.includes(pattern)) {
      return {
        isSafe: false,
        reason: `Topic appears to be about ${pattern}, which is not suitable for Indian political debate.`,
        category: 'off-topic'
      };
    }
  }
  
  // Check for political violence indicators
  for (const keyword of POLITICAL_VIOLENCE_KEYWORDS) {
    if (lowerTopic.includes(keyword)) {
      return {
        isSafe: false,
        reason: `Topic contains references to political violence or extremism. Please choose a different topic.`,
        category: 'political_violence'
      };
    }
  }
  
  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(topic)) {
      return {
        isSafe: false,
        reason: 'Topic appears to be spam or contains excessive formatting.',
        category: 'spam'
      };
    }
  }
  
  // Check if topic is relevant to Indian politics
  const indianPoliticalKeywords = [
    'india', 'indian', 'bharat', 'hindi', 'urdu', 'tamil', 'telugu', 'marathi',
    'gujarati', 'bengali', 'punjabi', 'kannada', 'malayalam', 'odia', 'assamese',
    'parliament', 'election', 'vote', 'democracy', 'constitution', 'government',
    'ministry', 'minister', 'pm', 'cm', 'mp', 'mla', 'political party',
    'bjp', 'congress', 'aap', 'dmk', 'aiadmk', 'trs', 'tmc', 'sp', 'bsp',
    'reservation', 'caste', 'religion', 'secular', 'communal', 'minority',
    'economy', 'development', 'poverty', 'education', 'health', 'agriculture',
    'farmers', 'labor', 'employment', 'corruption', 'governance', 'law',
    'judiciary', 'police', 'military', 'defense', 'foreign policy', 'trade',
    'tax', 'budget', 'finance', 'banking', 'infrastructure', 'transport',
    'environment', 'climate', 'energy', 'technology', 'digital', 'internet'
  ];
  
  const hasIndianPoliticalRelevance = indianPoliticalKeywords.some(keyword => 
    lowerTopic.includes(keyword)
  );
  
  if (!hasIndianPoliticalRelevance) {
    return {
      isSafe: false,
      reason: 'Topic does not appear to be related to Indian politics. Please choose a topic relevant to Indian political debate.',
      category: 'off-topic'
    };
  }
  
  return { isSafe: true };
}

// Rate limiting for topic submissions
const topicSubmissionHistory = new Map<string, number[]>();

export function checkRateLimit(userId: string, maxSubmissions: number = 5, timeWindow: number = 60000): boolean {
  const now = Date.now();
  const userHistory = topicSubmissionHistory.get(userId) || [];
  
  // Remove old submissions outside the time window
  const recentSubmissions = userHistory.filter(timestamp => now - timestamp < timeWindow);
  
  if (recentSubmissions.length >= maxSubmissions) {
    return false; // Rate limit exceeded
  }
  
  // Add current submission
  recentSubmissions.push(now);
  topicSubmissionHistory.set(userId, recentSubmissions);
  
  return true; // Within rate limit
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, history] of topicSubmissionHistory.entries()) {
    const recentHistory = history.filter(timestamp => now - timestamp < 60000);
    if (recentHistory.length === 0) {
      topicSubmissionHistory.delete(userId);
    } else {
      topicSubmissionHistory.set(userId, recentHistory);
    }
  }
}, 300000); // Clean up every 5 minutes

// Enhanced safety check with multiple layers
export async function comprehensiveSafetyCheck(
  topic: string, 
  userId?: string
): Promise<SafetyCheckResult> {
  
  // Basic validation
  const basicCheck = validateDebateTopic(topic);
  if (!basicCheck.isSafe) {
    return basicCheck;
  }
  
  // Rate limiting (if userId provided)
  if (userId && !checkRateLimit(userId)) {
    return {
      isSafe: false,
      reason: 'Too many topic submissions. Please wait before submitting another topic.',
      category: 'spam'
    };
  }
  
  // Additional checks can be added here:
  // - External moderation API calls
  // - Machine learning model predictions
  // - Community flagging system
  
  return { isSafe: true };
}

// Sanitize topic for display (remove potentially harmful content)
export function sanitizeTopic(topic: string): string {
  return topic
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 500); // Limit length
} 