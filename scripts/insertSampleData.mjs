import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getFirestore, setDoc, Timestamp } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Load sample data
const sampleData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'sample-data-template.json'), 'utf8')
);

async function insertSampleData() {
  try {
    console.log('🚀 Starting sample data insertion...\n');

    // Step 1: Create Firebase Auth user
    console.log('📧 Creating Firebase Auth user...');
    let userId;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        sampleData.user.email,
        sampleData.user.password
      );
      userId = userCredential.user.uid;
      console.log(`✅ User created with ID: ${userId}\n`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  User already exists, signing in...');
        const userCredential = await signInWithEmailAndPassword(
          auth,
          sampleData.user.email,
          sampleData.user.password
        );
        userId = userCredential.user.uid;
        console.log(`✅ Signed in with ID: ${userId}\n`);
      } else {
        throw error;
      }
    }

    // Step 2: Create user profile
    console.log('👤 Creating user profile...');
    await setDoc(doc(db, 'users', userId), {
      email: sampleData.user.email,
      nickname: sampleData.user.nickname,
      mobileNumber: sampleData.user.mobileNumber,
      university: sampleData.user.university,
      department: sampleData.user.department,
      yearOfStudy: sampleData.user.yearOfStudy,
      attendanceTarget: sampleData.user.attendanceTarget,
      collegeName: sampleData.user.collegeName,
      profileVisibility: sampleData.user.profileVisibility,
      preferences: sampleData.user.preferences,
      onboardingCompleted: sampleData.user.onboardingCompleted,
      semesterStartDate: sampleData.schedule.semesterStartDate,
      semesterEndDate: sampleData.schedule.semesterEndDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ User profile created\n');

    // Step 3: Create user registry
    console.log('📝 Creating user registry...');
    await setDoc(doc(db, 'userRegistry', sampleData.user.email), {
      userId: userId,
      email: sampleData.user.email,
      mobileNumber: sampleData.user.mobileNumber,
      createdAt: new Date().toISOString()
    });
    console.log('✅ User registry created\n');

    // Step 4: Create classroom
    console.log('🏫 Creating classroom...');
    const classroomId = `classroom_${Date.now()}`;
    await setDoc(doc(db, 'classrooms', classroomId), {
      id: classroomId,
      name: sampleData.classroom.name,
      description: sampleData.classroom.description,
      code: sampleData.classroom.code,
      university: sampleData.classroom.university,
      department: sampleData.classroom.department,
      attendanceTarget: sampleData.classroom.attendanceTarget,
      createdBy: userId,
      members: [userId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log(`✅ Classroom created with ID: ${classroomId}\n`);

    // Step 5: Create schedule
    console.log('📅 Creating schedule...');
    const scheduleId = `schedule_${Date.now()}`;
    
    // Build complete class schedule with all occurrences
    const classSchedule = [];
    
    // Iterate through each day and time slot
    for (const [dayName, slots] of Object.entries(sampleData.schedule.weeklySchedule)) {
      for (const slot of slots) {
        if (slot.subject && slot.subject !== 'Lunch Break') {
          // Find the class info from the classes array
          const classInfo = sampleData.schedule.classes.find(c => c.id === slot.subject);
          
          if (classInfo) {
            const times = slot.time.split(' - ');
            classSchedule.push({
              id: classInfo.id,
              name: classInfo.name,
              instructor: classInfo.instructor,
              location: classInfo.location,
              day: dayName,
              startTime: times[0],
              endTime: times[1]
            });
          }
        }
      }
    }

    await setDoc(doc(db, 'schedules', scheduleId), {
      id: scheduleId,
      classroomId: classroomId,
      classes: classSchedule,
      semesterStartDate: sampleData.schedule.semesterStartDate,
      semesterEndDate: sampleData.schedule.semesterEndDate,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log(`✅ Schedule created with ${classSchedule.length} class sessions\n`);

    // Step 6: Create SubjectAttendanceStats for each subject with pre-app data
    console.log('📈 Creating subject attendance stats with pre-app data...');
    for (const classInfo of sampleData.schedule.classes) {
      const statsId = `${userId}_${classroomId}_${classInfo.id}`;
      
      // Get pre-app attendance data if available
      const preAppData = sampleData.UserAttendance?.subjects?.[classInfo.id];
      const attendedClasses = preAppData?.attendedClassesForSemester || 0;
      const totalClasses = preAppData?.TotalClassesForSemester || 0;
      const absentClasses = totalClasses - attendedClasses;
      
      await setDoc(doc(db, 'subjectStats', statsId), {
        id: statsId,
        userId: userId,
        classroomId: classroomId,
        classId: classInfo.id,
        subject: classInfo.name,
        instructor: classInfo.instructor || 'Unknown',
        totalClasses: totalClasses,
        attendedClasses: attendedClasses,
        absentClasses: absentClasses,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      const percentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(1) : 0;
      console.log(`  ✅ ${classInfo.name}: ${attendedClasses}/${totalClasses} (${percentage}%)`);
    }
    console.log('\n');

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
    console.log('✅ Attendance streak created\n');

    // Step 8: Create user-classroom relationship
    console.log('🔗 Creating user-classroom relationship...');
    const userClassroomId = `${userId}_${classroomId}`;
    await setDoc(doc(db, 'userClassrooms', userClassroomId), {
      userId: userId,
      classroomId: classroomId,
      role: 'creator',
      joinedAt: new Date().toISOString()
    });
    console.log('✅ User-classroom relationship created\n');

    // Step 9: Create sample attendance records (if any provided)
    console.log('📝 Creating sample attendance records...');
    const attendanceRecords = sampleData.sampleAttendanceRecords?.records || [];
    
    if (attendanceRecords.length === 0) {
      console.log('  ℹ️  No app-tracked attendance records to create (using pre-app data only)\n');
    } else {
      for (const record of attendanceRecords) {
        const attendanceId = `${userId}_${record.classId}_${record.date}`;
        const attendanceData = {
          id: attendanceId,
          userId: userId,
          classroomId: classroomId,
          classId: record.classId,
          subject: record.subject,
          date: record.date,
          status: record.status,
          markedAt: new Date(record.date).toISOString(),
          updatedAt: new Date(record.date).toISOString()
        };
        
        // Only add reason if it exists
        if (record.reason) {
          attendanceData.reason = record.reason;
        }
        
        await setDoc(doc(db, 'attendance', attendanceId), attendanceData);
        console.log(`  ✅ ${record.date}: ${record.subject} - ${record.status}`);
      }
      console.log('\n');
    }

    // Step 10: Create tasks
    console.log('📝 Creating tasks...');
    for (const task of sampleData.tasks) {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, 'tasks', taskId), {
        id: taskId,
        userId: userId,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        completed: task.status === 'completed',
        subject: task.subject,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`  ✅ ${task.title}`);
    }
    console.log('\n');

    console.log('🎉 Sample data insertion completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${sampleData.user.email}`);
    console.log(`   Classroom ID: ${classroomId}`);
    console.log(`   Classroom Code: ${sampleData.classroom.code}`);
    console.log(`   Total Subjects: ${sampleData.schedule.classes.length}`);
    
    // Calculate overall attendance from pre-app data
    if (sampleData.UserAttendance?.subjects) {
      const subjects = Object.values(sampleData.UserAttendance.subjects);
      const totalAttended = subjects.reduce((sum, s) => sum + s.attendedClassesForSemester, 0);
      const totalClasses = subjects.reduce((sum, s) => sum + s.TotalClassesForSemester, 0);
      const overallPercentage = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(1) : 0;
      console.log(`   Pre-app Attendance: ${totalAttended}/${totalClasses} (${overallPercentage}%)`);
    }
    
    console.log(`   App-tracked Records: ${attendanceRecords.length}`);
    console.log(`   Tasks: ${sampleData.tasks.length}`);
    console.log('\n✨ You can now login with:');
    console.log(`   Email: ${sampleData.user.email}`);
    console.log(`   Password: ${sampleData.user.password}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error inserting sample data:', error);
    process.exit(1);
  }
}

// Run the script
insertSampleData();
