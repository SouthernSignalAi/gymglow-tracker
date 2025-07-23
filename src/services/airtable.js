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

// ========== WORKOUT OPERATIONS ==========
export const createWorkout = async (workoutData) => {
  const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.workouts}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        Date: new Date().toISOString(),
        DayType: workoutData.DayType, // "Push", "Lower1", "Pull", "Lower2", "Arms"
        Completed: false,
        CardioCompleted: false,
        Duration: null,
        Notes: workoutData.Notes || "",
        ThemeUsed: workoutData.ThemeUsed || "Light"
      }
    })
  });
  return response.json();
};

export const updateWorkout = async (workoutId, updateData) => {
  const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.workouts}/${workoutId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields: updateData })
  });
  return response.json();
};

export const getWorkouts = async () => {
  const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.workouts}?sort[0][field]=Date&sort[0][direction]=desc&maxRecords=100`, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
  });
  return response.json();
};

export const getTodaysWorkout = async () => {
  const today = new Date().toISOString().split('T')[0];
  const filterFormula = `IS_SAME({Date}, "${today}", "day")`;
  const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.workouts}?filterByFormula=${encodeURIComponent(filterFormula)}`, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
  });
  const data = await response.json();
  return data.records?.[0] || null;
};

// ========== EXERCISE LOGGING OPERATIONS ==========
export const logExerciseSet = async (exerciseData) => {
  const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.exerciseLogs}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        WorkoutID: [exerciseData.WorkoutID], // MUST be array format
        ExerciseName: exerciseData.ExerciseName, // EXACT format required
        SetNumber: parseInt(exerciseData.SetNumber),
        WeightKG: parseFloat(exerciseData.WeightKG), // Always decimal in KG
        RepsCompleted: parseInt(exerciseData.RepsCompleted),
        RPE: exerciseData.RPE ? parseInt(exerciseData.RPE) : null,
        Tempo: exerciseData.Tempo || "2010",
        RestTime: exerciseData.RestTime || 120,
        IsMajorLift: exerciseData.IsMajorLift || false,
        IsOptional: exerciseData.IsOptional || false,
        ExerciseOrder: exerciseData.ExerciseOrder,
        PersonalRecord: exerciseData.PersonalRecord || false,
        FormNotes: exerciseData.FormNotes || ""
      }
    })
  });
  return response.json();
};

export const getExerciseLogs = async (exerciseName, timeRange = '3months') => {
  const dateFilter = getDateFilter(timeRange);
  const filterFormula = `AND({ExerciseName} = "${exerciseName}", ${dateFilter})`;
  const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.exerciseLogs}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=Date&sort[0][direction]=asc`, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
  });
  return response.json();
};

export const getMajorLiftsProgress = async (timeRange = '6months') => {
  const dateFilter = getDateFilter(timeRange);
  const filterFormula = `AND({IsMajorLift} = 1, ${dateFilter})`;
  const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.exerciseLogs}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=Date&sort[0][direction]=asc`, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
  });
  return response.json();
};

// ========== CARDIO LOGGING OPERATIONS ==========
export const logCardio = async (cardioData) => {
  const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.cardioLogs}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        WorkoutID: [cardioData.WorkoutID], // MUST be array format
        CardioType: cardioData.CardioType,
        Duration: parseFloat(cardioData.Duration),
        Intensity: cardioData.Intensity.toString(),
        Distance: cardioData.Distance ? parseFloat(cardioData.Distance) : null,
        DistanceUnit: cardioData.DistanceUnit || "km",
        CaloriesBurned: cardioData.CaloriesBurned ? parseInt(cardioData.CaloriesBurned) : null,
        AverageHeartRate: cardioData.AverageHeartRate ? parseInt(cardioData.AverageHeartRate) : null,
        MaxHeartRate: cardioData.MaxHeartRate ? parseInt(cardioData.MaxHeartRate) : null,
        Notes: cardioData.Notes || "",
        PresetUsed: cardioData.PresetUsed || null
      }
    })
  });
  return response.json();
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

// ========== EXACT EXERCISE NAMES (CRITICAL) ==========
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

// ========== MAJOR LIFT IDENTIFICATION ==========
export const isMajorLift = (exerciseName) => {
  const order = exerciseName.split('-')[1]?.split(':')[0];
  return ['A', 'B', 'A1', 'A2'].includes(order);
};

export const getExerciseOrder = (exerciseName) => {
  return exerciseName.split('-')[1]?.split(':')[0];
};

// ========== WORKOUT FLOW HELPERS ==========
export const getExercisesForDay = (dayType) => {
  return Object.entries(EXERCISE_NAMES)
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
};

// ========== CARDIO TYPES ==========
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

// ========== TEST CONNECTION ==========
export const testConnection = async () => {
  try {
    const response = await fetch(`${AIRTABLE_CONFIG.baseUrl}/${AIRTABLE_CONFIG.tables.workouts}?maxRecords=1`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` }
    });
    return { success: response.ok, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
};