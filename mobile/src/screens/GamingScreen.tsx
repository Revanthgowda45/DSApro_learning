import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LinearGradient from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
  hints: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

interface GameSession {
  challengeId: string;
  startTime: Date;
  timeElapsed: number;
  hintsUsed: number;
  completed: boolean;
  score?: number;
}

export default function GamingScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [challenges] = useState<Challenge[]>([
    {
      id: 'challenge_1',
      title: 'Two Sum Challenge',
      description: 'Given an array of integers and a target sum, return indices of two numbers that add up to the target.',
      difficulty: 'Easy',
      timeLimit: 15,
      hints: [
        'Think about using a hash map to store numbers you\'ve seen',
        'For each number, check if target - number exists in your hash map',
        'Don\'t forget to return the indices, not the values'
      ],
      testCases: [
        { input: '[2,7,11,15], target=9', expectedOutput: '[0,1]' },
        { input: '[3,2,4], target=6', expectedOutput: '[1,2]' }
      ]
    },
    {
      id: 'challenge_2',
      title: 'Palindrome Check',
      description: 'Write a function to check if a given string is a palindrome (reads the same forwards and backwards).',
      difficulty: 'Easy',
      timeLimit: 10,
      hints: [
        'You can use two pointers from start and end',
        'Remember to handle case sensitivity',
        'Consider ignoring spaces and special characters'
      ],
      testCases: [
        { input: '"racecar"', expectedOutput: 'true' },
        { input: '"hello"', expectedOutput: 'false' }
      ]
    },
    {
      id: 'challenge_3',
      title: 'Binary Tree Traversal',
      description: 'Implement in-order traversal of a binary tree and return the values in an array.',
      difficulty: 'Medium',
      timeLimit: 25,
      hints: [
        'In-order means: left subtree, root, right subtree',
        'You can use recursion or an iterative approach with a stack',
        'Base case: if node is null, return'
      ],
      testCases: [
        { input: 'Tree: [1,null,2,3]', expectedOutput: '[1,3,2]' },
        { input: 'Tree: [1,2,3,4,5]', expectedOutput: '[4,2,5,1,3]' }
      ]
    }
  ]);

  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [userSolution, setUserSolution] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    isCorrect: boolean;
    score: number;
    feedback: string;
    suggestions: string[];
  } | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameSession && !gameSession.completed && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameSession, timeLeft]);

  const startChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setGameSession({
      challengeId: challenge.id,
      startTime: new Date(),
      timeElapsed: 0,
      hintsUsed: 0,
      completed: false,
    });
    setTimeLeft(challenge.timeLimit * 60); // Convert to seconds
    setUserSolution('');
    setShowHints(false);
    setCurrentHint(0);
    setShowResults(false);
    setEvaluation(null);
  };

  const handleTimeUp = () => {
    if (gameSession) {
      Alert.alert(
        'Time\'s Up!',
        'The challenge time has expired. You can still submit your solution, but your score will be affected.',
        [{ text: 'OK' }]
      );
    }
  };

  const useHint = () => {
    if (!selectedChallenge || !gameSession) return;
    
    if (currentHint < selectedChallenge.hints.length) {
      setShowHints(true);
      setCurrentHint(prev => prev + 1);
      setGameSession(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : null);
    }
  };

  const submitSolution = async () => {
    if (!selectedChallenge || !gameSession || !userSolution.trim()) {
      Alert.alert('Error', 'Please write your solution before submitting.');
      return;
    }

    try {
      // Calculate final time elapsed
      const timeElapsed = Math.floor((Date.now() - gameSession.startTime.getTime()) / 1000);
      
      // Simple evaluation logic (in a real app, this would use AI or proper test execution)
      const evaluation = evaluateSolution(selectedChallenge, userSolution, timeElapsed, gameSession.hintsUsed);
      
      setEvaluation(evaluation);
      setGameSession(prev => prev ? { 
        ...prev, 
        completed: true, 
        timeElapsed,
        score: evaluation.score 
      } : null);
      setShowResults(true);

    } catch (error) {
      Alert.alert('Error', 'Failed to evaluate solution. Please try again.');
    }
  };

  const evaluateSolution = (
    challenge: Challenge,
    solution: string,
    timeElapsed: number,
    hintsUsed: number
  ) => {
    // Simple evaluation logic - in a real app this would be more sophisticated
    const hasKeywords = solution.toLowerCase().includes('function') || 
                       solution.toLowerCase().includes('def') ||
                       solution.toLowerCase().includes('const') ||
                       solution.toLowerCase().includes('let');
    
    const hasLogic = solution.length > 50; // Basic check for substantial code
    const isWithinTime = timeElapsed <= challenge.timeLimit * 60;
    
    let score = 0;
    let feedback = '';
    const suggestions: string[] = [];

    if (hasKeywords && hasLogic) {
      score = 70; // Base score
      
      if (isWithinTime) {
        score += 20;
        feedback = 'Good job! Your solution looks structured and was submitted on time.';
      } else {
        feedback = 'Your solution looks good, but it was submitted after the time limit.';
      }
      
      // Deduct points for hints
      score -= hintsUsed * 5;
      
      if (hintsUsed === 0) {
        score += 10;
        feedback += ' Excellent work solving it without hints!';
      }
      
    } else {
      score = 30;
      feedback = 'Your solution needs more work. Make sure to implement the complete logic.';
      suggestions.push('Add proper function structure');
      suggestions.push('Implement the core algorithm');
      suggestions.push('Handle edge cases');
    }

    return {
      isCorrect: score >= 60,
      score: Math.max(0, Math.min(100, score)),
      feedback,
      suggestions,
    };
  };

  const resetChallenge = () => {
    setSelectedChallenge(null);
    setGameSession(null);
    setUserSolution('');
    setShowHints(false);
    setCurrentHint(0);
    setTimeLeft(0);
    setShowResults(false);
    setEvaluation(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return theme.colors.success;
      case 'Medium': return theme.colors.warning;
      case 'Hard': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    challengeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    challengeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    challengeTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginRight: 12,
    },
    difficultyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    difficultyText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    challengeDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    challengeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    startButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    startButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
    },
    gameContainer: {
      flex: 1,
    },
    gameHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    backButtonText: {
      fontSize: 16,
      color: theme.colors.primary,
      marginLeft: 4,
    },
    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: timeLeft < 60 ? theme.colors.error + '20' : theme.colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    timerText: {
      fontSize: 16,
      fontWeight: '600',
      color: timeLeft < 60 ? theme.colors.error : theme.colors.primary,
      marginLeft: 4,
    },
    problemSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    problemText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    solutionInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 200,
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: 'monospace',
      textAlignVertical: 'top',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    hintButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.warning + '20',
      borderWidth: 1,
      borderColor: theme.colors.warning,
    },
    hintButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.warning,
      marginLeft: 6,
    },
    submitButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    hintsSection: {
      backgroundColor: theme.colors.warning + '10',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.warning + '30',
    },
    hintText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
  });

  if (selectedChallenge && gameSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.gameHeader}>
            <TouchableOpacity style={styles.backButton} onPress={resetChallenge}>
              <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            
            <View style={styles.timerContainer}>
              <Ionicons 
                name="timer" 
                size={16} 
                color={timeLeft < 60 ? theme.colors.error : theme.colors.primary} 
              />
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.problemSection}>
              <Text style={styles.sectionTitle}>{selectedChallenge.title}</Text>
              <Text style={styles.problemText}>{selectedChallenge.description}</Text>
            </View>

            {showHints && currentHint > 0 && (
              <Animatable.View animation="fadeInUp" style={styles.hintsSection}>
                <Text style={styles.sectionTitle}>
                  💡 Hint {currentHint}/{selectedChallenge.hints.length}
                </Text>
                <Text style={styles.hintText}>
                  {selectedChallenge.hints[currentHint - 1]}
                </Text>
              </Animatable.View>
            )}

            <TextInput
              style={styles.solutionInput}
              placeholder="Write your solution here..."
              placeholderTextColor={theme.colors.textSecondary}
              value={userSolution}
              onChangeText={setUserSolution}
              multiline
              autoCorrect={false}
              autoCapitalize="none"
            />

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.hintButton}
                onPress={useHint}
                disabled={currentHint >= selectedChallenge.hints.length}
              >
                <Ionicons name="bulb" size={16} color={theme.colors.warning} />
                <Text style={styles.hintButtonText}>
                  Hint ({currentHint}/{selectedChallenge.hints.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={submitSolution}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.submitButton}
                >
                  <Text style={styles.submitButtonText}>Submit Solution</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Results Modal */}
        <Modal visible={showResults} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text, textAlign: 'center', marginBottom: 16 }}>
                Challenge Complete!
              </Text>
              
              {evaluation && (
                <>
                  <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>
                    {evaluation.score}
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
                    {evaluation.feedback}
                  </Text>
                  
                  {evaluation.suggestions.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8 }}>
                        Suggestions:
                      </Text>
                      {evaluation.suggestions.map((suggestion, index) => (
                        <Text key={index} style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
                          • {suggestion}
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity
                onPress={resetChallenge}
                style={{ backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Try Another Challenge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Gaming Challenges</Text>
        <Text style={styles.subtitle}>Test your coding skills with timed challenges</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {challenges.map((challenge, index) => (
          <Animatable.View
            key={challenge.id}
            animation="fadeInUp"
            delay={index * 100}
            style={styles.challengeCard}
          >
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(challenge.difficulty) }]}>
                <Text style={styles.difficultyText}>{challenge.difficulty}</Text>
              </View>
            </View>
            
            <Text style={styles.challengeDescription}>{challenge.description}</Text>
            
            <View style={styles.challengeInfo}>
              <View style={styles.timeInfo}>
                <Ionicons name="timer" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.timeText}>{challenge.timeLimit} minutes</Text>
              </View>
              
              <TouchableOpacity onPress={() => startChallenge(challenge)}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.startButton}
                >
                  <Text style={styles.startButtonText}>Start Challenge</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
