import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile } from '../lib/firebase';

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  admissionNumber: string;
  branch: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async signup(data: SignupData) {
    try {
      // First create the user account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      const user = userCredential.user;

      // Check if admission number already exists
      const admissionQuery = query(
        collection(db, 'userProfiles'),
        where('admissionNumber', '==', data.admissionNumber)
      );
      const admissionSnapshot = await getDocs(admissionQuery);
      
      if (!admissionSnapshot.empty) {
        throw new Error('Admission number already exists');
      }

      // Check if phone number already exists
      const phoneQuery = query(
        collection(db, 'userProfiles'),
        where('phone', '==', data.phone)
      );
      const phoneSnapshot = await getDocs(phoneQuery);
      
      if (!phoneSnapshot.empty) {
        throw new Error('Phone number already exists');
      }

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        id: user.uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        admissionNumber: data.admissionNumber,
        branch: data.branch,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'userProfiles', user.uid), userProfile);

      return { user, profile: userProfile };
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already exists');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }
      throw new Error(error.message || 'Signup failed');
    }
  },

  async login(data: LoginData) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      const user = userCredential.user;

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'userProfiles', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const profile = userDoc.data() as UserProfile;

      return { user, profile };
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Account does not exist');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later');
      }
      throw new Error(error.message || 'Login failed');
    }
  },

  async logout() {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  },

  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later');
      }
      throw new Error(error.message || 'Failed to send password reset email');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'userProfiles', userId));
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      
      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get user profile');
    }
  }
};