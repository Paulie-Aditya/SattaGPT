"use client";

import { useChat } from "ai/react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Flame,
  RotateCcw,
  Vote,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TOPICS = [
  "Should India implement a Uniform Civil Code?",
  "Is reservation policy still relevant in modern India?",
  "Should India prioritize Hindi as the national language?",
  "Should religious conversion be regulated by law?",
  "Is economic liberalization helping or hurting the common man?",
];

const AGENTS = {
  vedant: {
    name: "Vedant",
    party: "Hindu Nationalist",
    avatar: "🕉️",
    color: "bg-orange-500",
  },
  samira: {
    name: "Samira",
    party: "Secular Progressive",
    avatar: "🎓",
    color: "bg-blue-500",
  },
  ravi: {
    name: "Ravi",
    party: "Marxist Revolutionary",
    avatar: "✊",
    color: "bg-red-500",
  },
  fatima: {
    name: "Fatima",
    party: "Grassroots Socialist",
    avatar: "🤝",
    color: "bg-green-500",
  },
  gurmeet: {
    name: "Gurmeet",
    party: "Sikh Federalist",
    avatar: "🪯",
    color: "bg-yellow-500",
  },
  neha: {
    name: "Neha",
    party: "Techno-liberal",
    avatar: "💻",
    color: "bg-purple-500",
  },
};

interface AnalyticsData {
  totalVotes: number;
  peakVotingRate: number;
  averageResponseTime: number;
  engagementScore: number;
  momentumShifts: number;
  strongestArgument: { agent: string; round: number; voteGain: number };
  votingPattern: Array<{ time: number; agent1: number; agent2: number }>;
  roundPerformance: Array<{
    round: number;
    agent1Gain: number;
    agent2Gain: number;
  }>;
}

export default function SattaGPT() {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [agent1, setAgent1] = useState<keyof typeof AGENTS>("vedant");
  const [agent2, setAgent2] = useState<keyof typeof AGENTS>("samira");
  const [debateStarted, setDebateStarted] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] =
    useState<keyof typeof AGENTS>("vedant");
  const [roundCount, setRoundCount] = useState(0);
  const [userVoted, setUserVoted] = useState(false);
  const [maxRounds] = useState(6);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Enhanced voting system
  const [liveVotes, setLiveVotes] = useState({
    agent1: 0,
    agent2: 0,
    total: 0,
  });
  const [userVote, setUserVote] = useState<"agent1" | "agent2" | null>(null);
  const [voteSurge, setVoteSurge] = useState<"agent1" | "agent2" | null>(null);
  const [previousPercentages, setPreviousPercentages] = useState({
    agent1: 0,
    agent2: 0,
  });

  // Analytics tracking
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalVotes: 0,
    peakVotingRate: 0,
    averageResponseTime: 0,
    engagementScore: 0,
    momentumShifts: 0,
    strongestArgument: { agent: "", round: 0, voteGain: 0 },
    votingPattern: [],
    roundPerformance: [],
  });
  const [debateStartTime, setDebateStartTime] = useState<number>(0);
  const [lastVoteCount, setLastVoteCount] = useState(0);
  const [votingRateHistory, setVotingRateHistory] = useState<number[]>([]);
  const [responseStartTime, setResponseStartTime] = useState<number>(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  // Safety validation state
  const [topicValidation, setTopicValidation] = useState<{
    isValid: boolean;
    message: string;
    category?: string;
    isChecking: boolean;
  }>({
    isValid: false,
    message: "",
    isChecking: false,
  });

  // Error handling state
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    append,
    isLoading,
    setMessages,
    error: chatError,
  } = useChat({
    api: "/api/chat",
    body: { agent: currentSpeaker },
    onError: (error) => {
      console.error("Chat error:", error);
      setError(
        error.message ||
          "An error occurred during the debate. Please try again."
      );
    },
    onFinish: () => {
      // Track response time
      const responseTime = Date.now() - responseStartTime;
      setResponseTimes((prev) => [...prev, responseTime]);

      // Create vote surge for the agent who just spoke
      const speakingAgent = currentSpeaker === agent1 ? "agent1" : "agent2";
      setVoteSurge(speakingAgent);

      // Add surge votes (50-150 votes for good response)
      const surgeVotes = Math.floor(Math.random() * 100) + 50;
      const backgroundVotes = Math.floor(Math.random() * 30) + 10;

      setLiveVotes((prev) => {
        const newVotes = {
          agent1:
            prev.agent1 +
            (speakingAgent === "agent1" ? surgeVotes : backgroundVotes),
          agent2:
            prev.agent2 +
            (speakingAgent === "agent2" ? surgeVotes : backgroundVotes),
          total: prev.total + surgeVotes + backgroundVotes,
        };

        // Store previous percentages for animation
        setPreviousPercentages({
          agent1: prev.total > 0 ? (prev.agent1 / prev.total) * 100 : 50,
          agent2: prev.total > 0 ? (prev.agent2 / prev.total) * 100 : 50,
        });

        // Track voting pattern for analytics
        setAnalytics((prevAnalytics) => ({
          ...prevAnalytics,
          votingPattern: [
            ...prevAnalytics.votingPattern,
            {
              time: Date.now() - debateStartTime,
              agent1: (newVotes.agent1 / newVotes.total) * 100,
              agent2: (newVotes.agent2 / newVotes.total) * 100,
            },
          ],
          roundPerformance: [
            ...prevAnalytics.roundPerformance.slice(0, roundCount),
            {
              round: roundCount + 1,
              agent1Gain:
                speakingAgent === "agent1" ? surgeVotes : backgroundVotes,
              agent2Gain:
                speakingAgent === "agent2" ? surgeVotes : backgroundVotes,
            },
          ],
        }));

        // Track strongest argument
        const voteGain =
          speakingAgent === "agent1" ? surgeVotes : backgroundVotes;
        setAnalytics((prevAnalytics) => {
          if (voteGain > prevAnalytics.strongestArgument.voteGain) {
            return {
              ...prevAnalytics,
              strongestArgument: {
                agent: AGENTS[currentSpeaker].name,
                round: roundCount + 1,
                voteGain,
              },
            };
          }
          return prevAnalytics;
        });

        return newVotes;
      });

      // Clear surge effect after animation
      setTimeout(() => setVoteSurge(null), 2000);

      setRoundCount((prev) => prev + 1);
      setCurrentSpeaker((prev) => (prev === agent1 ? agent2 : agent1));
    },
  });

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Track voting rate and analytics
  useEffect(() => {
    if (!debateStarted) return;

    const interval = setInterval(() => {
      setLiveVotes((prev) => {
        const increment = Math.floor(Math.random() * 8) + 3;
        const agent1Bias = Math.random() > 0.5 ? 0.48 : 0.52;
        const newAgent1Votes = Math.floor(increment * agent1Bias);
        const newAgent2Votes = increment - newAgent1Votes;

        // Track voting rate
        const currentRate = increment / 3; // votes per second
        setVotingRateHistory((prevRates) => [
          ...prevRates.slice(-19),
          currentRate,
        ]);

        return {
          agent1: prev.agent1 + newAgent1Votes,
          agent2: prev.agent2 + newAgent2Votes,
          total: prev.total + increment,
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [debateStarted]);

  // Update analytics periodically
  useEffect(() => {
    if (!debateStarted) return;

    const interval = setInterval(() => {
      const currentVotingRate =
        votingRateHistory.length > 0
          ? votingRateHistory[votingRateHistory.length - 1]
          : 0;

      setAnalytics((prev) => ({
        ...prev,
        totalVotes: liveVotes.total,
        peakVotingRate: Math.max(prev.peakVotingRate, currentVotingRate),
        averageResponseTime:
          responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0,
        engagementScore: Math.min(
          100,
          liveVotes.total / 10 + messages.length * 5 + roundCount * 10
        ),
        momentumShifts:
          prev.votingPattern.length > 1
            ? prev.votingPattern.reduce((shifts, current, index) => {
                if (index === 0) return 0;
                const prevPoint = prev.votingPattern[index - 1];
                const leadChanged =
                  current.agent1 > current.agent2 !==
                  prevPoint.agent1 > prevPoint.agent2;
                return shifts + (leadChanged ? 1 : 0);
              }, 0)
            : 0,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [
    debateStarted,
    liveVotes,
    messages,
    roundCount,
    votingRateHistory,
    responseTimes,
  ]);

  // Reset validation state when topic changes
  const resetValidation = () => {
    setTopicValidation({
      isValid: false,
      message: "",
      isChecking: false,
    });
  };

  const startDebate = async () => {
    if (!selectedTopic) return;

    const actualTopic = selectedTopic.startsWith("custom:")
      ? selectedTopic.slice(7)
      : selectedTopic;

    if (!actualTopic.trim()) return;

    // Validate custom topic only when starting debate
    if (selectedTopic.startsWith("custom:")) {
      setTopicValidation((prev) => ({ ...prev, isChecking: true }));

      try {
        const response = await fetch("/api/validate-topic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: actualTopic,
            userId: "anonymous", // In a real app, you'd get this from auth
          }),
        });

        const result = await response.json();

        if (!result.isValid) {
          setTopicValidation({
            isValid: false,
            message: result.reason,
            category: result.category,
            isChecking: false,
          });
          setError(result.reason);
          return; // Don't start debate if validation fails
        }

        setTopicValidation({
          isValid: true,
          message: result.message,
          isChecking: false,
        });
      } catch (error) {
        console.error("Topic validation error:", error);
        setTopicValidation({
          isValid: false,
          message: "Unable to validate topic. Please try again.",
          isChecking: false,
        });
        setError("Unable to validate topic. Please try again.");
        return; // Don't start debate if validation fails
      }
    }

    // Clear any previous errors
    setError(null);

    setDebateStarted(true);
    setDebateStartTime(Date.now());
    setMessages([]);
    setRoundCount(0);
    setCurrentSpeaker(agent1);
    setUserVoted(false);
    setUserVote(null);
    setVoteSurge(null);
    setShowAnalytics(false);

    // Reset analytics
    setAnalytics({
      totalVotes: 0,
      peakVotingRate: 0,
      averageResponseTime: 0,
      engagementScore: 0,
      momentumShifts: 0,
      strongestArgument: { agent: "", round: 0, voteGain: 0 },
      votingPattern: [],
      roundPerformance: [],
    });
    setVotingRateHistory([]);
    setResponseTimes([]);

    // Initialize with base votes
    const baseVotes = Math.floor(Math.random() * 400) + 600;
    const initialVotes = {
      agent1: Math.floor(baseVotes * 0.49),
      agent2: Math.floor(baseVotes * 0.51),
      total: baseVotes,
    };
    setLiveVotes(initialVotes);
    setPreviousPercentages({
      agent1: (initialVotes.agent1 / initialVotes.total) * 100,
      agent2: (initialVotes.agent2 / initialVotes.total) * 100,
    });

    await append({
      role: "user",
      content: `Topic: ${actualTopic}. Give your opening statement as ${AGENTS[agent1].name}.`,
    });

    // Set response start time for the first message
    setResponseStartTime(Date.now());
  };

  const resetDebate = () => {
    setDebateStarted(false);
    setMessages([]);
    setRoundCount(0);
    setCurrentSpeaker(agent1);
    setUserVoted(false);
    setUserVote(null);
    setVoteSurge(null);
    setLiveVotes({ agent1: 0, agent2: 0, total: 0 });
    setPreviousPercentages({ agent1: 0, agent2: 0 });
    setShowAnalytics(false);
    resetValidation();
    setError(null);
  };

  const vote = (votedAgent: "agent1" | "agent2") => {
    if (userVoted) return;
    setUserVote(votedAgent);
    setUserVoted(true);
    setLiveVotes((prev) => ({
      ...prev,
      [votedAgent]: prev[votedAgent] + 1,
      total: prev.total + 1,
    }));
  };

  // Auto-continue debate
  useEffect(() => {
    if (
      debateStarted &&
      !isLoading &&
      messages.length > 0 &&
      roundCount < 6 &&
      roundCount > 0
    ) {
      const timer = setTimeout(async () => {
        const lastMessage = messages[messages.length - 1];
        setResponseStartTime(Date.now()); // Set response start time
        await append({
          role: "user",
          content: `Respond to: "${lastMessage.content}". Continue the debate on: ${selectedTopic}`,
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, roundCount, debateStarted]);

  const isDebateComplete = roundCount >= maxRounds;
  const agent1Percentage =
    liveVotes.total > 0 ? (liveVotes.agent1 / liveVotes.total) * 100 : 50;
  const agent2Percentage =
    liveVotes.total > 0 ? (liveVotes.agent2 / liveVotes.total) * 100 : 50;

  const agent1Change = agent1Percentage - previousPercentages.agent1;
  const agent2Change = agent2Percentage - previousPercentages.agent2;

  const leadingAgent =
    agent1Percentage > agent2Percentage ? "agent1" : "agent2";
  const leadMargin = Math.abs(agent1Percentage - agent2Percentage);

  const currentVotingRate =
    votingRateHistory.length > 0
      ? votingRateHistory[votingRateHistory.length - 1]
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-red-900 text-white">
      <div className="max-w-6xl mx-auto p-4">
        {/* Minimal Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-1">
            <Flame className="w-6 h-6 text-red-400" />
            SattaGPT
          </h1>
          <p className="text-red-300 text-sm">Indian Political Standoff</p>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <Alert
                variant="destructive"
                className="bg-red-900/50 border-red-700"
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  <div className="flex items-center justify-between">
                    <span>{error}</span>
                    <button
                      onClick={() => setError(null)}
                      className="ml-2 p-1 hover:bg-red-800 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {!debateStarted ? (
          /* Setup */
          <div className="max-w-3xl mx-auto">
            <Card className="bg-slate-800/50 border-red-800/50">
              <CardHeader>
                <CardTitle className="text-white text-xl">
                  Setup Debate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Topics */}
                <div>
                  <h3 className="text-red-200 mb-3 text-sm font-medium">
                    What topic do you want to see debated?
                  </h3>

                  {/* Custom Topic Input */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Enter your own debate topic..."
                      value={
                        selectedTopic.startsWith("custom:")
                          ? selectedTopic.slice(7)
                          : ""
                      }
                      onChange={(e) => {
                        const newValue = e.target.value
                          ? `custom:${e.target.value}`
                          : "";
                        setSelectedTopic(newValue);
                        // Reset validation when user starts typing
                        if (newValue !== selectedTopic) {
                          resetValidation();
                        }
                      }}
                      className={`w-full p-2 rounded text-sm bg-slate-700/50 text-slate-100 placeholder-slate-400 border focus:outline-none ${
                        selectedTopic.startsWith("custom:") &&
                        selectedTopic.slice(7).trim() &&
                        (topicValidation.isChecking || topicValidation.message)
                          ? topicValidation.isValid
                            ? "border-green-500 focus:border-green-400"
                            : topicValidation.isChecking
                            ? "border-yellow-500 focus:border-yellow-400"
                            : "border-red-500 focus:border-red-400"
                          : "border-slate-600/50 focus:border-red-500"
                      }`}
                    />

                    {/* Validation Feedback */}
                    {selectedTopic.startsWith("custom:") &&
                      selectedTopic.slice(7).trim() &&
                      (topicValidation.isChecking ||
                        topicValidation.message) && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          {topicValidation.isChecking ? (
                            <>
                              <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-yellow-400">
                                Validating topic...
                              </span>
                            </>
                          ) : topicValidation.isValid ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-green-400">
                                {topicValidation.message}
                              </span>
                            </>
                          ) : topicValidation.message ? (
                            <>
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="text-red-400">
                                {topicValidation.message}
                              </span>
                            </>
                          ) : null}
                        </div>
                      )}
                  </div>

                  {/* Suggested Topics */}
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs mb-2">
                      Or choose from trending topics:
                    </p>
                    {TOPICS.map((topic, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTopic(topic)}
                        className={`w-full p-2 text-left rounded text-sm transition-all ${
                          selectedTopic === topic
                            ? "bg-red-600 text-white"
                            : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agent Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-red-200 mb-2 text-sm font-medium">
                      Left:
                    </h3>
                    <div className="space-y-1">
                      {Object.entries(AGENTS).map(([key, agent]) => (
                        <button
                          key={key}
                          onClick={() => setAgent1(key as keyof typeof AGENTS)}
                          disabled={key === agent2}
                          className={`w-full p-2 rounded text-left text-sm transition-all ${
                            agent1 === key
                              ? `${agent.color} text-white`
                              : key === agent2
                              ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                              : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{agent.avatar}</span>
                            <span className="font-medium">{agent.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-red-200 mb-2 text-sm font-medium">
                      Right:
                    </h3>
                    <div className="space-y-1">
                      {Object.entries(AGENTS).map(([key, agent]) => (
                        <button
                          key={key}
                          onClick={() => setAgent2(key as keyof typeof AGENTS)}
                          disabled={key === agent1}
                          className={`w-full p-2 rounded text-left text-sm transition-all ${
                            agent2 === key
                              ? `${agent.color} text-white`
                              : key === agent1
                              ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                              : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{agent.avatar}</span>
                            <span className="font-medium">{agent.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={startDebate}
                  disabled={
                    !selectedTopic ||
                    (selectedTopic.startsWith("custom:") &&
                      (!selectedTopic.slice(7).trim() ||
                        topicValidation.isChecking))
                  }
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {topicValidation.isChecking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Validating...
                    </>
                  ) : (
                    "Start Debate"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Debate Interface */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Debate */}
            <div className="lg:col-span-3">
              <Card className="bg-slate-800/50 border-red-800/50">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg leading-tight">
                        {selectedTopic.startsWith("custom:")
                          ? selectedTopic.slice(7)
                          : selectedTopic}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <span>{AGENTS[agent1].avatar}</span>
                          <span className="text-slate-300">
                            {AGENTS[agent1].name}
                          </span>
                        </span>
                        <span className="text-red-400">vs</span>
                        <span className="flex items-center gap-1">
                          <span>{AGENTS[agent2].avatar}</span>
                          <span className="text-slate-300">
                            {AGENTS[agent2].name}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-700 text-white text-xs">
                        {Math.ceil(roundCount / 2) + (roundCount === 0 ? 1 : 0)}
                        /3
                      </Badge>
                      <Button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-white"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={resetDebate}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-white"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="space-y-3 max-h-80 overflow-y-auto"
                    ref={messagesContainerRef}
                  >
                    {messages
                      .filter((m) => m.role === "assistant")
                      .map((message, index) => {
                        const isAgent1Turn = index % 2 === 0;
                        const currentAgent = isAgent1Turn ? agent1 : agent2;
                        const agentKey = isAgent1Turn ? "agent1" : "agent2";
                        const isSurging = voteSurge === agentKey;

                        return (
                          <motion.div
                            key={message.id}
                            className={`flex ${
                              isAgent1Turn ? "justify-start" : "justify-end"
                            }`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="max-w-[80%]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">
                                  {AGENTS[currentAgent].avatar}
                                </span>
                                <span className="text-sm font-medium text-white">
                                  {AGENTS[currentAgent].name}
                                </span>
                                <AnimatePresence>
                                  {isSurging && (
                                    <motion.div
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      exit={{ scale: 0, opacity: 0 }}
                                      className="flex items-center gap-1 text-xs text-green-400"
                                    >
                                      <TrendingUp className="w-3 h-3" />
                                      <span>
                                        +{Math.floor(Math.random() * 100) + 50}
                                      </span>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <motion.div
                                className={`bg-slate-700/50 border border-slate-600/50 p-3 rounded-lg ${
                                  isSurging ? "ring-2 ring-green-400/50" : ""
                                }`}
                                animate={
                                  isSurging ? { scale: [1, 1.02, 1] } : {}
                                }
                                transition={{ duration: 0.5 }}
                              >
                                <p className="text-slate-100 text-sm leading-relaxed">
                                  {message.content}
                                </p>
                              </motion.div>
                            </div>
                          </motion.div>
                        );
                      })}

                    {isLoading && (
                      <div className="flex justify-center">
                        <div className="flex items-center gap-2 text-red-400">
                          <span>{AGENTS[currentSpeaker].avatar}</span>
                          <span className="text-sm">
                            {AGENTS[currentSpeaker].name} typing...
                          </span>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-1 h-1 bg-red-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.1}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Panel */}
              <AnimatePresence>
                {showAnalytics && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <Card className="bg-slate-800/50 border-blue-800/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-lg">
                          <BarChart3 className="w-5 h-5 text-blue-400" />
                          Debate Analytics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-slate-700/30 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className="w-4 h-4 text-green-400" />
                              <span className="text-xs text-slate-400">
                                Engagement
                              </span>
                            </div>
                            <div className="text-lg font-bold text-white">
                              {analytics.engagementScore.toFixed(0)}%
                            </div>
                          </div>

                          <div className="bg-slate-700/30 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-4 h-4 text-blue-400" />
                              <span className="text-xs text-slate-400">
                                Voting Rate
                              </span>
                            </div>
                            <div className="text-lg font-bold text-white">
                              {currentVotingRate.toFixed(1)}/s
                            </div>
                          </div>

                          <div className="bg-slate-700/30 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-yellow-400" />
                              <span className="text-xs text-slate-400">
                                Avg Response
                              </span>
                            </div>
                            <div className="text-lg font-bold text-white">
                              {(analytics.averageResponseTime / 1000).toFixed(
                                1
                              )}
                              s
                            </div>
                          </div>

                          <div className="bg-slate-700/30 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="w-4 h-4 text-purple-400" />
                              <span className="text-xs text-slate-400">
                                Momentum Shifts
                              </span>
                            </div>
                            <div className="text-lg font-bold text-white">
                              {analytics.momentumShifts}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-700/30 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-white mb-2">
                              Round Performance
                            </h4>
                            <div className="space-y-2">
                              {analytics.roundPerformance.map(
                                (round, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <span className="text-slate-400">
                                      Round {round.round}
                                    </span>
                                    <div className="flex gap-2">
                                      <span className="text-orange-400">
                                        {AGENTS[agent1].avatar} +
                                        {round.agent1Gain}
                                      </span>
                                      <span className="text-blue-400">
                                        {AGENTS[agent2].avatar} +
                                        {round.agent2Gain}
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-700/30 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-white mb-2">
                              Key Insights
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-3 h-3 text-green-400" />
                                <span className="text-slate-300">
                                  Peak voting:{" "}
                                  {analytics.peakVotingRate.toFixed(1)}{" "}
                                  votes/sec
                                </span>
                              </div>
                              {analytics.strongestArgument.agent && (
                                <div className="flex items-center gap-2">
                                  <Target className="w-3 h-3 text-yellow-400" />
                                  <span className="text-slate-300">
                                    Strongest:{" "}
                                    {analytics.strongestArgument.agent} R
                                    {analytics.strongestArgument.round}
                                    (+{analytics.strongestArgument.voteGain})
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3 text-purple-400" />
                                <span className="text-slate-300">
                                  {leadMargin > 10
                                    ? "Decisive lead"
                                    : leadMargin > 5
                                    ? "Clear advantage"
                                    : "Tight race"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Live Voting Sidebar */}
            <div>
              <Card className="bg-slate-800/50 border-red-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-sm">
                    <Vote className="w-4 h-4" />
                    Live Poll
                  </CardTitle>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3 h-3" />
                      <span className="font-mono">
                        {liveVotes.total.toLocaleString()}
                      </span>
                    </div>
                    {leadMargin > 1 && (
                      <motion.div
                        className="flex items-center gap-1 text-yellow-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <span className="text-xs">
                          Lead: {leadMargin.toFixed(1)}%
                        </span>
                      </motion.div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Vote Buttons with Animations */}
                  <div className="space-y-2">
                    <motion.button
                      onClick={() => vote("agent1")}
                      disabled={userVoted}
                      className={`w-full p-2 rounded text-left text-sm transition-all ${
                        userVote === "agent1"
                          ? `${AGENTS[agent1].color} text-white`
                          : userVoted
                          ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                          : `${AGENTS[agent1].color} hover:opacity-80 text-white`
                      }`}
                      animate={
                        voteSurge === "agent1" ? { scale: [1, 1.05, 1] } : {}
                      }
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{AGENTS[agent1].avatar}</span>
                          <span className="font-medium">
                            {AGENTS[agent1].name}
                          </span>
                          {leadingAgent === "agent1" && leadMargin > 2 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-yellow-400"
                            >
                              👑
                            </motion.div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <motion.span
                            className="font-mono text-xs"
                            key={agent1Percentage}
                            initial={{ scale: 1.2, color: "#fbbf24" }}
                            animate={{ scale: 1, color: "#ffffff" }}
                            transition={{ duration: 0.3 }}
                          >
                            {agent1Percentage.toFixed(1)}%
                          </motion.span>
                          {agent1Change > 0.5 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-green-400"
                            >
                              <TrendingUp className="w-3 h-3" />
                            </motion.div>
                          )}
                          {agent1Change < -0.5 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-red-400"
                            >
                              <TrendingDown className="w-3 h-3" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={() => vote("agent2")}
                      disabled={userVoted}
                      className={`w-full p-2 rounded text-left text-sm transition-all ${
                        userVote === "agent2"
                          ? `${AGENTS[agent2].color} text-white`
                          : userVoted
                          ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                          : `${AGENTS[agent2].color} hover:opacity-80 text-white`
                      }`}
                      animate={
                        voteSurge === "agent2" ? { scale: [1, 1.05, 1] } : {}
                      }
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{AGENTS[agent2].avatar}</span>
                          <span className="font-medium">
                            {AGENTS[agent2].name}
                          </span>
                          {leadingAgent === "agent2" && leadMargin > 2 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-yellow-400"
                            >
                              👑
                            </motion.div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <motion.span
                            className="font-mono text-xs"
                            key={agent2Percentage}
                            initial={{ scale: 1.2, color: "#fbbf24" }}
                            animate={{ scale: 1, color: "#ffffff" }}
                            transition={{ duration: 0.3 }}
                          >
                            {agent2Percentage.toFixed(1)}%
                          </motion.span>
                          {agent2Change > 0.5 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-green-400"
                            >
                              <TrendingUp className="w-3 h-3" />
                            </motion.div>
                          )}
                          {agent2Change < -0.5 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-red-400"
                            >
                              <TrendingDown className="w-3 h-3" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex h-3 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`${AGENTS[agent1].color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${agent1Percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                      <motion.div
                        className={`${AGENTS[agent2].color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${agent2Percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                      <motion.span
                        key={liveVotes.agent1}
                        initial={{ scale: 1.1, color: "#fbbf24" }}
                        animate={{ scale: 1, color: "#9ca3af" }}
                        transition={{ duration: 0.3 }}
                      >
                        {liveVotes.agent1.toLocaleString()}
                      </motion.span>
                      <motion.span
                        key={liveVotes.agent2}
                        initial={{ scale: 1.1, color: "#fbbf24" }}
                        animate={{ scale: 1, color: "#9ca3af" }}
                        transition={{ duration: 0.3 }}
                      >
                        {liveVotes.agent2.toLocaleString()}
                      </motion.span>
                    </div>
                  </div>

                  {/* Real-time Stats */}
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span
                        className={
                          isDebateComplete
                            ? "text-green-400"
                            : "text-yellow-400"
                        }
                      >
                        {isDebateComplete ? "Complete" : "Live"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span className="text-blue-400">
                        {currentVotingRate.toFixed(1)}/s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Engagement:</span>
                      <span className="text-green-400">
                        {analytics.engagementScore.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
