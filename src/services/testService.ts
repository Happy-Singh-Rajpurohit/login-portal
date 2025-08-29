import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
export interface TestSettings {
  testStartTime: Date;
  testDuration: number; // in minutes
  maxTabSwitches: number;
  isTestActive: boolean;
}
export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}
export interface TestAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
}
export interface TestResult {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  admissionNumber: string;
  branch: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number; // in seconds
  answers: TestAnswer[];
  completedAt: Date;
  status: 'completed' | 'in-progress' | 'abandoned';
}
export interface UserTestStatus {
  userId: string;
  hasSubmitted: boolean;
  submissionDate?: Date;
  tabSwitchCount: number;
  isTestCancelled: boolean;
  lastActivity: Date;
}
export const testService = {
  // Generate random questions based on user's branch
  getRandomQuestions: (branch: string, count: number = 20): TestQuestion[] => {
    const allQuestions = testService.getAllQuestions();
    
    // Filter questions based on branch
    let filteredQuestions: TestQuestion[] = [];
    
    if (branch.toLowerCase().includes('computer') || branch.toLowerCase().includes('information')) {
      // CS/IT students get more technical questions
      const technicalQuestions = allQuestions.filter(q => q.category === 'Technical');
      const generalQuestions = allQuestions.filter(q => q.category === 'General');
      filteredQuestions = [
        ...technicalQuestions.slice(0, Math.min(15, technicalQuestions.length)),
        ...generalQuestions.slice(0, Math.min(5, generalQuestions.length))
      ];
    } else if (branch.toLowerCase().includes('electronics') || branch.toLowerCase().includes('electrical')) {
      // ECE/EEE students get mixed questions with some electronics focus
      const technicalQuestions = allQuestions.filter(q => q.category === 'Technical');
      const generalQuestions = allQuestions.filter(q => q.category === 'General');
      const electronicsQuestions = allQuestions.filter(q => q.category === 'Electronics');
      filteredQuestions = [
        ...technicalQuestions.slice(0, Math.min(8, technicalQuestions.length)),
        ...electronicsQuestions.slice(0, Math.min(7, electronicsQuestions.length)),
        ...generalQuestions.slice(0, Math.min(5, generalQuestions.length))
      ];
    } else {
      // Other branches get balanced mix
      const technicalQuestions = allQuestions.filter(q => q.category === 'Technical');
      const generalQuestions = allQuestions.filter(q => q.category === 'General');
      filteredQuestions = [
        ...technicalQuestions.slice(0, Math.min(10, technicalQuestions.length)),
        ...generalQuestions.slice(0, Math.min(10, generalQuestions.length))
      ];
    }
    
    // Shuffle the questions randomly
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    
    // Return the requested count or all available questions
    return shuffled.slice(0, Math.min(count, shuffled.length));
  },

  getTestSettings: (): TestSettings => ({
    testStartTime: new Date('2025-08-30T21:30:00'), // Fixed start time for all users
    testDuration: 10, // 10 minutes
    maxTabSwitches: 5,
    isTestActive: true
  }),
  isTestAvailable: (): boolean => {
    const settings = testService.getTestSettings();
    return new Date() >= settings.testStartTime;
  },
  getTestEndTime: (): Date => {
    const settings = testService.getTestSettings();
    return new Date(settings.testStartTime.getTime() + settings.testDuration * 60 * 1000);
  },
  async getUserTestStatus(userId: string): Promise<UserTestStatus | null> {
    try {
      // First try to create the document if it doesn't exist
      const statusRef = doc(db, 'userTestStatus', userId);
      
      try {
        const statusDoc = await getDoc(statusRef);
        
        if (statusDoc.exists()) {
          const data = statusDoc.data();
          return {
            userId,
            hasSubmitted: data.hasSubmitted || false,
            submissionDate: data.submissionDate?.toDate(),
            tabSwitchCount: data.tabSwitchCount || 0,
            isTestCancelled: data.isTestCancelled || false,
            lastActivity: data.lastActivity?.toDate() || new Date()
          };
        } else {
          // Document doesn't exist, create it with default values
          const defaultStatus = {
            userId,
            hasSubmitted: false,
            tabSwitchCount: 0,
            isTestCancelled: false,
            lastActivity: new Date()
          };
          
          await setDoc(statusRef, defaultStatus);
          return defaultStatus;
        }
      } catch (docError: any) {
        // If we can't read the document, try to create it
        if (docError.code === 'permission-denied' || docError.code === 'not-found') {
          const defaultStatus = {
            userId,
            hasSubmitted: false,
            tabSwitchCount: 0,
            isTestCancelled: false,
            lastActivity: new Date()
          };
          
          await setDoc(doc(db, 'userTestStatus', userId), defaultStatus);
          return defaultStatus;
        }
        throw docError;
      }
      
    } catch (error: any) {
      console.error('Error in getUserTestStatus:', error);
      throw new Error(`Failed to get user test status: ${error.message}`);
    }
  },
  async updateUserTestStatus(userId: string, status: Partial<UserTestStatus>): Promise<void> {
    try {
      const statusRef = doc(db, 'userTestStatus', userId);
      await updateDoc(statusRef, {
        ...status,
        lastActivity: new Date()
      });
    } catch (error: any) {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        await setDoc(doc(db, 'userTestStatus', userId), {
          userId,
          hasSubmitted: false,
          tabSwitchCount: 0,
          isTestCancelled: false,
          lastActivity: new Date(),
          ...status
        });
      } else {
        throw new Error(error.message || 'Failed to update user test status');
      }
    }
  },
  async markTestAsSubmitted(userId: string): Promise<void> {
    try {
      const statusRef = doc(db, 'userTestStatus', userId);
      const statusDoc = await getDoc(statusRef);
      
      if (statusDoc.exists()) {
        await updateDoc(statusRef, {
          hasSubmitted: true,
          submissionDate: new Date(),
          lastActivity: new Date()
        });
      } else {
        await setDoc(doc(db, 'userTestStatus', userId), {
          userId,
          hasSubmitted: true,
          submissionDate: new Date(),
          tabSwitchCount: 0,
          isTestCancelled: false,
          lastActivity: new Date()
        });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark test as submitted');
    }
  },
  async incrementTabSwitchCount(userId: string): Promise<number> {
    try {
      const statusRef = doc(db, 'userTestStatus', userId);
      const statusDoc = await getDoc(statusRef);
      
      let newCount = 1;
      
      if (statusDoc.exists()) {
        const currentCount = statusDoc.data().tabSwitchCount || 0;
        newCount = currentCount + 1;
        
        await updateDoc(statusRef, {
          tabSwitchCount: newCount,
          lastActivity: new Date()
        });
      } else {
        await setDoc(doc(db, 'userTestStatus', userId), {
          userId,
          hasSubmitted: false,
          tabSwitchCount: newCount,
          isTestCancelled: false,
          lastActivity: new Date()
        });
      }
      
      return newCount;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to increment tab switch count');
    }
  },
  async cancelTest(userId: string): Promise<void> {
    try {
      const statusRef = doc(db, 'userTestStatus', userId);
      const statusDoc = await getDoc(statusRef);
      
      if (statusDoc.exists()) {
        await updateDoc(statusRef, {
          isTestCancelled: true,
          lastActivity: new Date()
        });
      } else {
        await setDoc(doc(db, 'userTestStatus', userId), {
          userId,
          hasSubmitted: false,
          tabSwitchCount: 0,
          isTestCancelled: true,
          lastActivity: new Date()
        });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel test');
    }
  },
  // All available test questions
  getAllQuestions: (): TestQuestion[] => [
    {
      id: '1',
      question: 'In rectangle ABCD, the diagonals AC and BD intersect at point E. If the area of the rectangle is 120 square units, what is the area of triangle EBC (the triangle with vertices E,B,C)?',
      options: [
        '30',
        '40',
        '60',
        '20'
      ],
      correctAnswer: 0,
      category: 'General'
    },
    {
      id: '2',
      question: 'What will the following code print in most C-like languages?',
      options: [
        '2',
        '2.5',
        '3',
        'Error'
      ],
      correctAnswer: 0,
      category: 'Technical'
    },
    {
      id: '3',
      question: 'In an ordered array, a search algorithm repeatedly divides the search interval in half until the target element is found or the interval becomes empty. What is the time complexity of this algorithm?',
      options: [
        'O(1)',
        'O(n)',
        'O(log n)',
        'O(n log n)'
      ],
      correctAnswer: 2,
      category: 'Technical'
    },
    {
      id: '4',
      question: 'What is the output of: print(2 ** 3 ** 2)',
      options: [
        '64',
        '512',
        '256',
        '8'
      ],
      correctAnswer: 1,
      category: 'Technical'
    },
    {
      id: '5',
      question: 'Which of the following represents a semantic HTML element?',
      options: [
        '<div>',
        '<section>',
        '<span>',
        '<b>'
      ],
      correctAnswer: 1,
      category: 'Technical'
    },
    {
      id: '6',
      question: 'Which CSS property is used to create rounded corners?',
      options: [
        'border-width',
        'border style',
        'border-radius',
        'border-round'
      ],
      correctAnswer: 2,
      category: 'Technical'
    },
    {
      id: '7',
      question: 'In the context of web communication, when a client requests a resource that does not exist on the server, the server responds with which HTTP status code?',
      options: [
        '200',
        '301',
        '404',
        '500'
      ],
      correctAnswer: 2,
      category: 'Technical'
    },
    {
      id: '8',
      question: 'In JavaScript, == and === differ because:',
      options: [
        '== checks value only, === checks value + type',
        '== checks type only, === checks value only',
        'Both are identical',
        '=== is only used in TypeScript'
      ],
      correctAnswer: 0,
      category: 'Technical'
    },
    {
      id: '9',
      question: 'Which of the following is a non-volatile memory?',
      options: [
        'RAM',
        'ROM',
        'Cache',
        'Register'
      ],
      correctAnswer: 1,
      category: 'Technical'
    },
    {
      id: '10',
      question: 'FORLOOP',
      options: [
        '012',
        '0123',
        '123',
        '0'
      ],
      correctAnswer: 0,
      category: 'Technical'
    },
    {
      id: '12',
      question: 'In binary, what is the result of 1011 + 110?',
      options: [
        '10001',
        '11001',
        '10000',
        '11101'
      ],
      correctAnswer: 0,
      category: 'Technical'
    },
    {
      id: '13',
      question: 'If in a certain code “CAT” is written as “DBU”, then “DOG” will be coded as:',
      options: [
        'EPH',
        'DPH',
        'EOH',
        'ENH'
      ],
      correctAnswer: 0,
      category: 'General'
    },
    {
      id: '14',
      question: 'Which is greater: log₂(16) or log₃(27)?',
      options: [
        'log₂(16)',
        'log₃(27)',
        'Both equal',
        'Cannot be compared'
      ],
      correctAnswer: 2,
      category: 'General'
    },
    {
      id: '15',
      question: 'A person faces North, turns 90° clockwise, then 180° clockwise, and again 90° clockwise. Which direction is he facing now?',
      options: [
        'North',
        'East',
        'South',
        'West'
      ],
      correctAnswer: 0,
      category: 'General'
    },
    {
      id: '16',
      question: 'If 15 men can build a wall in 12 days, how many days will 10 men take?',
      options: [
        '12',
        '15',
        '18',
        '20'
      ],
      correctAnswer: 2,
      category: 'General'
    },
    {
      id: '17',
      question: 'The mean of five numbers is 20. If one number is excluded, the mean becomes 18. Find the excluded number.',
      options: [
        '30',
        '32',
        '28',
        '26'
      ],
      correctAnswer: 0,
      category: 'General'
    },
    {
      id: '18',
      question: 'If in a certain code, TABLE is written as YFQJK, how is CHAIR written in that code?',
      options: [
        'HMQWX',
        'HMPWX',
        'HMPWY',
        'GMPWY'
      ],
      correctAnswer: 1,
      category: 'General'
    },
    {
      id: '19',
      question: 'What is the sum of the squares of the roots of the equation x2−6x+8=0',
      options: [
        '20',
        '34',
        '28',
        '16'
      ],
      correctAnswer: 2,
      category: 'General'
    },
    {
      id: '20',
      question: 'Five people (A, B, C, D, E) are sitting in a row. A is to the left of B and right of C. D is to the right of E and left of A. Who is sitting in the middle?',
      options: [
        'A',
        'B',
        'C',
        'D'
      ],
      correctAnswer: 3,
      category: 'General'
    },
    {
      id: '21',
      question: 'What is the primary function of a capacitor in an electronic circuit?',
      options: [
        'To amplify signals',
        'To store electrical energy',
        'To convert AC to DC',
        'To regulate voltage'
      ],
      correctAnswer: 1,
      category: 'Electronics'
    },
    {
      id: '22',
      question: 'In digital electronics, what does NOT gate do?',
      options: [
        'Inverts the input signal',
        'Amplifies the input signal',
        'Stores the input signal',
        'Delays the input signal'
      ],
      correctAnswer: 0,
      category: 'Electronics'
    },
    {
      id: '23',
      question: 'What is the unit of electrical resistance?',
      options: [
        'Volt',
        'Ampere',
        'Ohm',
        'Watt'
      ],
      correctAnswer: 2,
      category: 'Electronics'
    },
    {
      id: '24',
      question: 'Which programming paradigm does Python primarily support?',
      options: [
        'Only procedural',
        'Only object-oriented',
        'Multi-paradigm',
        'Only functional'
      ],
      correctAnswer: 2,
      category: 'Technical'
    },
    {
      id: '25',
      question: 'What does API stand for?',
      options: [
        'Application Programming Interface',
        'Advanced Programming Integration',
        'Automated Program Instruction',
        'Application Process Integration'
      ],
      correctAnswer: 0,
      category: 'Technical'
    },
    {
      id: '26',
      question: 'In a database, what is a primary key?',
      options: [
        'The first column in a table',
        'A unique identifier for each record',
        'The most important data field',
        'A password for database access'
      ],
      correctAnswer: 1,
      category: 'Technical'
    },
    {
      id: '27',
      question: 'What is the result of 3! + 4! (factorial)?',
      options: [
        '30',
        '24',
        '18',
        '12'
      ],
      correctAnswer: 0,
      category: 'General'
    },
    {
      id: '28',
      question: 'If A = 1, B = 2, C = 3... what is the sum of letters in "CODE"?',
      options: [
        '31',
        '32',
        '33',
        '34'
      ],
      correctAnswer: 2,
      category: 'General'
    },
    {
      id: '29',
      question: 'What is the next number in the sequence: 2, 6, 12, 20, 30, ?',
      options: [
        '40',
        '42',
        '44',
        '46'
      ],
      correctAnswer: 1,
      category: 'General'
    },
    {
      id: '30',
      question: 'In electronics, what does LED stand for?',
      options: [
        'Light Emitting Diode',
        'Low Energy Device',
        'Linear Electronic Display',
        'Laser Emission Detector'
      ],
      correctAnswer: 0,
      category: 'Electronics'
    }
  ],

  // Backward compatibility - returns random questions for user's branch
  getTestQuestions: (): TestQuestion[] => {
    // Default fallback - return all questions shuffled
    const allQuestions = testService.getAllQuestions();
    return [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 20);
  },

  async submitTestResult(testResult: Omit<TestResult, 'id'>): Promise<string> {
    try {
      // Mark test as submitted
      await this.markTestAsSubmitted(testResult.userId);
      
      const docRef = await addDoc(collection(db, 'testResults'), {
        ...testResult,
        completedAt: new Date()
      });
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit test result');
    }
  },
  async getUserTestResults(userId: string): Promise<TestResult[]> {
    try {
      const q = query(
        collection(db, 'testResults'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const results: TestResult[] = [];
      
      querySnapshot.forEach((doc) => {
        results.push({
          id: doc.id,
          ...doc.data()
        } as TestResult);
      });
      
      // Sort results by completedAt in descending order on client side
      return results.sort((a, b) => {
        const dateA = a.completedAt instanceof Date ? a.completedAt : a.completedAt.toDate();
        const dateB = b.completedAt instanceof Date ? b.completedAt : b.completedAt.toDate();
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get test results');
    }
  },
  async getAllTestResults(): Promise<TestResult[]> {
    try {
      const q = query(
        collection(db, 'testResults'),
        orderBy('completedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const results: TestResult[] = [];
      
      querySnapshot.forEach((doc) => {
        results.push({
          id: doc.id,
          ...doc.data()
        } as TestResult);
      });
      
      return results;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get all test results');
    }
  },
  calculateScore(answers: TestAnswer[]): { score: number; percentage: number } {
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const totalQuestions = answers.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    return {
      score: correctAnswers,
      percentage
    };
  },
  getGradeFromPercentage(percentage: number): { grade: string; color: string; message: string } {
    if (percentage >= 90) {
      return {
        grade: 'A+',
        color: 'text-green-400',
        message: 'Outstanding Performance!'
      };
    } else if (percentage >= 80) {
      return {
        grade: 'A',
        color: 'text-green-400',
        message: 'Excellent Work!'
      };
    } else if (percentage >= 70) {
      return {
        grade: 'B+',
        color: 'text-blue-400',
        message: 'Good Performance!'
      };
    } else if (percentage >= 60) {
      return {
        grade: 'B',
        color: 'text-blue-400',
        message: 'Satisfactory!'
      };
    } else if (percentage >= 50) {
      return {
        grade: 'C',
        color: 'text-yellow-400',
        message: 'Needs Improvement!'
      };
    } else {
      return {
        grade: 'F',
        color: 'text-red-400',
        message: 'Better Luck Next Time!'
      };
    }
  }
};
