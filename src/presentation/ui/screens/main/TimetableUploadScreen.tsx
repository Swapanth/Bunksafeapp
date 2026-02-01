import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';

interface TimetableData {
  method: 'file' | 'manual' | 'skip';
  classes?: ClassData[];
  semesterStartDate?: string;
  semesterEndDate?: string;
}

interface ClassData {
  id: string;
  name: string;
  instructor: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface TimetableUploadScreenProps {
  onNext: (data: TimetableData) => void;
  onBack: () => void;
  showTimetable: boolean; // Only show if user created/joined classroom
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

export const TimetableUploadScreen: React.FC<TimetableUploadScreenProps> = ({
  onNext,
  onBack,
  showTimetable,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'file' | 'manual' | 'skip' | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [semesterStartDate, setSemesterStartDate] = useState('');
  const [semesterEndDate, setSemesterEndDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [newClass, setNewClass] = useState<Partial<ClassData>>({
    name: '',
    instructor: '',
    day: '',
    startTime: '',
    endTime: '',
    location: '',
  });
  const [showDayModal, setShowDayModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);

  // If timetable upload shouldn't be shown, skip directly
  React.useEffect(() => {
    if (!showTimetable) {
      onNext({ method: 'skip' });
    }
  }, [showTimetable, onNext]);

  if (!showTimetable) {
    return null;
  }

  const handleFileUpload = () => {
    Alert.alert(
      'Upload Timetable',
      'Choose file type',
      [
        { text: 'CSV File', onPress: () => console.log('CSV selected') },
        { text: 'Excel File', onPress: () => console.log('Excel selected') },
        { text: 'Image', onPress: () => console.log('Image selected') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDownloadTemplate = () => {
    Alert.alert(
      'Download Template',
      'Choose template format',
      [
        { text: 'CSV Template', onPress: () => console.log('CSV template') },
        { text: 'Excel Template', onPress: () => console.log('Excel template') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateClass = (): boolean => {
    return !!(
      newClass.name &&
      newClass.instructor &&
      newClass.day &&
      newClass.startTime &&
      newClass.endTime &&
      newClass.location
    );
  };

  const checkTimeConflict = (classData: Partial<ClassData>): boolean => {
    return classes.some(existingClass =>
      existingClass.day === classData.day &&
      ((classData.startTime! >= existingClass.startTime && classData.startTime! < existingClass.endTime) ||
        (classData.endTime! > existingClass.startTime && classData.endTime! <= existingClass.endTime) ||
        (classData.startTime! <= existingClass.startTime && classData.endTime! >= existingClass.endTime))
    );
  };

  const addClass = () => {
    if (validateClass()) {
      if (checkTimeConflict(newClass)) {
        Alert.alert('Time Conflict', 'This class overlaps with an existing class on the same day.');
        return;
      }

      const classToAdd: ClassData = {
        id: Date.now().toString(),
        name: newClass.name!,
        instructor: newClass.instructor!,
        day: newClass.day!,
        startTime: newClass.startTime!,
        endTime: newClass.endTime!,
        location: newClass.location!,
      };

      setClasses([...classes, classToAdd]);
      setNewClass({
        name: '',
        instructor: '',
        day: '',
        startTime: '',
        endTime: '',
        location: '',
      });
      setShowAddClassModal(false);
    }
  };

  const removeClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
  };

  const handleNext = () => {
    const data: TimetableData = {
      method: selectedMethod!,
      semesterStartDate,
      semesterEndDate,
    };

    if (selectedMethod === 'manual') {
      data.classes = classes;
    }

    onNext(data);
  };

  const MethodCard: React.FC<{
    title: string;
    description: string;
    icon: string;
    value: 'file' | 'manual' | 'skip';
    selected: boolean;
    onSelect: () => void;
  }> = ({ title, description, icon, value, selected, onSelect }) => (
    <TouchableOpacity
      onPress={onSelect}
      className={`p-6 rounded-2xl border-2 mb-4 ${selected
        ? 'border-green-500 bg-green-50'
        : 'border-gray-200 bg-white'
        }`}
    >
      <View className="flex-row items-center">
        <Text className="text-4xl mr-4">{icon}</Text>
        <View className="flex-1">
          <Text className={`text-lg font-semibold ${selected ? 'text-green-700' : 'text-gray-800'
            }`}>
            {title}
          </Text>
          <Text className={`text-sm ${selected ? 'text-green-600' : 'text-gray-600'
            }`}>
            {description}
          </Text>
        </View>
        <View className={`w-6 h-6 rounded-full border-2 ${selected
          ? 'border-green-500 bg-green-500'
          : 'border-gray-300'
          }`}>
          {selected && (
            <View className="flex-1 items-center justify-center">
              <Text className="text-white text-xs">✓</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const SelectionModal: React.FC<{
    visible: boolean;
    title: string;
    data: string[];
    onSelect: (item: string) => void;
    onClose: () => void;
  }> = ({ visible, title, data, onSelect, onClose }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-96">
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-gray-800">{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-2xl text-gray-500">×</Text>
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                className="p-4 border-b border-gray-100"
              >
                <Text className="text-gray-800 text-base">{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-16 pb-8 px-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={onBack} className="mr-4">
              <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                <Text className="text-lg">←</Text>
              </View>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-3xl font-bold text-gray-800">
                Timetable Upload
              </Text>
              <Text className="text-lg text-gray-600 mt-2">
                Add your class schedule
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Indicator */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center">
            <View className="flex-1 h-2 bg-green-500 rounded-full" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
          </View>
          <Text className="text-sm text-gray-500 mt-2 text-center">Step 6 of 6</Text>
        </View>

        {/* Content */}
        <View className="px-6">
          {/* Info Card */}
          <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
            <Text className="text-center text-6xl mb-4">📅</Text>
            <Text className="text-xl font-semibold text-center text-gray-800 mb-2">
              Setup Your Timetable
            </Text>
            <Text className="text-gray-600 text-center leading-6">
              Add your class schedule to enable automatic attendance tracking.
            </Text>
          </View>

          {/* Semester Dates */}
          <View className="bg-orange-50 rounded-2xl p-6 mb-6 border-2 border-orange-300">
            <View className="flex-row items-center mb-4">
              <Text className="text-2xl mr-3">⚠️</Text>
              <Text className="text-lg font-semibold text-orange-800">
                Semester Duration (Required)
              </Text>
            </View>
            
            <Text className="text-orange-700 text-sm mb-4">
              Please enter your semester dates to calculate attendance accurately
            </Text>

            <View className="flex-row space-x-2">
              <View className="flex-1 mr-2">
                <Text className="text-base font-medium text-gray-700 mb-2">Start Date *</Text>
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  className={`p-4 rounded-xl border-2 ${
                    !semesterStartDate ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'
                  }`}
                >
                  <Text className={`text-base ${semesterStartDate ? 'text-gray-800' : 'text-gray-500'}`}>
                    {semesterStartDate || 'DD/MM/YYYY'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-1 ml-2">
                <Text className="text-base font-medium text-gray-700 mb-2">End Date *</Text>
                <TouchableOpacity
                  onPress={() => setShowEndDatePicker(true)}
                  className={`p-4 rounded-xl border-2 ${
                    !semesterEndDate ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'
                  }`}
                >
                  <Text className={`text-base ${semesterEndDate ? 'text-gray-800' : 'text-gray-500'}`}>
                    {semesterEndDate || 'DD/MM/YYYY'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {(!semesterStartDate || !semesterEndDate) && (
              <View className="bg-orange-100 rounded-lg p-3 mt-3">
                <Text className="text-orange-800 text-xs">
                  💡 Tip: Example format - 01/04/2025 (for April 1, 2025)
                </Text>
              </View>
            )}
          </View>

          {/* Method Selection */}
          <MethodCard
            title="File Upload"
            description="Upload CSV, Excel, or image file"
            icon="📄"
            value="file"
            selected={selectedMethod === 'file'}
            onSelect={() => setSelectedMethod('file')}
          />

          {/* File Upload Section - Directly below the File Upload option */}
          {selectedMethod === 'file' && (
            <View className="bg-white rounded-2xl p-6 mb-4 border-2 border-green-200 shadow-sm">
              <View className="flex-row items-center mb-4">
                <Text className="text-2xl mr-3">📄</Text>
                <Text className="text-lg font-semibold text-green-700">
                  Upload Timetable File
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleFileUpload}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 items-center mb-4"
              >
                <Text className="text-4xl mb-2">📁</Text>
                <Text className="text-gray-800 font-medium mb-1">Tap to upload file</Text>
                <Text className="text-sm text-gray-600">Supports CSV, Excel, and images</Text>
              </TouchableOpacity>

              <View className="flex-row justify-center">
                <TouchableOpacity
                  onPress={handleDownloadTemplate}
                  className="bg-blue-50 px-4 py-2 rounded-lg"
                >
                  <Text className="text-blue-600 font-medium">📥 Download Template</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <MethodCard
            title="Manual Entry"
            description="Add classes one by one"
            icon="✏️"
            value="manual"
            selected={selectedMethod === 'manual'}
            onSelect={() => setSelectedMethod('manual')}
          />

          {/* Manual Entry Section - Directly below the Manual Entry option */}
          {selectedMethod === 'manual' && (
            <View className="bg-white rounded-2xl p-6 mb-4 border-2 border-green-200 shadow-sm">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">✏️</Text>
                  <Text className="text-lg font-semibold text-green-700">
                    Manual Entry
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAddClassModal(true)}
                  className="bg-green-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-medium">+ Add Class</Text>
                </TouchableOpacity>
              </View>

              {classes.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-4xl mb-2">📚</Text>
                  <Text className="text-gray-600 text-center">
                    No classes added yet.{'\n'}Tap &quot;Add Class&quot; to get started.
                  </Text>
                </View>
              ) : (
                <View>
                  {classes.map((classItem) => (
                    <View key={classItem.id} className="bg-gray-50 p-4 rounded-xl mb-3">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className="font-semibold text-gray-800">{classItem.name}</Text>
                          <Text className="text-sm text-gray-600">{classItem.instructor}</Text>
                          <Text className="text-sm text-gray-600">
                            {classItem.day} • {classItem.startTime} - {classItem.endTime}
                          </Text>
                          <Text className="text-sm text-gray-600">{classItem.location}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeClass(classItem.id)}
                          className="ml-2"
                        >
                          <Text className="text-red-500 text-lg">🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}


        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-100">
        {(!selectedMethod || !semesterStartDate || !semesterEndDate) && (
          <View className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
            <Text className="text-orange-800 text-sm text-center font-medium">
              ⚠️ Please complete:
              {!semesterStartDate && ' Start Date'}
              {!semesterEndDate && ' End Date'}
              {!selectedMethod && ' Select a method'}
            </Text>
          </View>
        )}
        <CustomButton
          title="Complete Setup"
          onPress={handleNext}
          disabled={!selectedMethod || !semesterStartDate || !semesterEndDate}
        />
      </View>

      {/* Add Class Modal */}
      <Modal visible={showAddClassModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-4/5">
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-gray-800">Add New Class</Text>
                <TouchableOpacity onPress={() => setShowAddClassModal(false)}>
                  <Text className="text-2xl text-gray-500">×</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="p-4">
              <CustomInput
                label="Class Name"
                value={newClass.name || ''}
                onChangeText={(text) => setNewClass({ ...newClass, name: text })}
                placeholder="e.g., Computer Science 101"
                leftIcon="book-outline"
              />

              <CustomInput
                label="Instructor"
                value={newClass.instructor || ''}
                onChangeText={(text) => setNewClass({ ...newClass, instructor: text })}
                placeholder="e.g., Dr. Smith"
                leftIcon="person-outline"
              />

              <View className="mb-4">
                <Text className="text-base font-medium text-gray-700 mb-2">Day</Text>
                <TouchableOpacity
                  onPress={() => setShowDayModal(true)}
                  className="p-4 rounded-xl border border-gray-300 bg-gray-50"
                >
                  <Text className={`text-base ${newClass.day ? 'text-gray-800' : 'text-gray-500'}`}>
                    {newClass.day || 'Select day'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row space-x-2">
                <View className="flex-1 m-1 ">
                  <Text className="text-base font-medium text-gray-700 mb-2">Start Time</Text>
                  <TouchableOpacity
                    onPress={() => setShowStartTimeModal(true)}
                    className="p-4 rounded-xl border border-gray-300 bg-gray-50"
                  >
                    <Text className={`text-base ${newClass.startTime ? 'text-gray-800' : 'text-gray-500'}`}>
                      {newClass.startTime || 'Start'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-1 m-1">
                  <Text className="text-base font-medium text-gray-700 mb-2">End Time</Text>
                  <TouchableOpacity
                    onPress={() => setShowEndTimeModal(true)}
                    className="p-4 rounded-xl border border-gray-300 bg-gray-50"
                  >
                    <Text className={`text-base ${newClass.endTime ? 'text-gray-800' : 'text-gray-500'}`}>
                      {newClass.endTime || 'End'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <CustomInput
                label="Location"
                value={newClass.location || ''}
                onChangeText={(text) => setNewClass({ ...newClass, location: text })}
                placeholder="e.g., Room 101, Building A"
                leftIcon="location-outline"
              />

              <View className="pt-4">
                <CustomButton
                  title="Add Class"
                  onPress={addClass}
                  disabled={!validateClass()}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Selection Modals */}
      <SelectionModal
        visible={showDayModal}
        title="Select Day"
        data={DAYS_OF_WEEK}
        onSelect={(day) => setNewClass({ ...newClass, day })}
        onClose={() => setShowDayModal(false)}
      />

      <SelectionModal
        visible={showStartTimeModal}
        title="Select Start Time"
        data={TIME_SLOTS}
        onSelect={(time) => setNewClass({ ...newClass, startTime: time })}
        onClose={() => setShowStartTimeModal(false)}
      />

      <SelectionModal
        visible={showEndTimeModal}
        title="Select End Time"
        data={TIME_SLOTS}
        onSelect={(time) => setNewClass({ ...newClass, endTime: time })}
        onClose={() => setShowEndTimeModal(false)}
      />

      {/* Date Picker Modals */}
      <Modal visible={showStartDatePicker} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 m-6 w-80">
            <Text className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Select Semester Start Date
            </Text>
            <CustomInput
              label="Start Date"
              value={semesterStartDate}
              onChangeText={setSemesterStartDate}
              placeholder="DD/MM/YYYY"
              leftIcon="calendar-outline"
            />
            <View className="flex-row space-x-2 mt-4">
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(false)}
                className="flex-1 p-3 rounded-xl border border-gray-300"
              >
                <Text className="text-center text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(false)}
                className="flex-1 p-3 rounded-xl bg-green-500"
              >
                <Text className="text-center text-white font-medium">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEndDatePicker} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 m-6 w-80">
            <Text className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Select Semester End Date
            </Text>
            <CustomInput
              label="End Date"
              value={semesterEndDate}
              onChangeText={setSemesterEndDate}
              placeholder="DD/MM/YYYY"
              leftIcon="calendar-outline"
            />
            <View className="flex-row space-x-2 mt-4">
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(false)}
                className="flex-1 p-3 rounded-xl border border-gray-300"
              >
                <Text className="text-center text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(false)}
                className="flex-1 p-3 rounded-xl bg-green-500"
              >
                <Text className="text-center text-white font-medium">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
