export const CATEGORIES = [
  'All',
  'Environment',
  'Health',
  'Science',
  'Education',
  'Public Policy',
  'Economic Policy',
  'Community',
  'Arts & Culture',
  'Business',
  'Other',
] as const;

export type CategoryName = (typeof CATEGORIES)[number];

export interface CategoryMeta {
  name: CategoryName;
  icon: string;
  description: string;
}

export const CATEGORY_METADATA: Record<CategoryName, { icon: string; description: string }> = {
  All: {
    icon: 'grid-outline',
    description: 'All amplification campaigns across sectors',
  },
  Environment: {
    icon: 'leaf-outline',
    description: 'Clean energy, conservation, climate and clean water',
  },
  Health: {
    icon: 'fitness-outline',
    description: 'Mental health, healthcare access, medical research awareness',
  },
  Science: {
    icon: 'flask-outline',
    description: 'Scientific discovery, technological research and space exploration',
  },
  Education: {
    icon: 'school-outline',
    description: 'STEM education, literacy, student aid and open learning',
  },
  'Public Policy': {
    icon: 'shield-checkmark-outline',
    description: 'Digital privacy, civic rights, transparency and institutional reform',
  },
  'Economic Policy': {
    icon: 'trending-up-outline',
    description: 'Fair wages, financial literacy, economic opportunity and consumer rights',
  },
  Community: {
    icon: 'people-outline',
    description: 'Safer streets, neighborhood resilience, local safety initiatives',
  },
  'Arts & Culture': {
    icon: 'color-palette-outline',
    description: 'Independent artists, public arts, historic preservation, cultural heritage',
  },
  Business: {
    icon: 'briefcase-outline',
    description: 'Sustainable commerce, local enterprise, ethical business standards',
  },
  Other: {
    icon: 'ellipsis-horizontal-circle-outline',
    description: 'Other verified community message amplification campaigns',
  },
};
