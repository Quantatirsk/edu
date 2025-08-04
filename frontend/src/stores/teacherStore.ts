import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Teacher, DetailedReview } from '../types';

// 教师筛选类型
export interface TeacherFilters {
  subjects: string[];
  priceRange: [number, number];
  experienceRange: [number, number];
  ratingRange: [number, number];
  location: {
    district?: string;
    maxDistance?: number;
    coordinates?: { lat: number; lng: number };
  };
  availability: string[];
  certifications: string[];
  teachingStyles: string[];
}

// 教师排序类型
export type TeacherSortOption = 
  | 'rating-desc'
  | 'rating-asc'
  | 'price-asc'
  | 'price-desc'
  | 'experience-desc'
  | 'experience-asc'
  | 'distance-asc'
  | 'reviews-desc'
  | 'newest';

// 教师列表视图类型
export type TeacherViewMode = 'grid' | 'list' | 'map';

// 教师状态接口
export interface TeacherState {
  // 教师列表
  teachers: Teacher[];
  filteredTeachers: Teacher[];
  selectedTeacher: Teacher | null;
  
  // 列表状态
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  total: number;
  page: number;
  pageSize: number;
  
  // 筛选和排序
  filters: TeacherFilters;
  sortBy: TeacherSortOption;
  searchQuery: string;
  
  // 视图状态
  viewMode: TeacherViewMode;
  showFilters: boolean;
  
  // 收藏和比较
  favorites: string[];
  compareList: string[];
  
  // 评价相关
  reviews: Record<string, DetailedReview[]>;
  reviewsLoading: Record<string, boolean>;
  
  // 缓存策略
  cache: {
    lastFetch: number;
    ttl: number;
    version: string;
  };
  
  // 统计信息
  statistics: {
    totalViews: number;
    popularSubjects: Array<{ subject: string; count: number }>;
    averagePrice: number;
    averageRating: number;
  };
}

// 教师操作接口
export interface TeacherActions {
  // 基本数据操作
  setTeachers: (teachers: Teacher[]) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  removeTeacher: (id: string) => void;
  
  // 选择操作
  selectTeacher: (teacher: Teacher | null) => void;
  selectTeacherById: (id: string) => void;
  
  // 加载状态
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  
  // 分页操作
  setPage: (page: number) => void;
  nextPage: () => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  
  // 筛选操作
  setFilters: (filters: Partial<TeacherFilters>) => void;
  resetFilters: () => void;
  addSubjectFilter: (subject: string) => void;
  removeSubjectFilter: (subject: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setLocationFilter: (location: TeacherFilters['location']) => void;
  
  // 搜索操作
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // 排序操作
  setSortBy: (sort: TeacherSortOption) => void;
  
  // 视图操作
  setViewMode: (mode: TeacherViewMode) => void;
  toggleFilters: () => void;
  
  // 收藏操作
  addToFavorites: (teacherId: string) => void;
  removeFromFavorites: (teacherId: string) => void;
  isFavorite: (teacherId: string) => boolean;
  clearFavorites: () => void;
  
  // 比较操作
  addToCompare: (teacherId: string) => void;
  removeFromCompare: (teacherId: string) => void;
  clearCompareList: () => void;
  isInCompare: (teacherId: string) => boolean;
  
  // 评价操作
  setTeacherReviews: (teacherId: string, reviews: DetailedReview[]) => void;
  addTeacherReview: (teacherId: string, review: DetailedReview) => void;
  setReviewsLoading: (teacherId: string, loading: boolean) => void;
  
  // 数据处理
  applyFiltersAndSort: () => void;
  searchTeachers: (query: string) => Teacher[];
  getNearbyTeachers: (location: { lat: number; lng: number }, radius: number) => Teacher[];
  getTeachersBySubject: (subject: string) => Teacher[];
  getTopRatedTeachers: (limit?: number) => Teacher[];
  
  // 统计操作
  updateStatistics: () => void;
  incrementTeacherView: (teacherId: string) => void;
  
  // 缓存操作
  updateCache: () => void;
  isCacheValid: () => boolean;
  clearCache: () => void;
  
  // 工具方法
  reset: () => void;
}

// 默认筛选条件
const defaultFilters: TeacherFilters = {
  subjects: [],
  priceRange: [0, 1000],
  experienceRange: [0, 50],
  ratingRange: [0, 5],
  location: {},
  availability: [],
  certifications: [],
  teachingStyles: [],
};

// 默认状态
const initialState: TeacherState = {
  teachers: [],
  filteredTeachers: [],
  selectedTeacher: null,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  total: 0,
  page: 1,
  pageSize: 20,
  filters: defaultFilters,
  sortBy: 'rating-desc',
  searchQuery: '',
  viewMode: 'grid',
  showFilters: false,
  favorites: [],
  compareList: [],
  reviews: {},
  reviewsLoading: {},
  cache: {
    lastFetch: 0,
    ttl: 5 * 60 * 1000, // 5分钟
    version: '1.0',
  },
  statistics: {
    totalViews: 0,
    popularSubjects: [],
    averagePrice: 0,
    averageRating: 0,
  },
};

// 计算距离的辅助函数
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // 地球半径(公里)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 创建教师 Store
export const useTeacherStore = create<TeacherState & TeacherActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // 基本数据操作
    setTeachers: (teachers) => {
      set({ teachers });
      get().applyFiltersAndSort();
      get().updateStatistics();
    },
    
    addTeacher: (teacher) => {
      set((state) => ({
        teachers: [...state.teachers, teacher],
        total: state.total + 1,
      }));
      get().applyFiltersAndSort();
      get().updateStatistics();
    },
    
    updateTeacher: (id, updates) => {
      set((state) => ({
        teachers: state.teachers.map(teacher =>
          teacher.id === id ? { ...teacher, ...updates } : teacher
        ),
      }));
      get().applyFiltersAndSort();
      
      // 更新选中的教师
      const { selectedTeacher } = get();
      if (selectedTeacher && selectedTeacher.id === id) {
        set({ selectedTeacher: { ...selectedTeacher, ...updates } });
      }
    },
    
    removeTeacher: (id) => {
      set((state) => ({
        teachers: state.teachers.filter(teacher => teacher.id !== id),
        total: Math.max(0, state.total - 1),
      }));
      get().applyFiltersAndSort();
      
      // 清除相关状态
      const { selectedTeacher, favorites, compareList } = get();
      if (selectedTeacher && selectedTeacher.id === id) {
        set({ selectedTeacher: null });
      }
      
      set({
        favorites: favorites.filter(fId => fId !== id),
        compareList: compareList.filter(cId => cId !== id),
      });
    },
    
    // 选择操作
    selectTeacher: (teacher) => {
      set({ selectedTeacher: teacher });
      if (teacher) {
        get().incrementTeacherView(teacher.id);
      }
    },
    
    selectTeacherById: (id) => {
      const teacher = get().teachers.find(t => t.id === id) || null;
      get().selectTeacher(teacher);
    },
    
    // 加载状态
    setLoading: (isLoading) => set({ isLoading }),
    setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
    setHasMore: (hasMore) => set({ hasMore }),
    
    // 分页操作
    setPage: (page) => set({ page }),
    nextPage: () => set((state) => ({ page: state.page + 1 })),
    setPageSize: (pageSize) => set({ pageSize, page: 1 }),
    setTotal: (total) => set({ total }),
    
    // 筛选操作
    setFilters: (newFilters) => {
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
        page: 1, // 重置页面
      }));
      get().applyFiltersAndSort();
    },
    
    resetFilters: () => {
      set({ filters: defaultFilters, page: 1 });
      get().applyFiltersAndSort();
    },
    
    addSubjectFilter: (subject) => {
      const { filters } = get();
      if (!filters.subjects.includes(subject)) {
        get().setFilters({
          subjects: [...filters.subjects, subject],
        });
      }
    },
    
    removeSubjectFilter: (subject) => {
      const { filters } = get();
      get().setFilters({
        subjects: filters.subjects.filter(s => s !== subject),
      });
    },
    
    setPriceRange: (range) => {
      get().setFilters({ priceRange: range });
    },
    
    setLocationFilter: (location) => {
      get().setFilters({ location });
    },
    
    // 搜索操作
    setSearchQuery: (searchQuery) => {
      set({ searchQuery, page: 1 });
      get().applyFiltersAndSort();
    },
    
    clearSearch: () => {
      set({ searchQuery: '' });
      get().applyFiltersAndSort();
    },
    
    // 排序操作
    setSortBy: (sortBy) => {
      set({ sortBy });
      get().applyFiltersAndSort();
    },
    
    // 视图操作
    setViewMode: (viewMode) => set({ viewMode }),
    toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),
    
    // 收藏操作
    addToFavorites: (teacherId) => {
      set((state) => ({
        favorites: [...new Set([...state.favorites, teacherId])],
      }));
    },
    
    removeFromFavorites: (teacherId) => {
      set((state) => ({
        favorites: state.favorites.filter(id => id !== teacherId),
      }));
    },
    
    isFavorite: (teacherId) => {
      return get().favorites.includes(teacherId);
    },
    
    clearFavorites: () => set({ favorites: [] }),
    
    // 比较操作
    addToCompare: (teacherId) => {
      const { compareList } = get();
      if (compareList.length < 3 && !compareList.includes(teacherId)) {
        set({ compareList: [...compareList, teacherId] });
      }
    },
    
    removeFromCompare: (teacherId) => {
      set((state) => ({
        compareList: state.compareList.filter(id => id !== teacherId),
      }));
    },
    
    clearCompareList: () => set({ compareList: [] }),
    
    isInCompare: (teacherId) => {
      return get().compareList.includes(teacherId);
    },
    
    // 评价操作
    setTeacherReviews: (teacherId, reviews) => {
      set((state) => ({
        reviews: { ...state.reviews, [teacherId]: reviews },
      }));
    },
    
    addTeacherReview: (teacherId, review) => {
      set((state) => ({
        reviews: {
          ...state.reviews,
          [teacherId]: [...(state.reviews[teacherId] || []), review],
        },
      }));
    },
    
    setReviewsLoading: (teacherId, loading) => {
      set((state) => ({
        reviewsLoading: { ...state.reviewsLoading, [teacherId]: loading },
      }));
    },
    
    // 数据处理
    applyFiltersAndSort: () => {
      const { teachers, filters, sortBy, searchQuery } = get();
      
      let filtered = teachers;
      
      // 应用搜索
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(teacher =>
          teacher.name.toLowerCase().includes(query) ||
          teacher.description.toLowerCase().includes(query) ||
          teacher.subject.some(s => s.toLowerCase().includes(query)) ||
          teacher.teachingStyle.toLowerCase().includes(query)
        );
      }
      
      // 应用筛选
      if (filters.subjects.length > 0) {
        filtered = filtered.filter(teacher =>
          teacher.subject.some(s => filters.subjects.includes(s))
        );
      }
      
      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
        filtered = filtered.filter(teacher =>
          teacher.price >= filters.priceRange[0] && teacher.price <= filters.priceRange[1]
        );
      }
      
      if (filters.experienceRange[0] > 0 || filters.experienceRange[1] < 50) {
        filtered = filtered.filter(teacher =>
          teacher.experience >= filters.experienceRange[0] && 
          teacher.experience <= filters.experienceRange[1]
        );
      }
      
      if (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 5) {
        filtered = filtered.filter(teacher =>
          teacher.rating >= filters.ratingRange[0] && teacher.rating <= filters.ratingRange[1]
        );
      }
      
      // 位置筛选
      if (filters.location.coordinates && filters.location.maxDistance) {
        const { coordinates, maxDistance } = filters.location;
        filtered = filtered.filter(teacher => {
          const distance = calculateDistance(
            coordinates.lat,
            coordinates.lng,
            teacher.location.lat,
            teacher.location.lng
          );
          return distance <= maxDistance;
        });
      }
      
      if (filters.location.district) {
        filtered = filtered.filter(teacher =>
          teacher.location.district === filters.location.district
        );
      }
      
      // 可用性筛选
      if (filters.availability.length > 0) {
        filtered = filtered.filter(teacher =>
          teacher.availability.some(time => filters.availability.includes(time))
        );
      }
      
      // 资质筛选
      if (filters.certifications.length > 0) {
        filtered = filtered.filter(teacher =>
          teacher.certifications.some(cert => filters.certifications.includes(cert))
        );
      }
      
      // 应用排序
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'rating-desc':
            return b.rating - a.rating;
          case 'rating-asc':
            return a.rating - b.rating;
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'experience-desc':
            return b.experience - a.experience;
          case 'experience-asc':
            return a.experience - b.experience;
          case 'reviews-desc':
            return b.reviews - a.reviews;
          case 'distance-asc':
            if (filters.location.coordinates) {
              const { coordinates } = filters.location;
              const distanceA = calculateDistance(
                coordinates.lat, coordinates.lng, a.location.lat, a.location.lng
              );
              const distanceB = calculateDistance(
                coordinates.lat, coordinates.lng, b.location.lat, b.location.lng
              );
              return distanceA - distanceB;
            }
            return 0;
          default:
            return 0;
        }
      });
      
      set({ filteredTeachers: filtered });
    },
    
    searchTeachers: (query) => {
      const { teachers } = get();
      if (!query.trim()) return teachers;
      
      const lowerQuery = query.toLowerCase();
      return teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(lowerQuery) ||
        teacher.description.toLowerCase().includes(lowerQuery) ||
        teacher.subject.some(s => s.toLowerCase().includes(lowerQuery))
      );
    },
    
    getNearbyTeachers: (location, radius) => {
      const { teachers } = get();
      return teachers.filter(teacher => {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          teacher.location.lat,
          teacher.location.lng
        );
        return distance <= radius;
      });
    },
    
    getTeachersBySubject: (subject) => {
      const { teachers } = get();
      return teachers.filter(teacher => teacher.subject.includes(subject));
    },
    
    getTopRatedTeachers: (limit = 10) => {
      const { teachers } = get();
      return [...teachers]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
    },
    
    // 统计操作
    updateStatistics: () => {
      const { teachers } = get();
      
      if (teachers.length === 0) return;
      
      const subjectCount = teachers.reduce((acc, teacher) => {
        teacher.subject.forEach(subject => {
          acc[subject] = (acc[subject] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      
      const popularSubjects = Object.entries(subjectCount)
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      const averagePrice = teachers.reduce((sum, teacher) => sum + teacher.price, 0) / teachers.length;
      const averageRating = teachers.reduce((sum, teacher) => sum + teacher.rating, 0) / teachers.length;
      
      set((state) => ({
        statistics: {
          ...state.statistics,
          popularSubjects,
          averagePrice: Math.round(averagePrice * 100) / 100,
          averageRating: Math.round(averageRating * 100) / 100,
        },
      }));
    },
    
    incrementTeacherView: (_teacherId) => {
      set((state) => ({
        statistics: {
          ...state.statistics,
          totalViews: state.statistics.totalViews + 1,
        },
      }));
    },
    
    // 缓存操作
    updateCache: () => {
      set((state) => ({
        cache: {
          ...state.cache,
          lastFetch: Date.now(),
        },
      }));
    },
    
    isCacheValid: () => {
      const { cache } = get();
      return Date.now() - cache.lastFetch < cache.ttl;
    },
    
    clearCache: () => {
      set((state) => ({
        cache: {
          ...state.cache,
          lastFetch: 0,
        },
      }));
    },
    
    // 重置
    reset: () => {
      set(initialState);
    },
  }))
);

// 选择器 Hooks
export const useTeachers = () => useTeacherStore((state) => state.filteredTeachers);
export const useAllTeachers = () => useTeacherStore((state) => state.teachers);
export const useSelectedTeacher = () => useTeacherStore((state) => state.selectedTeacher);
export const useTeacherFilters = () => useTeacherStore((state) => state.filters);
export const useTeacherSearch = () => useTeacherStore((state) => state.searchQuery);
export const useTeacherSort = () => useTeacherStore((state) => state.sortBy);
export const useTeacherViewMode = () => useTeacherStore((state) => state.viewMode);
export const useTeacherFavorites = () => useTeacherStore((state) => state.favorites);
export const useTeacherCompareList = () => useTeacherStore((state) => state.compareList);
export const useTeacherLoading = () => useTeacherStore((state) => ({
  isLoading: state.isLoading,
  isLoadingMore: state.isLoadingMore,
  hasMore: state.hasMore,
}));
export const useTeacherStatistics = () => useTeacherStore((state) => state.statistics);

// 操作 Hooks
export const useTeacherActions = () => useTeacherStore((state) => ({
  setTeachers: state.setTeachers,
  selectTeacher: state.selectTeacher,
  selectTeacherById: state.selectTeacherById,
  setFilters: state.setFilters,
  resetFilters: state.resetFilters,
  setSearchQuery: state.setSearchQuery,
  setSortBy: state.setSortBy,
  setViewMode: state.setViewMode,
  toggleFilters: state.toggleFilters,
  addToFavorites: state.addToFavorites,
  removeFromFavorites: state.removeFromFavorites,
  isFavorite: state.isFavorite,
  addToCompare: state.addToCompare,
  removeFromCompare: state.removeFromCompare,
  isInCompare: state.isInCompare,
  searchTeachers: state.searchTeachers,
  getNearbyTeachers: state.getNearbyTeachers,
  getTeachersBySubject: state.getTeachersBySubject,
}));