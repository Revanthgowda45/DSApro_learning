import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getTopics, getCompanies, Problem } from '../../data/dsaDatabase';

interface FilterState {
  search: string;
  difficulty: string;
  topic: string;
  status: string;
  company: string;
  showBookmarked: boolean;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  problems: Problem[];
}

export default function FilterModal({
  visible,
  onClose,
  filters,
  onFiltersChange,
  problems,
}: FilterModalProps) {
  const { theme } = useTheme();
  const [topics, setTopics] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [topicsList, companiesList] = await Promise.all([
        getTopics(),
        getCompanies(),
      ]);
      setTopics(topicsList);
      setCompanies(companiesList);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const statuses = ['not_started', 'attempted', 'solved', 'mastered'];

  const clearAllFilters = () => {
    onFiltersChange({
      difficulty: '',
      topic: '',
      status: '',
      company: '',
      showBookmarked: false,
    });
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    section: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    optionButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    optionText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    optionTextActive: {
      color: 'white',
      fontWeight: '500',
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleButton: {
      width: 50,
      height: 30,
      borderRadius: 15,
      padding: 2,
      justifyContent: 'center',
    },
    toggleButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    toggleButtonInactive: {
      backgroundColor: theme.colors.border,
    },
    toggleCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'white',
    },
    toggleCircleActive: {
      alignSelf: 'flex-end',
    },
    toggleCircleInactive: {
      alignSelf: 'flex-start',
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
    },
    clearButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    applyButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
  });

  const renderFilterSection = (
    title: string,
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void,
    displayTransform?: (value: string) => string
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsGrid}>
        {options.map((option) => {
          const isSelected = selectedValue === option;
          const displayValue = displayTransform ? displayTransform(option) : option;
          
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonActive,
              ]}
              onPress={() => onSelect(isSelected ? '' : option)}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextActive,
                ]}
              >
                {displayValue}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const statusDisplayMap: Record<string, string> = {
    not_started: 'Not Started',
    attempted: 'Attempted',
    solved: 'Solved',
    mastered: 'Mastered',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter Problems</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Difficulty Filter */}
            {renderFilterSection(
              'Difficulty',
              difficulties,
              filters.difficulty,
              (value) => onFiltersChange({ difficulty: value })
            )}

            {/* Topic Filter */}
            {renderFilterSection(
              'Topic',
              topics,
              filters.topic,
              (value) => onFiltersChange({ topic: value })
            )}

            {/* Status Filter */}
            {renderFilterSection(
              'Status',
              statuses,
              filters.status,
              (value) => onFiltersChange({ status: value }),
              (value) => statusDisplayMap[value] || value
            )}

            {/* Company Filter */}
            {renderFilterSection(
              'Company',
              companies.slice(0, 20), // Limit to first 20 companies
              filters.company,
              (value) => onFiltersChange({ company: value })
            )}

            {/* Bookmarked Toggle */}
            <View style={styles.section}>
              <View style={styles.toggleContainer}>
                <Text style={styles.sectionTitle}>Show Only Bookmarked</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    filters.showBookmarked
                      ? styles.toggleButtonActive
                      : styles.toggleButtonInactive,
                  ]}
                  onPress={() =>
                    onFiltersChange({ showBookmarked: !filters.showBookmarked })
                  }
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      filters.showBookmarked
                        ? styles.toggleCircleActive
                        : styles.toggleCircleInactive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
