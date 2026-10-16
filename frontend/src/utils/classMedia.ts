export interface ClassMeta {
  imageUrl: string;
  category: string;
  intensity: 'All Levels' | 'Moderate' | 'High Intensity' | 'Advanced';
  description: string;
  equipment: string[];
}

export interface PresetImage {
  id: string;
  label: string;
  url: string;
}

export const PRESET_IMAGES: PresetImage[] = [
  {
    id: 'yoga',
    label: 'Mind & Body (Yoga / Pilates)',
    url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'boxing',
    label: 'Boxing & Combat',
    url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'hiit',
    label: 'HIIT & Circuit',
    url: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'strength',
    label: 'Strength & Conditioning',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cycling',
    label: 'Spin & Cycling',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'functional',
    label: 'Functional Training',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
];

const STORAGE_KEY = 'vyro-class-custom-images';

/**
 * Saves a custom image URL chosen by staff for a given class title.
 */
export function saveCustomClassImage(title: string, imageUrl: string): void {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    stored[title.trim().toLowerCase()] = imageUrl;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Fallback gracefully if storage quota exceeded or disabled
  }
}

/**
 * Retrieves the image and rich metadata for a class.
 */
export function getClassMedia(title: string): ClassMeta {
  const key = title.trim().toLowerCase();

  // 1. Check if staff assigned a custom image in localStorage
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (stored[key]) {
      return {
        imageUrl: stored[key],
        category: 'Signature Class',
        intensity: 'All Levels',
        description: `A signature fitness experience led by expert coaches at VYRO. Designed to elevate stamina, tone muscles, and inspire your fitness journey.`,
        equipment: ['All equipment provided', 'Towel provided', 'Locker & Showers available'],
      };
    }
  } catch {
    // Ignore and fallback
  }

  // 2. Fallback to curated theme presets by keyword
  if (key.includes('yoga') || key.includes('stretch') || key.includes('pilates')) {
    return {
      imageUrl: PRESET_IMAGES[0].url,
      category: 'Mind & Body',
      intensity: 'All Levels',
      description:
        'Focus on balance, flexibility, and controlled breathing. Ideal for recovery, mental clarity, and joint mobility.',
      equipment: ['Yoga Mat provided', 'Blocks & Straps', 'Towel provided'],
    };
  }

  if (key.includes('box') || key.includes('combat') || key.includes('fight')) {
    return {
      imageUrl: PRESET_IMAGES[1].url,
      category: 'Combat & Agility',
      intensity: 'High Intensity',
      description:
        'Choreographed boxing drills, heavy bag work, and core conditioning designed to burn calories and sharpen reflexes.',
      equipment: ['Hand wraps recommended', 'Boxing gloves provided', 'Hydration station'],
    };
  }

  if (
    key.includes('hiit') ||
    key.includes('blast') ||
    key.includes('circuit') ||
    key.includes('bootcamp')
  ) {
    return {
      imageUrl: PRESET_IMAGES[2].url,
      category: 'High Intensity',
      intensity: 'High Intensity',
      description:
        'Short bursts of all-out effort followed by active recovery intervals. Maximize metabolic conditioning and cardiovascular endurance.',
      equipment: ['Kettlebells', 'Agility Ladders', 'Heart rate tracking supported'],
    };
  }

  if (
    key.includes('strength') ||
    key.includes('pump') ||
    key.includes('lift') ||
    key.includes('core')
  ) {
    return {
      imageUrl: PRESET_IMAGES[3].url,
      category: 'Strength & Conditioning',
      intensity: 'Moderate',
      description:
        'Structured compound movements focusing on progressive overload, muscle tone, and functional movement patterns.',
      equipment: ['Free weights & Dumbbells', 'Barbells & Plates', 'Resistance Bands'],
    };
  }

  if (key.includes('spin') || key.includes('cycle') || key.includes('ride')) {
    return {
      imageUrl: PRESET_IMAGES[4].url,
      category: 'Cardio & Rhythm',
      intensity: 'High Intensity',
      description:
        'Rhythm-based indoor cycling with heart-pumping climbs, sprints, and choreography under energizing lighting.',
      equipment: ['Cycling shoes compatible (SPD)', 'Locker provided', 'Towel provided'],
    };
  }

  return {
    imageUrl: PRESET_IMAGES[5].url,
    category: 'Functional Fitness',
    intensity: 'All Levels',
    description:
      'A total-body functional training session targeting strength, cardio, and athletic stamina with guided coaching.',
    equipment: ['All equipment provided', 'Locker & Showers available', 'Water refill station'],
  };
}
