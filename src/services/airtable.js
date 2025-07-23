// HARDCODED AIRTABLE CONFIGURATION - Josh Fitness Tracker
const AIRTABLE_CONFIG = {
  apiKey: 'patrpiWj1AJWuNOKV.78702ac678530aaecc07e9c94844da969f38eeff28fb08b80f2777b30a30cd50',
  baseId: 'appNwNPzRiJ1ZJSSm',
  baseUrl: 'https://api.airtable.com/v0/appNwNPzRiJ1ZJSSm',
  tables: {
    workouts: 'tblzNfp9RFyX3j6zl',
    exerciseLogs: 'tbla4SIJGFHz4FBhQ',
    cardioLogs: 'tbltzECDgISwbcGnG',
    exerciseTemplates: 'tbllYK1bCgfz9W7Ta'
  }
};

const headers = {
  'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
  'Content-Type': 'application/json'
};

// Enhanced error handling helper
const handleAirtableError = async (response, operation = 'API call') => {
  if (!response.ok) {
    let errorMessage = `${operation} failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      console.error(`❌ Airtable ${operation} error:`, {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData
      });
      errorMessage = errorData.error?.message || errorMessage;
    } catch (e) {
      console.error(`❌ Failed to parse error response for ${operation}:`, e);
    }
    throw new Error(errorMessage);
  }
};

// ========== WORKOUT OPERATIONS ==========
export const createWorkout = async (workoutData) => {
  try {
    console.log('🚀 Creating workout with data:', workoutData);
    
    const payload = {
      fields: {
        Date: new Date().toISOString().split('T')[0],
        Daytype: workoutData.Daytype, // Exact field name from CSV
        Completed: false,
        CardioCompleted: false,
        Duration: null,
        Workoutnotes: workoutData["Workout Notes"] || workoutData.Notes || "", // FIXED: "Workoutnotes" (no space, lowercase 'n')
        WeekNumber: getCurrentWeekNumber()
      }
    };
    
    console.log('📤 Sending workout payload:', payload);
    
    const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.workouts}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    await handleAirtableError(response, 'createWorkout');
    
    const data = await response.json();
    console.log('✅ Workout created successfully:', data);
    
    if (!data.id) {
      throw new Error('Workout created but no ID returned');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error creating workout:', error);
    throw error;
  }
};

export const updateWorkout = async (workoutId, updateData) => {
  try {
    console.log(`🔄 Updating workout ${workoutId} with:`, updateData);
    
    const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.workouts}/${workoutId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields: updateData })
    });
    
    await handleAirtableError(response, 'updateWorkout');
    
    const data = await response.json();
    console.log('✅ Workout updated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error updating workout:', error);
    throw error;
  }
};

export const getWorkouts = async () => {
  try {
    console.log('📋 Fetching workouts...');
    
    const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.workouts}?sort[0][field]=Date&sort[0][direction]=desc&maxRecords=100`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
    });
    
    await handleAirtableError(response, 'getWorkouts');
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.records?.length || 0} workouts`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching workouts:', error);
    throw error;
  }
};

export const getTodaysWorkout = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const filterFormula = `IS_SAME({Date}, "${today}", "day")`;
    
    console.log(`📅 Fetching today's workout for ${today}...`);
    
    const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.workouts}?filterByFormula=${encodeURIComponent(filterFormula)}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
    });
    
    await handleAirtableError(response, 'getTodaysWorkout');
    
    const data = await response.json();
    const todaysWorkout = data.records?.[0] || null;
    
    console.log('✅ Today\'s workout:', todaysWorkout ? todaysWorkout.fields.Daytype : 'None found');
    return todaysWorkout;
  } catch (error) {
    console.error('❌ Error fetching today\'s workout:', error);
    throw error;
  }
};

// ========== EXERCISE LOGGING OPERATIONS ==========
export const logExerciseSet = async (exerciseData) => {
  try {
    console.log('📝 Logging exercise set:', exerciseData);
    
    const payload = {
      fields: {
        WorkoutID: [exerciseData.WorkoutID], // Array format required
        Exercisename: exerciseData.ExerciseName, // FIXED: "Exercisename" from CSV
        SetNumber: parseInt(exerciseData.SetNumber),
        WeightKG: parseFloat(exerciseData.WeightKG),
        RepsCompleted: parseInt(exerciseData.RepsCompleted),
        RPE: exerciseData.RPE ? parseInt(exerciseData.RPE) : null,
        Tempo: exerciseData.Tempo || "2010",
        RestTime: exerciseData.RestTime || 120,
        IsMajorLift: exerciseData.IsMajorLift || false, // String field in CSV: "Yes"/"No" or boolean
        IsOptional: exerciseData.IsOptional || false,
        ExerciseOrder: exerciseData.ExerciseOrder,
        PersonalRecord: exerciseData.PersonalRecord || false
      }
    };
    
    console.log('📤 Sending exercise log payload:', payload);
    
    const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.exerciseLogs}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    await handleAirtableError(response, 'logExerciseSet');
    
    const data = await response.json();
    console.log('✅ Exercise set logged successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error logging exercise set:', error);
    throw error;
  }
};

export const getExerciseLogs = async (exerciseName, timeRange = '3months') => {
  try {
    const dateFilter = getDateFilter(timeRange);
    const filterFormula = `AND({Exercisename} = "${exerciseName}", ${dateFilter})`; // FIXED: "Exercisename"
    
    console.log(`📊 Fetching exercise logs for ${exerciseName} (${timeRange})...`);
    
    const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.exerciseLogs}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=Date&sort[0][direction]=asc`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
    });
    
    await handleAirtableError(response, 'getExerciseLogs');
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.records?.length || 0} exercise logs for ${exerciseName}`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching exercise logs:', error);
    throw error;
  }
};

export const getMajorLiftsProgress = async (timeRange = '6months') => {
  try {
    const dateFilter = getDateFilter(timeRange);
    const filterFormula = `AND({IsMajorLift} = "Yes", ${dateFilter})`; // FIXED: String comparison "Yes"
    
    console.log(`📈 Fetching major lifts progress (${timeRange})...`);
    
    const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.exerciseLogs}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=Date&sort[0][direction]=asc`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
    });
    
    await handleAirtableError(response, 'getMajorLiftsProgress');
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.records?.length || 0} major lift progress records`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching major lifts progress:', error);
    throw error;
  }
};

// ========== CARDIO LOGGING OPERATIONS ==========
export const logCardio = async (cardioData) => {
  try {
    console.log('🏃 Logging cardio session:', cardioData);
    
    const payload = {
      fields: {
        WorkoutID: [cardioData.WorkoutID], // Array format required
        Cardiotype: cardioData.CardioType, // FIXED: "Cardiotype" (lowercase 't')
        Duration: parseFloat(cardioData.Duration),
        Intensity: cardioData.Intensity.toString(),
        Distance: cardioData.Distance ? parseFloat(cardioData.Distance) : null,
        "Distance Unit": cardioData.DistanceUnit || "km", // FIXED: "Distance Unit" (with space)
        CaloriesBurned: cardioData.CaloriesBurned ? parseInt(cardioData.CaloriesBurned) : null,
        AverageHeartRate: cardioData.AverageHeartRate ? parseInt(cardioData.AverageHeartRate) : null,
        MaxHeartRate: cardioData.MaxHeartRate ? parseInt(cardioData.MaxHeartRate) : null,
        Notes: cardioData.Notes || "",
        PresetUsed: cardioData.PresetUsed || null
      }
    };
    
    console.log('📤 Sending cardio log payload:', payload);
    
    const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.cardioLogs}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    await handleAirtableError(response, 'logCardio');
    
    const data = await response.json();
    console.log('✅ Cardio session logged successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error logging cardio session:', error);
    throw error;
  }
};

// ========== UTILITY FUNCTIONS ==========
const getDateFilter = (timeRange) => {
  const ranges = {
    '1month': 'IS_AFTER({Date}, DATEADD(TODAY(), -1, "month"))',
    '3months': 'IS_AFTER({Date}, DATEADD(TODAY(), -3, "month"))',
    '6months': 'IS_AFTER({Date}, DATEADD(TODAY(), -6, "month"))',
    '1year': 'IS_AFTER({Date}, DATEADD(TODAY(), -1, "year"))'
  };
  return ranges[timeRange] || ranges['3months'];
};

// ========== EXERCISE_TEMPLATES TABLE ACCESS ==========
export const getExerciseTemplates = async (dayType) => {
  try {
    console.log(`🏋️ Fetching exercise templates for dayType: ${dayType}`);
    
    // Map dayType correctly for Airtable query
    const dayTypeMapping = {
      'Push': 'Push',
      'Lower1': 'Lower1',
      'Pull': 'Pull', 
      'Lower2': 'Lower2',
      'Accessory': 'Accessory', // Arms maps to Accessory
      'Arms': 'Accessory' // Also handle Arms directly
    };
    
    const mappedDayType = dayTypeMapping[dayType] || dayType;
    console.log(`🔄 Mapped ${dayType} to ${mappedDayType} for Airtable query`);
    
    const filterFormula = `{Daytype} = "${mappedDayType}"`; // FIXED: Using exact field name from CSV
    console.log(`🔍 Using filter formula: ${filterFormula}`);
    
    const url = `${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.exerciseTemplates}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=ExerciseOrder&sort[0][direction]=asc`;
    console.log(`📤 Fetching from URL: ${url}`);
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
    });
    
    await handleAirtableError(response, 'getExerciseTemplates');
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.records?.length || 0} exercise templates from EXERCISE_TEMPLATES for ${dayType}:`);
    
    if (data.records) {
      data.records.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.fields?.Exercisename} (Order: ${record.fields?.ExerciseOrder}, DayType: ${record.fields?.Daytype})`);
      });
    }
    
    return data.records || [];
  } catch (error) {
    console.error('❌ Error fetching from EXERCISE_TEMPLATES table:', error);
    throw error;
  }
};

// Test function to verify EXERCISE_TEMPLATES table access
export const testExerciseTemplatesAccess = async () => {
  try {
    console.log('🧪 Testing EXERCISE_TEMPLATES table access...');
    
    const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.exerciseTemplates}?maxRecords=10`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ EXERCISE_TEMPLATES table access failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Cannot access EXERCISE_TEMPLATES table: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ EXERCISE_TEMPLATES table access successful:', {
      recordCount: data.records?.length || 0,
      records: data.records?.map(r => ({
        id: r.id,
        exerciseName: r.fields?.Exercisename,
        dayType: r.fields?.Daytype,
        order: r.fields?.ExerciseOrder
      })) || []
    });
    
    // Show available day types to help with debugging
    const dayTypes = [...new Set(data.records?.map(r => r.fields?.Daytype).filter(Boolean))];
    console.log('🏷️ Available DayTypes in EXERCISE_TEMPLATES:', dayTypes);
    
    return { 
      success: true, 
      recordCount: data.records?.length || 0,
      sampleRecords: data.records?.slice(0, 3).map(r => r.fields?.Exercisename) || [],
      availableDayTypes: dayTypes
    };
  } catch (error) {
    console.error('❌ EXERCISE_TEMPLATES table access failed:', error);
    return { 
      success: false, 
      error: error.message,
      details: 'Check API key, base ID, and table ID configuration'
    };
  }
};

// ========== ENHANCED TEST CONNECTION ==========
export const testConnection = async () => {
  try {
    console.log('🧪 Testing Airtable connection...');
    
    const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.workouts}?maxRecords=1`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
    });
    
    const result = { 
      success: response.ok, 
      status: response.status,
      statusText: response.statusText
    };
    
    if (response.ok) {
      const data = await response.json();
      result.recordCount = data.records?.length || 0;
      console.log('✅ Airtable connection successful:', result);
    } else {
      const errorData = await response.json().catch(() => ({}));
      result.error = errorData.error?.message || 'Unknown error';
      console.error('❌ Airtable connection failed:', result);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Airtable connection test failed:', error);
    return { 
      success: false, 
      error: error.message,
      status: 0,
      statusText: 'Network Error'
    };
  }
};

// ========== TEST ALL TABLES ACCESS ==========
export const testAllTablesAccess = async () => {
  try {
    console.log('🧪 Testing access to all Airtable tables...');
    
    const tableTests = await Promise.allSettled([
      fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.workouts}?maxRecords=1`, { headers }),
      fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.exerciseLogs}?maxRecords=1`, { headers }),
      fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.cardioLogs}?maxRecords=1`, { headers }),
      fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.exerciseTemplates}?maxRecords=1`, { headers })
    ]);
    
    const results = {
      workouts: tableTests[0].status === 'fulfilled' && tableTests[0].value.ok,
      exerciseLogs: tableTests[1].status === 'fulfilled' && tableTests[1].value.ok,
      cardioLogs: tableTests[2].status === 'fulfilled' && tableTests[2].value.ok,
      exerciseTemplates: tableTests[3].status === 'fulfilled' && tableTests[3].value.ok
    };
    
    console.log('📊 Table access results:', results);
    
    return {
      success: Object.values(results).every(Boolean),
      details: results,
      failedTables: Object.entries(results).filter(([_, success]) => !success).map(([table]) => table)
    };
  } catch (error) {
    console.error('❌ Error testing table access:', error);
    return { success: false, error: error.message };
  }
};

// ========== LEGACY FUNCTIONS (kept for compatibility) ==========
export const EXERCISE_NAMES = {
  // Push Day Exercises
  'Push-A': 'Push-A: Smith Machine Low Incline Chest Press (Ramp)',
  'Push-B': 'Push-B: Smith Machine Low Incline Chest Press (3x5+5+5)',
  'Push-C': 'Push-C: Smith Machine Low Incline Chest Press (Dropset)',
  'Push-D1': 'Push-D1: Scott Press',
  'Push-D2': 'Push-D2: Cable Single Arm Across Body Extension',
  'Push-E1': 'Push-E1: BB Curl',
  'Push-E2': 'Push-E2: Tricep Pushdown',
  
  // Lower1 Day Exercises
  'Lower1-A': 'Lower1-A: Linear Hack Machine/Leg Press (Ramp)',
  'Lower1-A-Alt': 'Lower1-A-Alt: Back Squat (Ramp)',
  'Lower1-B': 'Lower1-B: Linear Hack Machine/Leg Press (3x5+5+5)',
  'Lower1-B-Alt': 'Lower1-B-Alt: Back Squat (3x5+5+5)',
  'Lower1-C': 'Lower1-C: Linear Hack Machine/Leg Press (Dropset)',
  'Lower1-C-Alt': 'Lower1-C-Alt: Back Squat (Dropset)',
  'Lower1-D1': 'Lower1-D1: Bulgarian Dumbbell Squat',
  'Lower1-D2': 'Lower1-D2: Cable Ab Crunches',
  'Lower1-D3': 'Lower1-D3: Single Leg Press',
  
  // Pull Day Exercises
  'Pull-A': 'Pull-A: Seated Row - Pronated MAG (Ramp)',
  'Pull-B': 'Pull-B: Seated Row - Pronated MAG (3x5+5+5)',
  'Pull-C': 'Pull-C: Seated Row - Pronated MAG (Dropset)',
  'Pull-D1': 'Pull-D1: Bench Supported Straight Arm P.D',
  'Pull-D2': 'Pull-D2: BB Curl',
  'Pull-E1': 'Pull-E1: Hammer Curl',
  'Pull-E2': 'Pull-E2: Incline DB Curl',
  
  // Lower2 Day Exercises
  'Lower2-A': 'Lower2-A: Hip Thrust (Ramp)',
  'Lower2-B': 'Lower2-B: Hip Thrust (3x8-10)',
  'Lower2-C': 'Lower2-C: Calf Raises',
  'Lower2-D1': 'Lower2-D1: GHD Back Extension',
  'Lower2-D2': 'Lower2-D2: Delt Raises',
  'Lower2-D3': 'Lower2-D3: Ab Crunch',
  
  // Arms Day Exercises
  'Arms-A1': 'Arms-A1: BB Curl',
  'Arms-A2': 'Arms-A2: Tricep Dips',
  'Arms-B1': 'Arms-B1: Incline DB Curl',
  'Arms-B2': 'Arms-B2: Overhead Tricep Extension',
  'Arms-C1': 'Arms-C1: Hammer Curl',
  'Arms-C2': 'Arms-C2: Cable Tricep Pushdown'
};

export const isMajorLift = (exerciseName) => {
  const order = exerciseName.split('-')[1]?.split(':')[0];
  return ['A', 'B', 'A1', 'A2'].includes(order);
};

export const getExerciseOrder = (exerciseName) => {
  return exerciseName.split('-')[1]?.split(':')[0];
};

export const getExercisesForDay = (dayType) => {
  console.log(`🔍 Getting exercises for day type: ${dayType}`);
  
  const exercises = Object.entries(EXERCISE_NAMES)
    .filter(([key, name]) => name.startsWith(dayType))
    .map(([key, name]) => ({
      key,
      name,
      order: getExerciseOrder(name),
      isMajorLift: isMajorLift(name)
    }))
    .sort((a, b) => {
      const orderA = a.order;
      const orderB = b.order;
      return orderA.localeCompare(orderB);
    });
    
  console.log(`✅ Found ${exercises.length} exercises for ${dayType}:`, exercises.map(e => e.name));
  return exercises;
};

export const CARDIO_TYPES = [
  'Treadmill',
  'Elliptical',
  'Stationary Bike',
  'Rowing Machine',
  'Stair Climber',
  'Walking (Outdoor)',
  'Running (Outdoor)',
  'Swimming',
  'Cycling (Outdoor)',
  'HIIT Training',
  'Custom/Other'
];

export const CARDIO_PRESETS = [
  '15min Easy',
  '15min Moderate',
  '20min Moderate',
  '30min Moderate',
  '15min HIIT',
  '20min HIIT',
  '30min HIIT',
  'Custom Session'
];