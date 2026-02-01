import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } from 'firebase/firestore';

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
const sreeshaEmail = 'sreesha3345@gmail.com';

async function findClassroomByCode(code) {
  const classroomsRef = collection(db, 'classrooms');
  const q = query(classroomsRef, where('code', '==', code));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error(`Classroom with code ${code} not found`);
  }
  
  return querySnapshot.docs[0];
}

async function findUserByEmail(email) {
  // Check userRegistry first
  const registryQuery = query(collection(db, 'userRegistry'), where('email', '==', email));
  const registrySnapshot = await getDocs(registryQuery);
  
  if (!registrySnapshot.empty) {
    return registrySnapshot.docs[0].data().userId;
  }
  
  return null;
}

async function main() {
  try {
    console.log('🚀 Starting orphaned members cleanup...\n');

    // Find the classroom
    console.log(`🔍 Finding classroom with code: ${classroomCode}...`);
    const classroom = await findClassroomByCode(classroomCode);
    const classroomData = classroom.data();
    const classroomId = classroom.id;
    console.log(`✅ Found classroom: ${classroomData.name}`);
    console.log(`👥 Current members: ${classroomData.members.length}\n`);

    // Find correct Sreesha user ID
    console.log(`🔍 Finding correct user ID for ${sreeshaEmail}...`);
    const sreeshaUserId = await findUserByEmail(sreeshaEmail);
    
    if (!sreeshaUserId) {
      throw new Error(`User ${sreeshaEmail} not found`);
    }
    
    console.log(`✅ Found Sreesha user ID: ${sreeshaUserId}\n`);

    // Check each member and identify orphaned ones
    const orphanedMembers = [];
    const validMembers = [];
    
    console.log('🔍 Checking all members...');
    for (const memberId of classroomData.members) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      
      if (!userDoc.exists()) {
        console.log(`❌ Orphaned member found: ${memberId}`);
        orphanedMembers.push(memberId);
      } else {
        const userData = userDoc.data();
        console.log(`✅ Valid member: ${userData.nickname} (${memberId})`);
        validMembers.push({ id: memberId, data: userData });
      }
    }

    console.log(`\n📊 Analysis:`);
    console.log(`   Valid members: ${validMembers.length}`);
    console.log(`   Orphaned members: ${orphanedMembers.length}\n`);

    // Remove orphaned members and add Sreesha if not present
    if (orphanedMembers.length > 0) {
      console.log('🧹 Removing orphaned members...');
      for (const orphanedId of orphanedMembers) {
        await updateDoc(doc(db, 'classrooms', classroomId), {
          members: arrayRemove(orphanedId)
        });
        console.log(`   ✅ Removed: ${orphanedId}`);
      }
    }

    // Check if Sreesha is already in the classroom
    const isSeeshaInClassroom = validMembers.some(m => m.id === sreeshaUserId);
    
    if (!isSeeshaInClassroom) {
      console.log('\n➕ Adding correct Sreesha user to classroom...');
      await updateDoc(doc(db, 'classrooms', classroomId), {
        members: arrayUnion(sreeshaUserId)
      });
      console.log(`   ✅ Added Sreesha: ${sreeshaUserId}`);
      
      // Create user-classroom relationship
      const userClassroomId = `${sreeshaUserId}_${classroomId}`;
      const userClassroomDoc = await getDoc(doc(db, 'userClassrooms', userClassroomId));
      
      if (!userClassroomDoc.exists()) {
        console.log('🔗 Creating user-classroom relationship...');
        await setDoc(doc(db, 'userClassrooms', userClassroomId), {
          userId: sreeshaUserId,
          classroomId: classroomId,
          role: 'creator',
          joinedAt: new Date().toISOString()
        });
        console.log('   ✅ User-classroom relationship created');
      }
    } else {
      console.log('\n✅ Sreesha is already in the classroom');
    }

    // Get updated classroom
    const updatedClassroom = await getDoc(doc(db, 'classrooms', classroomId));
    const updatedData = updatedClassroom.data();
    
    console.log('\n\n🎉 Cleanup completed!\n');
    console.log('📋 Final Summary:');
    console.log(`   Classroom: ${updatedData.name}`);
    console.log(`   Total members: ${updatedData.members.length}`);
    console.log(`   Orphaned removed: ${orphanedMembers.length}`);
    console.log(`   Members added: ${isSeeshaInClassroom ? 0 : 1}\n`);
    
    console.log('👥 Current members:');
    for (const memberId of updatedData.members) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log(`   - ${userData.nickname} (${userData.email})`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing orphaned members:', error);
    process.exit(1);
  }
}

// Run the script
main();
