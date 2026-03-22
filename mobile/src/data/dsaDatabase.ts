import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Problem {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  leetcode_link?: string;
  gfg_link?: string;
  companies?: string[];
  remarks?: string;
  status?: 'not_started' | 'attempted' | 'solved' | 'mastered';
  isBookmarked?: boolean;
  rating?: number;
  notes?: string;
  timeSpent?: number;
}

// DSA Problems Database - This would typically be loaded from your backend
const DSA_PROBLEMS_DATA = [
  {
    "Topic": "Array",
    "Problem": "Two Sum",
    "Difficulty": "Easy",
    "Leetcode Link": "https://leetcode.com/problems/two-sum/",
    "GFG Link": "https://www.geeksforgeeks.org/given-an-array-a-and-a-number-x-check-for-pair-in-a-with-sum-as-x/",
    "Companies": ["Amazon", "Google", "Microsoft", "Facebook"],
    "Remarks": "Classic problem using hash map"
  },
  {
    "Topic": "Array",
    "Problem": "Best Time to Buy and Sell Stock",
    "Difficulty": "Easy",
    "Leetcode Link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    "GFG Link": "https://www.geeksforgeeks.org/stock-buy-sell/",
    "Companies": ["Amazon", "Microsoft", "Goldman Sachs"],
    "Remarks": "Single pass solution with tracking min price"
  },
  {
    "Topic": "Array",
    "Problem": "Contains Duplicate",
    "Difficulty": "Easy",
    "Leetcode Link": "https://leetcode.com/problems/contains-duplicate/",
    "GFG Link": "https://www.geeksforgeeks.org/find-duplicates-in-on-time-and-constant-extra-space/",
    "Companies": ["Google", "Apple"],
    "Remarks": "Use HashSet for O(n) solution"
  },
  {
    "Topic": "Array",
    "Problem": "Product of Array Except Self",
    "Difficulty": "Medium",
    "Leetcode Link": "https://leetcode.com/problems/product-of-array-except-self/",
    "GFG Link": "https://www.geeksforgeeks.org/a-product-array-puzzle/",
    "Companies": ["Amazon", "Microsoft", "Facebook"],
    "Remarks": "Two pass solution without division"
  },
  {
    "Topic": "Array",
    "Problem": "Maximum Subarray",
    "Difficulty": "Medium",
    "Leetcode Link": "https://leetcode.com/problems/maximum-subarray/",
    "GFG Link": "https://www.geeksforgeeks.org/largest-sum-contiguous-subarray/",
    "Companies": ["Amazon", "Google", "Microsoft"],
    "Remarks": "Kadane's Algorithm"
  },
  {
    "Topic": "String",
    "Problem": "Valid Anagram",
    "Difficulty": "Easy",
    "Leetcode Link": "https://leetcode.com/problems/valid-anagram/",
    "GFG Link": "https://www.geeksforgeeks.org/check-whether-two-strings-are-anagram-of-each-other/",
    "Companies": ["Amazon", "Microsoft"],
    "Remarks": "Sort or frequency count approach"
  },
  {
    "Topic": "String",
    "Problem": "Valid Parentheses",
    "Difficulty": "Easy",
    "Leetcode Link": "https://leetcode.com/problems/valid-parentheses/",
    "GFG Link": "https://www.geeksforgeeks.org/check-for-balanced-parentheses-in-an-expression/",
    "Companies": ["Amazon", "Google", "Microsoft"],
    "Remarks": "Stack-based solution"
  },
  {
    "Topic": "String",
    "Problem": "Longest Substring Without Repeating Characters",
    "Difficulty": "Medium",
    "Leetcode Link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    "GFG Link": "https://www.geeksforgeeks.org/length-of-the-longest-substring-without-repeating-characters/",
    "Companies": ["Amazon", "Google", "Facebook"],
    "Remarks": "Sliding window technique"
  },
  {
    "Topic": "Linked List",
    "Problem": "Reverse Linked List",
    "Difficulty": "Easy",
    "Leetcode Link": "https://leetcode.com/problems/reverse-linked-list/",
    "GFG Link": "https://www.geeksforgeeks.org/reverse-a-linked-list/",
    "Companies": ["Amazon", "Google", "Microsoft"],
    "Remarks": "Iterative and recursive approaches"
  },
  {
    "Topic": "Linked List",
    "Problem": "Merge Two Sorted Lists",
    "Difficulty": "Easy",
    "Leetcode Link": "https://leetcode.com/problems/merge-two-sorted-lists/",
    "GFG Link": "https://www.geeksforgeeks.org/merge-two-sorted-linked-lists/",
    "Companies": ["Amazon", "Microsoft"],
    "Remarks": "Two pointer approach"
  },
  {
    "Topic": "Tree",
    "Problem": "Maximum Depth of Binary Tree",
    "Difficulty": "Easy",
    "Leetcode Link": "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    "GFG Link": "https://www.geeksforgeeks.org/write-a-c-program-to-find-the-maximum-depth-or-height-of-a-tree/",
    "Companies": ["Amazon", "Google"],
    "Remarks": "DFS recursive solution"
  },
  {
    "Topic": "Tree",
    "Problem": "Same Tree",
    "Difficulty": "Easy",
    "Leetcode Link": "https://leetcode.com/problems/same-tree/",
    "GFG Link": "https://www.geeksforgeeks.org/write-c-code-to-determine-if-two-trees-are-identical/",
    "Companies": ["Google", "Microsoft"],
    "Remarks": "Recursive comparison"
  },
  {
    "Topic": "Dynamic Programming",
    "Problem": "Climbing Stairs",
    "Difficulty": "Easy",
    "Leetcode Link": "https://leetcode.com/problems/climbing-stairs/",
    "GFG Link": "https://www.geeksforgeeks.org/count-ways-reach-nth-stair/",
    "Companies": ["Amazon", "Google"],
    "Remarks": "Fibonacci sequence pattern"
  },
  {
    "Topic": "Dynamic Programming",
    "Problem": "House Robber",
    "Difficulty": "Medium",
    "Leetcode Link": "https://leetcode.com/problems/house-robber/",
    "GFG Link": "https://www.geeksforgeeks.org/find-maximum-sum-such-that-no-two-elements-are-adjacent/",
    "Companies": ["Amazon", "Microsoft"],
    "Remarks": "DP with space optimization"
  },
  {
    "Topic": "Graph",
    "Problem": "Number of Islands",
    "Difficulty": "Medium",
    "Leetcode Link": "https://leetcode.com/problems/number-of-islands/",
    "GFG Link": "https://www.geeksforgeeks.org/find-number-of-islands/",
    "Companies": ["Amazon", "Google", "Facebook"],
    "Remarks": "DFS or BFS traversal"
  }
];

export async function transformDSAQuestions(): Promise<Problem[]> {
  try {
    // Load user progress from AsyncStorage
    const progressData = await AsyncStorage.getItem('dsa_problem_statuses');
    const bookmarkData = await AsyncStorage.getItem('dsa_problem_bookmarks');
    
    const userProgress: Record<string, string> = progressData ? JSON.parse(progressData) : {};
    const userBookmarks: Record<string, boolean> = bookmarkData ? JSON.parse(bookmarkData) : {};

    return DSA_PROBLEMS_DATA.map((item, index) => {
      const problemId = `problem_${index + 1}`;
      
      return {
        id: problemId,
        title: item.Problem,
        topic: item.Topic,
        difficulty: item.Difficulty as 'Easy' | 'Medium' | 'Hard',
        leetcode_link: item["Leetcode Link"],
        gfg_link: item["GFG Link"],
        companies: item.Companies,
        remarks: item.Remarks,
        status: userProgress[problemId] as any || 'not_started',
        isBookmarked: userBookmarks[problemId] || false,
      };
    });
  } catch (error) {
    console.error('Error transforming DSA questions:', error);
    return [];
  }
}

export async function getTopics(): Promise<string[]> {
  try {
    const problems = await transformDSAQuestions();
    const topics = [...new Set(problems.map(p => p.topic))];
    return topics.sort();
  } catch (error) {
    console.error('Error getting topics:', error);
    return [];
  }
}

export async function getCompanies(): Promise<string[]> {
  try {
    const problems = await transformDSAQuestions();
    const companies = new Set<string>();
    
    problems.forEach(problem => {
      if (problem.companies) {
        problem.companies.forEach(company => companies.add(company));
      }
    });
    
    return Array.from(companies).sort();
  } catch (error) {
    console.error('Error getting companies:', error);
    return [];
  }
}

export async function getDifficultyStats(): Promise<Record<string, number>> {
  try {
    const problems = await transformDSAQuestions();
    const stats = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    };
    
    problems.forEach(problem => {
      stats[problem.difficulty]++;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting difficulty stats:', error);
    return { Easy: 0, Medium: 0, Hard: 0 };
  }
}
