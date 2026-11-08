export const previewProblems = {
  reverse: {
    title: 'Reverse Linked List', filename: 'reverse_list',
    input: 'head = [1, 2, 3, 4, 5]', output: '[5, 4, 3, 2, 1]',
    code: {
      python: `def reverse_list(head):
    prev = None
    while head:
        next_node = head.next
        head.next = prev
        prev = head
        head = next_node
    return prev`,
      java: `class Solution {
  public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    while (head != null) {
      ListNode next = head.next;
      head.next = prev;
      prev = head;
      head = next;
    }
    return prev;
  }
}`,
      javascript: `function reverseList(head) {
  let prev = null;
  while (head !== null) {
    const next = head.next;
    head.next = prev;
    prev = head;
    head = next;
  }
  return prev;
}`,
      cpp: `ListNode* reverseList(ListNode* head) {
  ListNode* prev = nullptr;
  while (head != nullptr) {
    ListNode* next = head->next;
    head->next = prev;
    prev = head;
    head = next;
  }
  return prev;
}`,
    },
  },
  binary: {
    title: 'Binary Search', filename: 'binary_search',
    input: 'nums = [-1, 0, 3, 5, 9, 12]\ntarget = 9', output: '4',
    code: {
      python: `def search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
      java: `class Solution {
  public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
      int mid = left + (right - left) / 2;
      if (nums[mid] == target) return mid;
      if (nums[mid] < target) left = mid + 1;
      else right = mid - 1;
    }
    return -1;
  }
}`,
      javascript: `function search(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
      cpp: `#include <vector>

int search(const std::vector<int>& nums, int target) {
  int left = 0, right = int(nums.size()) - 1;
  while (left <= right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] == target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
    },
  },
  stairs: {
    title: 'Climbing Stairs', filename: 'climbing_stairs',
    input: 'n = 4', output: '5',
    code: {
      python: `def climb_stairs(n):
    prev, current = 1, 1
    for _ in range(n):
        prev, current = current, prev + current
    return prev`,
      java: `class Solution {
  public int climbStairs(int n) {
    int prev = 1, current = 1;
    for (int i = 0; i < n; i++) {
      int next = prev + current;
      prev = current;
      current = next;
    }
    return prev;
  }
}`,
      javascript: `function climbStairs(n) {
  let prev = 1, current = 1;
  for (let i = 0; i < n; i++) {
    [prev, current] = [current, prev + current];
  }
  return prev;
}`,
      cpp: `int climbStairs(int n) {
  int prev = 1, current = 1;
  for (int i = 0; i < n; ++i) {
    int next = prev + current;
    prev = current;
    current = next;
  }
  return prev;
}`,
    },
  },
} as const;
