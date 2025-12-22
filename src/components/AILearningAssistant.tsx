import React, { useState, useEffect, useRef } from 'react';
import {
  getConversations,
  createConversation,
  sendMessage,
  deleteConversation,
  getLearningPaths,
  getUserProgress,
  getTopicSuggestions,
  getAllTopics,
  Conversation,
  ChatMessage,
  LearningPath,
  UserProgress,
  LearningTopic
} from '../services/aiLearningAssistant';

type ViewType = 'chat' | 'paths' | 'progress';

export const AILearningAssistant: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<LearningTopic | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const loadData = async () => {
    const [convos, paths, progress] = await Promise.all([
      getConversations('demo-user'),
      getLearningPaths('demo-user'),
      getUserProgress('demo-user')
    ]);
    setConversations(convos);
    setLearningPaths(paths);
    setUserProgress(progress);
    if (convos.length > 0) {
      setActiveConversation(convos[0]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewChat = async () => {
    const newConvo = await createConversation('demo-user', 'New Conversation');
    setConversations([newConvo, ...conversations]);
    setActiveConversation(newConvo);
    setInputValue('');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    // Update UI immediately with user message
    if (activeConversation) {
      setActiveConversation({
        ...activeConversation,
        messages: [...activeConversation.messages, userMessage]
      });
    } else {
      const newConvo = await createConversation('demo-user', inputValue.substring(0, 50));
      setActiveConversation({
        ...newConvo,
        messages: [userMessage]
      });
      setConversations([newConvo, ...conversations]);
    }

    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessage(
        activeConversation?.id || 'new',
        inputValue
      );

      setActiveConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, response],
        title: prev.messages.length === 0 ? inputValue.substring(0, 50) : prev.title
      } : null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (convoId: string) => {
    await deleteConversation(convoId);
    const updatedConvos = conversations.filter(c => c.id !== convoId);
    setConversations(updatedConvos);
    if (activeConversation?.id === convoId) {
      setActiveConversation(updatedConvos[0] || null);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const topics = getAllTopics();
  const suggestions = selectedTopic ? getTopicSuggestions(selectedTopic) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Learning Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your personal crypto education companion
            </p>
          </div>
        </div>
      </div>

      {/* Progress Banner */}
      {userProgress && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{userProgress.streakDays}</p>
                <p className="text-purple-200 text-sm">Day Streak 🔥</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{userProgress.questionsAsked}</p>
                <p className="text-purple-200 text-sm">Questions Asked</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{userProgress.averageQuizScore}%</p>
                <p className="text-purple-200 text-sm">Quiz Average</p>
              </div>
            </div>
            <div className="flex gap-2">
              {userProgress.achievements.slice(0, 4).map(achievement => (
                <div
                  key={achievement.id}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                  title={achievement.name}
                >
                  <span>{achievement.icon}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'chat', label: 'Chat', icon: '💬' },
            { id: 'paths', label: 'Learning Paths', icon: '🎓' },
            { id: 'progress', label: 'My Progress', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as ViewType)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === tab.id
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Chat View */}
      {activeView === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <button
              onClick={handleNewChat}
              className="w-full mb-4 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>+</span> New Chat
            </button>

            {/* Topic Filters */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topics</p>
              <div className="flex flex-wrap gap-2">
                {topics.slice(0, 6).map(topic => (
                  <button
                    key={topic.topic}
                    onClick={() => setSelectedTopic(selectedTopic === topic.topic ? null : topic.topic)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTopic === topic.topic
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {topic.icon} {topic.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation History */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Chats</p>
              {conversations.map(convo => (
                <div
                  key={convo.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                    activeConversation?.id === convo.id
                      ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setActiveConversation(convo)}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                      {convo.title}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(convo.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-2"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(convo.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeConversation?.messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      How can I help you learn today?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Ask me anything about cryptocurrency, blockchain, or trading
                    </p>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="max-w-lg mx-auto">
                        <p className="text-sm text-gray-500 mb-3">Suggested questions:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {suggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeConversation?.messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {message.content.split('\n').map((line, i) => (
                          <p key={i} className="mb-2 last:mb-0">{line}</p>
                        ))}
                      </div>
                      {message.metadata?.relatedTopics && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Related topics:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.metadata.relatedTopics.map((topic, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-white/20 rounded text-xs"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about crypto..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learning Paths View */}
      {activeView === 'paths' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {learningPaths.map(path => (
            <div
              key={path.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {path.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {path.description}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  path.difficulty === 'beginner'
                    ? 'bg-green-100 text-green-700'
                    : path.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {path.difficulty}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">{path.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${path.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span>📚 {path.modules.length} modules</span>
                <span>⏱️ {path.estimatedHours}h estimated</span>
              </div>

              <button className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                {path.progress > 0 ? 'Continue Learning' : 'Start Path'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Progress View */}
      {activeView === 'progress' && userProgress && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Conversations</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {userProgress.totalConversations}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Questions Asked</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {userProgress.questionsAsked}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quizzes Taken</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {userProgress.quizzesTaken}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-purple-600">
                {userProgress.averageQuizScore}%
              </p>
            </div>
          </div>

          {/* Topics Explored */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Topics Explored
            </h3>
            <div className="flex flex-wrap gap-2">
              {userProgress.topicsExplored.map(topic => {
                const topicInfo = topics.find(t => t.topic === topic);
                return (
                  <span
                    key={topic}
                    className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full"
                  >
                    {topicInfo?.icon} {topicInfo?.label || topic}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Achievements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userProgress.achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {achievement.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {achievement.description}
                  </p>
                  <p className="text-xs text-purple-600 mt-2">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AILearningAssistant;
