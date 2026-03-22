import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LinearGradient from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

interface Language {
  id: string;
  name: string;
  extension: string;
  template: string;
}

export default function CodeEditorScreen() {
  const { theme } = useTheme();
  
  const [selectedLanguage, setSelectedLanguage] = useState<Language>({
    id: 'javascript',
    name: 'JavaScript',
    extension: 'js',
    template: `// JavaScript Code
function solution() {
    // Write your code here
    console.log("Hello, World!");
}

solution();`
  });
  
  const [code, setCode] = useState(selectedLanguage.template);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const languages: Language[] = [
    {
      id: 'javascript',
      name: 'JavaScript',
      extension: 'js',
      template: `// JavaScript Code
function solution() {
    // Write your code here
    console.log("Hello, World!");
}

solution();`
    },
    {
      id: 'python',
      name: 'Python',
      extension: 'py',
      template: `# Python Code
def solution():
    # Write your code here
    print("Hello, World!")

solution()`
    },
    {
      id: 'java',
      name: 'Java',
      extension: 'java',
      template: `// Java Code
public class Main {
    public static void main(String[] args) {
        // Write your code here
        System.out.println("Hello, World!");
    }
}`
    },
    {
      id: 'cpp',
      name: 'C++',
      extension: 'cpp',
      template: `// C++ Code
#include <iostream>
using namespace std;

int main() {
    // Write your code here
    cout << "Hello, World!" << endl;
    return 0;
}`
    },
    {
      id: 'c',
      name: 'C',
      extension: 'c',
      template: `// C Code
#include <stdio.h>

int main() {
    // Write your code here
    printf("Hello, World!\\n");
    return 0;
}`
    },
  ];

  const selectLanguage = (language: Language) => {
    setSelectedLanguage(language);
    setCode(language.template);
    setOutput('');
    setShowLanguageModal(false);
  };

  const runCode = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please write some code before running.');
      return;
    }

    setIsRunning(true);
    setOutput('Running code...');

    try {
      // Simulate code execution (in a real app, this would call a code execution API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock output based on language
      let mockOutput = '';
      if (code.includes('Hello, World!')) {
        mockOutput = 'Hello, World!\n';
      } else if (code.includes('console.log') || code.includes('print') || code.includes('cout') || code.includes('printf')) {
        mockOutput = 'Code executed successfully!\nOutput: [Your program output would appear here]\n';
      } else {
        mockOutput = 'Code compiled and executed.\nNo output generated.\n';
      }

      if (input.trim()) {
        mockOutput += `\nInput provided: ${input}\n`;
      }

      mockOutput += `\nExecution completed in ${Math.random() * 2 + 0.5}s`;
      
      setOutput(mockOutput);
    } catch (error) {
      setOutput('Error: Failed to execute code. Please check your syntax and try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const clearCode = () => {
    Alert.alert(
      'Clear Code',
      'Are you sure you want to clear all code? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setCode(selectedLanguage.template);
            setOutput('');
            setInput('');
          }
        },
      ]
    );
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
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    languageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.colors.primary + '20',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
    },
    languageButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
      marginRight: 6,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    runButton: {
      backgroundColor: theme.colors.success,
    },
    clearButton: {
      backgroundColor: theme.colors.error + '20',
      borderWidth: 1,
      borderColor: theme.colors.error + '40',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.error,
    },
    content: {
      flex: 1,
    },
    codeSection: {
      flex: 1,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    codeInput: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: 'monospace',
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inputSection: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    inputField: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: 'monospace',
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    outputSection: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    outputContainer: {
      backgroundColor: '#1a1a1a',
      borderRadius: 8,
      padding: 12,
      minHeight: 120,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    outputText: {
      fontSize: 14,
      color: '#00ff00',
      fontFamily: 'monospace',
      lineHeight: 20,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      maxHeight: '70%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    languageItemSelected: {
      backgroundColor: theme.colors.primary + '20',
      borderColor: theme.colors.primary,
    },
    languageItemText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    languageItemTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    modalCloseButton: {
      marginTop: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalCloseButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Code Editor</Text>
        <Text style={styles.subtitle}>Practice coding in multiple languages</Text>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguageModal(true)}
        >
          <Text style={styles.languageButtonText}>{selectedLanguage.name}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={clearCode}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.runButton]}
            onPress={runCode}
            disabled={isRunning}
          >
            <Text style={styles.actionButtonText}>
              {isRunning ? 'Running...' : 'Run'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Code Editor */}
        <View style={styles.codeSection}>
          <Text style={styles.sectionTitle}>Code Editor</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            placeholder={`Write your ${selectedLanguage.name} code here...`}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            autoCorrect={false}
            autoCapitalize="none"
            textAlignVertical="top"
          />
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Program Input (stdin)</Text>
          <TextInput
            style={styles.inputField}
            value={input}
            onChangeText={setInput}
            placeholder="Enter input for your program (if needed)..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {/* Output Section */}
        <View style={styles.outputSection}>
          <Text style={styles.sectionTitle}>Output</Text>
          <View style={styles.outputContainer}>
            <Text style={styles.outputText}>
              {output || '// Output will appear here after running your code'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal visible={showLanguageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.id}
                  style={[
                    styles.languageItem,
                    selectedLanguage.id === language.id && styles.languageItemSelected,
                  ]}
                  onPress={() => selectLanguage(language)}
                >
                  <Text
                    style={[
                      styles.languageItemText,
                      selectedLanguage.id === language.id && styles.languageItemTextSelected,
                    ]}
                  >
                    {language.name}
                  </Text>
                  {selectedLanguage.id === language.id && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
