import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { transformDSAQuestions, Problem } from '../data/dsaDatabase';
import ProblemCard from '../components/problems/ProblemCard';
import FilterModal from '../components/problems/FilterModal';
import { useOptimizedAnalytics } from '../hooks/useOptimizedAnalytics';

const { width } = Dimensions.get('window');
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

interface FilterState {
  search: string;
  difficulty: string;
  topic: string;
  status: string;
  company: string;
  showBookmarked: boolean;
}

export default function ProblemsScreen() {
  const { theme } = useTheme();
  const { batchUpdate } = useOptimizedAnalytics();
  
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    difficulty: '',
    topic: '',
    status: '',
    company: '',
    showBookmarked: false,
  });

  // Load problems data
  const loadProblems = useCallback(async () => {
    try {
      setLoading(true);
      const problemsData = await transformDSAQuestions();
      setProblems(problemsData);
    } catch (error) {
      console.error('Error loading problems:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  // Filter and search problems
  const filteredProblems = useMemo(() => {
    return problems.filter(problem => {
      // Search filter
      if (filters.search && !problem.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !problem.topic.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Difficulty filter
      if (filters.difficulty && problem.difficulty !== filters.difficulty) {
        return false;
      }
      
      // Topic filter
      if (filters.topic && problem.topic !== filters.topic) {
        return false;
      }
      
      // Status filter
      if (filters.status && problem.status !== filters.status) {
        return false;
      }
      
      // Company filter
      if (filters.company && !problem.companies?.includes(filters.company)) {
        return false;
      }
      
      // Bookmark filter
      if (filters.showBookmarked && !problem.isBookmarked) {
        return false;
      }
      
      return true;
    });
  }, [problems, filters]);

  // Paginated problems
  const paginatedProblems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProblems.slice(startIndex, endIndex);
  }, [filteredProblems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProblems.length / pageSize);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProblems();
    setRefreshing(false);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      difficulty: '',
      topic: '',
      status: '',
      company: '',
      showBookmarked: false,
    });
    setCurrentPage(1);
  };

  const handleProblemUpdate = (problemId: string, updates: any) => {
    setProblems(prev => 
      prev.map(problem => 
        problem.id === problemId 
          ? { ...problem, ...updates }
          : problem
      )
    );
    batchUpdate();
  };

  const renderProblemItem = ({ item }: { item: Problem }) => (
    <ProblemCard
      problem={item}
      onUpdate={(updates) => handleProblemUpdate(item.id, updates)}
    />
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.paginationText}>
          {currentPage} of {totalPages}
        </Text>
        
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      height: 44,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingLeft: 44,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchIcon: {
      position: 'absolute',
      left: 16,
      zIndex: 1,
    },
    filterButton: {
      marginLeft: 12,
      padding: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    resultsText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    clearFiltersButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.error + '20',
      borderRadius: 8,
    },
    clearFiltersText: {
      fontSize: 12,
      color: theme.colors.error,
      fontWeight: '500',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    paginationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      gap: 20,
    },
    paginationButton: {
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    paginationButtonDisabled: {
      opacity: 0.5,
    },
    paginationText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      color: theme.colors.textSecondary,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={32} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading problems...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>DSA Problems</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={theme.colors.textSecondary} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search problems or topics..."
            placeholderTextColor={theme.colors.textSecondary}
            value={filters.search}
            onChangeText={(text) => handleFilterChange({ search: text })}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Filter Results */}
        <View style={styles.filterRow}>
          <Text style={styles.resultsText}>
            {filteredProblems.length} problems found
          </Text>
          {(filters.difficulty || filters.topic || filters.status || filters.company || filters.showBookmarked) && (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Problems List */}
      <FlatList
        data={paginatedProblems}
        renderItem={renderProblemItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListFooterComponent={renderPagination}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFiltersChange={handleFilterChange}
        problems={problems}
      />
    </SafeAreaView>
  );
}
