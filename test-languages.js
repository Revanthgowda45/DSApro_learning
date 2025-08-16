// Test script to verify Erlang, Elixir, and Haskell language support
const pistonService = require('./src/services/pistonService.ts');

async function testLanguages() {
  const testCases = [
    {
      language: 'erlang',
      code: `
-module(hello).
-export([start/0]).

start() ->
    io:format("Hello from Erlang!~n").
      `.trim()
    },
    {
      language: 'elixir',
      code: `
IO.puts("Hello from Elixir!")
      `.trim()
    },
    {
      language: 'haskell',
      code: `
main :: IO ()
main = putStrLn "Hello from Haskell!"
      `.trim()
    }
  ];

  console.log('🧪 Testing language support...\n');

  for (const test of testCases) {
    console.log(`Testing ${test.language}...`);
    try {
      const result = await pistonService.default.executeCode(test.code, test.language);
      console.log(`✅ ${test.language}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Output: ${result.output}`);
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${test.language}: ERROR - ${error.message}`);
    }
    console.log('');
  }
}

testLanguages().catch(console.error);
