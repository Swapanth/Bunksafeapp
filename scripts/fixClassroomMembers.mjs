import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';

// Load environment variables
dotenv.config();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const classroomCode = '123456';

async function findClassroomByCode(code) {
  const classroomsRef = collection(db, 'classrooms');
  const q = query(classroomsRef, where('code', '==', code));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error(`Classroom with code ${code} not found`);
  }
  
  return querySnapshot.docs[0];
}

async function checkAndFixUserProfile(userId, classroom) {
  console.log(`\n🔍 Checking user: ${userId}`);
  
  // Check if user has a profile
  const userDoc = await getDoc(doc(db, 'users', userId));
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    console.log(`✅ Profile exists: ${userData.nickname || userData.email}`);
    return { exists: true, data: userData };
  } else {
    console.log(`❌ No profile found for user: ${userId}`);
    
    // Try to find in userRegistry
    const registrySnapshot = await getDocs(collection(db, 'userRegistry'));
    let foundInRegistry = null;
    
    registrySnapshot.forEach(doc => {
      if (doc.data().userId === userId) {
        foundInRegistry = doc.data();
      }
    });
    
    if (foundInRegistry) {
      console.log(`📋 Found in registry: ${foundInRegistry.email}`);
      
      // Create the missing profile
      const classroomData = classroom.data();
      await setDoc(doc(db, 'users', userId), {
        email: foundInRegistry.email,
        nickname: foundInRegistry.email.split('@')[0],
        mobileNumber: foundInRegistry.mobileNumber || 'Not provided',
        university: classroomData.university,
        department: classroomData.department,
        yearOfStudy: '2nd Year',
        attendanceTarget: 75,
        collegeName: classroomData.university,
        profileVisibility: 'public',
        preferences: {
          whatsappNotifications: true,
          emailNotifications: true,
          attendanceReminders: true
        },
        onboardingCompleted: true,
        semesterStartDate: '18/12/2025',
        semesterEndDate: '01/04/2026',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ Created profile for: ${foundInRegistry.email}`);
      return { exists: false, created: true, email: foundInRegistry.email };
    } else {
      console.log(`⚠️ User not found in registry either`);
      return { exists: false, created: false };
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting classroom members check and fix...\n');

    // Find the classroom
    console.log(`🔍 Finding classroom with code: ${classroomCode}...`);
    const classroom = await findClassroomByCode(classroomCode);
    const classroomData = classroom.data();
    console.log(`✅ Found classroom: ${classroomData.name}`);
    console.log(`👥 Total members: ${classroomData.members.length}\n`);

    const results = {
      total: classroomData.members.length,
      existing: 0,
      created: 0,
      missing: 0
    };

    // Check each member
    for (const memberId of classroomData.members) {
      const result = await checkAndFixUserProfile(memberId, classroom);
      
      if (result.exists) {
        results.existing++;
      } else if (result.created) {
        results.created++;
      } else {
        results.missing++;
      }
    }

    console.log('\n\n✅ Check and fix completed!\n');
    console.log('📋 Summary:');
    console.log(`   Total members: ${results.total}`);
    console.log(`   Existing profiles: ${results.existing}`);
    console.log(`   Created profiles: ${results.created}`);
    console.log(`   Still missing: ${results.missing}\n`);

    if (results.missing > 0) {
      console.log('⚠️  Some users are still missing profiles. They might need to be recreated manually.');
    } else {
      console.log('🎉 All members now have proper profiles!');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error checking/fixing classroom members:', error);
    process.exit(1);
  }
}

// Run the script
main();
