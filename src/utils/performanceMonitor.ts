/**
 * Performance monitoring utility for tracking app performance
 */
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static observers: PerformanceObserver[] = [];

  /**
   * Start timing a specific operation
   */
  static startTimer(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric(operation, duration);
      console.log(`⚡ ${operation}: ${Math.round(duration)}ms`);
      
      return duration;
    };
  }

  /**
   * Record a performance metric
   */
  static recordMetric(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metrics = this.metrics.get(operation)!;
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get performance statistics for an operation
   */
  static getStats(operation: string) {
    const metrics = this.metrics.get(operation) || [];
    
    if (metrics.length === 0) {
      return null;
    }
    
    const sorted = [...metrics].sort((a, b) => a - b);
    const avg = metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    return {
      operation,
      count: metrics.length,
      average: Math.round(avg),
      median: Math.round(median),
      p95: Math.round(p95),
      min: Math.round(min),
      max: Math.round(max)
    };
  }

  /**
   * Get all performance statistics
   */
  static getAllStats() {
    const stats: Record<string, any> = {};
    
    for (const operation of this.metrics.keys()) {
      stats[operation] = this.getStats(operation);
    }
    
    return stats;
  }

  /**
   * Monitor React component render times
   */
  static monitorComponent(componentName: string) {
    return {
      onRenderStart: () => {
        return this.startTimer(`${componentName}_render`);
      },
      onDataLoad: () => {
        return this.startTimer(`${componentName}_data_load`);
      }
    };
  }

  /**
   * Monitor API calls
   */
  static monitorAPI(apiName: string) {
    return {
      start: () => this.startTimer(`api_${apiName}`),
      recordCacheHit: () => this.recordMetric(`api_${apiName}_cache_hit`, 0),
      recordCacheMiss: () => this.recordMetric(`api_${apiName}_cache_miss`, 0)
    };
  }

  /**
   * Setup performance observers for web vitals
   */
  static setupWebVitals() {
    if (typeof window === 'undefined') return;

    // Monitor Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('web_vital_lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // Monitor First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('web_vital_fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Monitor Cumulative Layout Shift (CLS)
    try {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            this.recordMetric('web_vital_cls', entry.value);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }
  }

  /**
   * Log performance summary
   */
  static logSummary() {
    const stats = this.getAllStats();
    console.group('📊 Performance Summary');
    
    Object.values(stats).forEach((stat: any) => {
      if (stat) {
        console.log(`${stat.operation}: avg ${stat.average}ms, p95 ${stat.p95}ms (${stat.count} samples)`);
      }
    });
    
    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  static clear() {
    this.metrics.clear();
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Get performance recommendations
   */
  static getRecommendations() {
    const stats = this.getAllStats();
    const recommendations: string[] = [];

    Object.values(stats).forEach((stat: any) => {
      if (!stat) return;

      if (stat.operation.includes('analytics') && stat.average > 1000) {
        recommendations.push(`Analytics loading is slow (${stat.average}ms avg). Consider caching or pagination.`);
      }
      
      if (stat.operation.includes('render') && stat.average > 100) {
        recommendations.push(`${stat.operation} is slow (${stat.average}ms avg). Consider memoization or virtualization.`);
      }
      
      if (stat.operation.includes('api') && stat.average > 500) {
        recommendations.push(`${stat.operation} is slow (${stat.average}ms avg). Consider caching or optimization.`);
      }
    });

    return recommendations;
  }
}

// Auto-setup web vitals monitoring
if (typeof window !== 'undefined') {
  PerformanceMonitor.setupWebVitals();
  
  // Log summary every 30 seconds in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      PerformanceMonitor.logSummary();
    }, 30000);
  }
}
