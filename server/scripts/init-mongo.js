// MongoDB initialization script
db = db.getSiblingDB('coding-game');

// Create sample problems
db.problems.insertMany([
  {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    difficulty: "easy",
    category: "arrays",
    constraints: {
      timeLimit: 2000,
      memoryLimit: 128,
      inputSize: "1 <= nums.length <= 10^4"
    },
    examples: [
      {
        input: "[2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      }
    ],
    testCases: [
      {
        input: "[2,7,11,15]\n9",
        expectedOutput: "[0,1]",
        isHidden: false,
        weight: 1
      },
      {
        input: "[3,2,4]\n6",
        expectedOutput: "[1,2]", 
        isHidden: true,
        weight: 1
      }
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {
    // Your code here
    return [];
}

// Test
const nums = [2,7,11,15];
const target = 9;
console.log(twoSum(nums, target));`,
      python: `def twoSum(nums, target):
    # Your code here
    return []

# Test
nums = [2,7,11,15]
target = 9
print(twoSum(nums, target))`
    },
    solution: {
      javascript: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
      python: `def twoSum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []`
    },
    tags: ["hash-table", "array"],
    isActive: true
  },
  {
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters s.",
    difficulty: "easy", 
    category: "strings",
    constraints: {
      timeLimit: 1000,
      memoryLimit: 64,
      inputSize: "1 <= s.length <= 10^5"
    },
    examples: [
      {
        input: '["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: "Reverse the array of characters in-place."
      }
    ],
    testCases: [
      {
        input: '["h","e","l","l","o"]',
        expectedOutput: '["o","l","l","e","h"]',
        isHidden: false,
        weight: 1
      },
      {
        input: '["H","a","n","n","a","h"]',
        expectedOutput: '["h","a","n","n","a","H"]',
        isHidden: true,
        weight: 1
      }
    ],
    starterCode: {
      javascript: `function reverseString(s) {
    // Your code here
}`,
      python: `def reverseString(s):
    # Your code here
    pass`
    },
    solution: {
      javascript: `function reverseString(s) {
    let left = 0;
    let right = s.length - 1;
    while (left < right) {
        [s[left], s[right]] = [s[right], s[left]];
        left++;
        right--;
    }
}`,
      python: `def reverseString(s):
    left, right = 0, len(s) - 1
    while left < right:
        s[left], s[right] = s[right], s[left]
        left += 1
        right -= 1`
    },
    tags: ["two-pointers", "string"],
    isActive: true
  }
]);

console.log('✅ Sample problems inserted successfully');