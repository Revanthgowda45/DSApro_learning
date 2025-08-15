/**
 * Piston API Test Utility
 * Test the Piston API integration for code execution
 */

import PistonService from '../services/pistonService';

export class PistonTestRunner {
  /**
   * Test basic connectivity to Piston API
   */
  static async testConnection(): Promise<void> {
    console.log('🔍 Testing Piston API connection...');
    
    try {
      const isConnected = await PistonService.testConnection();
      if (isConnected) {
        console.log('✅ Piston API connection successful');
      } else {
        console.log('❌ Piston API connection failed');
      }
    } catch (error) {
      console.error('❌ Connection test error:', error);
    }
  }

  /**
   * Test all supported languages
   */
  static async testAllLanguages(): Promise<void> {
    console.log('🧪 Testing all supported languages...');
    
    const languages = ['javascript', 'python', 'java', 'cpp', 'c', 'go'];
    
    for (const language of languages) {
      try {
        console.log(`\n🔧 Testing ${language}...`);
        const result = await PistonService.testLanguage(language);
        
        if (result.success) {
          console.log(`✅ ${language}: ${result.output}`);
        } else {
          console.log(`❌ ${language}: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ ${language} test failed:`, error);
      }
    }
  }

  /**
   * Test specific code execution
   */
  static async testCodeExecution(language: string, code: string): Promise<void> {
    console.log(`🚀 Testing ${language} code execution...`);
    console.log('📝 Code:', code);
    
    try {
      const result = await PistonService.executeCode(language, code);
      
      console.log('📊 Result:', {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime + 'ms'
      });
    } catch (error) {
      console.error('❌ Execution test failed:', error);
    }
  }

  /**
   * Run comprehensive test suite
   */
  static async runFullTestSuite(): Promise<void> {
    console.log('🎯 Running Piston API Full Test Suite...\n');
    
    // Test connection
    await this.testConnection();
    
    // Test all languages
    await this.testAllLanguages();
    
    // Test specific examples
    console.log('\n🎪 Testing specific code examples...');
    
    // JavaScript example
    await this.testCodeExecution('javascript', `
console.log("Hello from JavaScript!");
const sum = (a, b) => a + b;
console.log("Sum of 5 + 3 =", sum(5, 3));
    `);
    
    // Python example
    await this.testCodeExecution('python', `
print("Hello from Python!")
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(f"Factorial of 5 = {factorial(5)}")
    `);
    
    // Java example
    await this.testCodeExecution('java', `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        System.out.println("2 + 2 = " + (2 + 2));
    }
}
    `);
    
    console.log('\n🎉 Test suite completed!');
  }
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).PistonTestRunner = PistonTestRunner;
  (window as any).testPiston = () => PistonTestRunner.runFullTestSuite();
}
