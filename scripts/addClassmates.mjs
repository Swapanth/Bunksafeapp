import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { arrayUnion, collection, doc, getDocs, getFirestore, query, setDoc, updateDoc, where } from 'firebase/firestore';

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

// Classmates data
const classmates = [
  {
    email: 'swapanthvakapalli@gmail.com',
    password: 'Swapanth@999',
    nickname: 'Swapanth',
    mobileNumber: '9876543210'
  },
  {
    email: 'lingolubindhu1123@gmail.com',
    password: 'Bindu@1123',
    nickname: 'Bindu',
    mobileNumber: '9876543211'
  }
];

const classroomCode = '123456'; // The classroom code to join

async function findClassroomByCode(code) {
  const classroomsRef = collection(db, 'classrooms');
  const q = query(classroomsRef, where('code', '==', code));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error(`Classroom with code ${code} not found`);
  }
  
  return querySnapshot.docs[0];
}

async function addClassmate(classmateData, classroom) {
  console.log(`\n👤 Adding ${classmateData.nickname}...`);
  
  // Step 1: Create Firebase Auth user
  console.log('📧 Creating Firebase Auth user...');
  let userId;
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      classmateData.email,
      classmateData.password
    );
    userId = userCredential.user.uid;
    console.log(`✅ User created with ID: ${userId}`);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  User already exists, signing in...');
      const userCredential = await signInWithEmailAndPassword(
        auth,
        classmateData.email,
        classmateData.password
      );
      userId = userCredential.user.uid;
      console.log(`✅ Signed in with ID: ${userId}`);
    } else {
      throw error;
    }
  }

  const classroomData = classroom.data();
  const classroomId = classroom.id;

  // Step 2: Create user profile
  console.log('👤 Creating user profile...');
  await setDoc(doc(db, 'users', userId), {
    email: classmateData.email,
    nickname: classmateData.nickname,
    mobileNumber: classmateData.mobileNumber,
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
  console.log('✅ User profile created');

  // Step 3: Create user registry
  console.log('📝 Creating user registry...');
  await setDoc(doc(db, 'userRegistry', classmateData.email), {
    userId: userId,
    email: classmateData.email,
    mobileNumber: classmateData.mobileNumber,
    createdAt: new Date().toISOString()
  });
  console.log('✅ User registry created');

  // Step 4: Add user to classroom members
  console.log('🏫 Adding to classroom...');
  await updateDoc(doc(db, 'classrooms', classroomId), {
    members: arrayUnion(userId),
    updatedAt: new Date().toISOString()
  });
  console.log('✅ Added to classroom');

  // Step 5: Get schedule for the classroom
  console.log('📅 Fetching classroom schedule...');
  const scheduleQuery = query(
    collection(db, 'schedules'),
    where('classroomId', '==', classroomId)
  );
  const scheduleSnapshot = await getDocs(scheduleQuery);
  
  if (scheduleSnapshot.empty) {
    console.warn('⚠️  No schedule found for classroom');
    return userId;
  }

  const scheduleData = scheduleSnapshot.docs[0].data();
  console.log('✅ Schedule fetched');

  // Step 6: Create SubjectAttendanceStats for each subject
  console.log('📈 Creating subject attendance stats...');
  
  // Get unique classes from schedule
  const uniqueClasses = {};
  scheduleData.classes.forEach(cls => {
    if (!uniqueClasses[cls.id]) {
      uniqueClasses[cls.id] = cls;
    }
  });

  for (const [classId, classInfo] of Object.entries(uniqueClasses)) {
    const statsId = `${userId}_${classroomId}_${classId}`;
    
    await setDoc(doc(db, 'subjectStats', statsId), {
      id: statsId,
      userId: userId,
      classroomId: classroomId,
      classId: classId,
      subject: classInfo.name,
      instructor: classInfo.instructor || 'Unknown',
      totalClasses: 0,
      attendedClasses: 0,
      absentClasses: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log(`  ✅ ${classInfo.name}: 0/0 (starting fresh)`);
  }

  // Step 7: Create attendance streak
  console.log('🔥 Creating attendance streak...');
  await setDoc(doc(db, 'attendanceStreaks', userId), {
    userId: userId,
    currentStreak: 0,
    lastCheckedDate: new Date().toISOString().split('T')[0],
    totalDaysMarked: 0,
    longestStreak: 0,
    updatedAt: new Date().toISOString()
  });
  console.log('✅ Attendance streak created');

  // Step 8: Create user-classroom relationship
  console.log('🔗 Creating user-classroom relationship...');
  const userClassroomId = `${userId}_${classroomId}`;
  await setDoc(doc(db, 'userClassrooms', userClassroomId), {
    userId: userId,
    classroomId: classroomId,
    role: 'member',
    joinedAt: new Date().toISOString()
  });
  console.log('✅ User-classroom relationship created');

  console.log(`\n✅ ${classmateData.nickname} successfully added!`);
  return userId;
}

async function main() {
  try {
    console.log('🚀 Starting classmates addition...\n');

    // Find the classroom
    console.log(`🔍 Finding classroom with code: ${classroomCode}...`);
    const classroom = await findClassroomByCode(classroomCode);
    const classroomData = classroom.data();
    console.log(`✅ Found classroom: ${classroomData.name}\n`);

    const addedUsers = [];

    // Add each classmate
    for (const classmate of classmates) {
      try {
        const userId = await addClassmate(classmate, classroom);
        addedUsers.push({
          nickname: classmate.nickname,
          email: classmate.email,
          userId: userId
        });
      } catch (error) {
        console.error(`❌ Failed to add ${classmate.nickname}:`, error.message);
      }
    }

    console.log('\n\n🎉 Classmates addition completed!\n');
    console.log('📋 Summary:');
    console.log(`   Classroom: ${classroomData.name}`);
    console.log(`   Classroom Code: ${classroomData.code}`);
    console.log(`   Users Added: ${addedUsers.length}\n`);
    
    addedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.nickname}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      User ID: ${user.userId}\n`);
    });

    console.log('✨ Login credentials:');
    classmates.forEach((classmate, index) => {
      console.log(`   ${index + 1}. ${classmate.nickname}:`);
      console.log(`      Email: ${classmate.email}`);
      console.log(`      Password: ${classmate.password}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error adding classmates:', error);
    process.exit(1);
  }
}

// Run the script
main();
