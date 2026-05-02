/**
 * Analytics Service - Pattern Discovery & Descriptive Analytics
 * Handles: User behavior patterns, peak times, popular categories, aggregations
 */

import { db } from '../firebaseAdmin.js';

class AnalyticsService {
  /**
   * Get most active users by transaction count or activity frequency
   * @param {number} limit - Number of top users to return
   * @param {string} period - 'week', 'month', 'all'
   * @returns {Promise<Array>}
   */
  async getMostActiveUsers(limit = 10, period = 'month') {
    try {
      const cutoffDate = this._getCutoffDate(period);
      const snapshot = await db
        .collection('transactions')
        .where('timestamp', '>=', cutoffDate)
        .get();

      const userActivity = {};

      snapshot.forEach((doc) => {
        const userId = doc.data().userId;
        userActivity[userId] = (userActivity[userId] || 0) + 1;
      });

      // Sort and return top users
      const sorted = Object.entries(userActivity)
        .map(([userId, count]) => ({ userId, transactionCount: count }))
        .sort((a, b) => b.transactionCount - a.transactionCount)
        .slice(0, limit);

      return sorted;
    } catch (error) {
      console.error('Error getting most active users:', error);
      throw error;
    }
  }

  /**
   * Detect peak activity times (hourly and daily patterns)
   * @param {string} period - 'week', 'month'
   * @returns {Promise<Object>} { hourly: {}, daily: {}, peakHour, peakDay }
   */
  async getPeakActivityTimes(period = 'month') {
    try {
      const cutoffDate = this._getCutoffDate(period);
      const snapshot = await db
        .collection('transactions')
        .where('timestamp', '>=', cutoffDate)
        .get();

      const hourlyPattern = {};
      const dailyPattern = {};

      snapshot.forEach((doc) => {
        const timestamp = doc.data().timestamp.toDate();
        const hour = timestamp.getHours();
        const day = timestamp.toLocaleDateString('en-US', { weekday: 'short' });

        hourlyPattern[hour] = (hourlyPattern[hour] || 0) + 1;
        dailyPattern[day] = (dailyPattern[day] || 0) + 1;
      });

      // Find peak times
      const peakHour = Object.entries(hourlyPattern).reduce((a, b) =>
        a[1] > b[1] ? a : b
      )[0];

      const peakDay = Object.entries(dailyPattern).reduce((a, b) =>
        a[1] > b[1] ? a : b
      )[0];

      return {
        hourly: hourlyPattern,
        daily: dailyPattern,
        peakHour: parseInt(peakHour),
        peakDay,
        totalTransactions: snapshot.size,
      };
    } catch (error) {
      console.error('Error detecting peak activity times:', error);
      throw error;
    }
  }

  /**
   * Identify popular spending categories
   * @param {string} period - 'week', 'month', 'all'
   * @param {number} limit - Number of categories to return
   * @returns {Promise<Array>}
   */
  async getPopularCategories(period = 'month', limit = 10) {
    try {
      const cutoffDate = this._getCutoffDate(period);
      const snapshot = await db
        .collection('transactions')
        .where('timestamp', '>=', cutoffDate)
        .get();

      const categoryData = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const category = data.category || 'Uncategorized';
        const amount = data.amount || 0;

        if (!categoryData[category]) {
          categoryData[category] = {
            category,
            count: 0,
            totalAmount: 0,
            averageAmount: 0,
          };
        }

        categoryData[category].count += 1;
        categoryData[category].totalAmount += amount;
      });

      // Calculate averages and sort
      const sorted = Object.values(categoryData)
        .map((cat) => ({
          ...cat,
          averageAmount: parseFloat(
            (cat.totalAmount / cat.count).toFixed(2)
          ),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return sorted;
    } catch (error) {
      console.error('Error getting popular categories:', error);
      throw error;
    }
  }

  /**
   * Calculate aggregated statistics for users
   * @param {string} userId - Specific user or 'all' for global
   * @param {string} period - 'week', 'month', 'all'
   * @returns {Promise<Object>}
   */
  async getAggregateStatistics(userId = 'all', period = 'month') {
    try {
      const cutoffDate = this._getCutoffDate(period);
      let query = db.collection('transactions');

      if (userId !== 'all') {
        query = query.where('userId', '==', userId);
      }

      query = query.where('timestamp', '>=', cutoffDate);
      const snapshot = await query.get();

      if (snapshot.empty) {
        return {
          totalTransactions: 0,
          totalAmount: 0,
          averageAmount: 0,
          medianAmount: 0,
          maxAmount: 0,
          minAmount: 0,
          stdDeviation: 0,
        };
      }

      const amounts = [];
      let totalAmount = 0;

      snapshot.forEach((doc) => {
        const amount = doc.data().amount || 0;
        amounts.push(amount);
        totalAmount += amount;
      });

      amounts.sort((a, b) => a - b);
      const medianAmount = this._calculateMedian(amounts);
      const stdDeviation = this._calculateStdDeviation(
        amounts,
        totalAmount / amounts.length
      );

      return {
        totalTransactions: snapshot.size,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        averageAmount: parseFloat(
          (totalAmount / snapshot.size).toFixed(2)
        ),
        medianAmount: parseFloat(medianAmount.toFixed(2)),
        maxAmount: parseFloat(Math.max(...amounts).toFixed(2)),
        minAmount: parseFloat(Math.min(...amounts).toFixed(2)),
        stdDeviation: parseFloat(stdDeviation.toFixed(2)),
      };
    } catch (error) {
      console.error('Error calculating aggregate statistics:', error);
      throw error;
    }
  }

  /**
   * Get user spending trends over time
   * @param {string} userId - User ID
   * @param {string} period - 'week', 'month'
   * @returns {Promise<Array>} Array of { date, amount, category }
   */
  async getUserSpendingTrends(userId, period = 'month') {
    try {
      const cutoffDate = this._getCutoffDate(period);
      const snapshot = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .where('timestamp', '>=', cutoffDate)
        .orderBy('timestamp', 'asc')
        .get();

      const trends = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          date: data.timestamp.toDate().toISOString().split('T')[0],
          amount: data.amount,
          category: data.category,
          description: data.description,
        };
      });

      return trends;
    } catch (error) {
      console.error('Error getting user spending trends:', error);
      throw error;
    }
  }

  /**
   * Get engagement metrics across the platform
   * @returns {Promise<Object>}
   */
  async getPlatformEngagementMetrics() {
    try {
      const usersSnapshot = await db.collection('users').get();
      const transactionsSnapshot = await db.collection('transactions').get();
      const goalsSnapshot = await db.collection('goals').get();

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsersSnapshot = await db
        .collection('transactions')
        .where('timestamp', '>=', thirtyDaysAgo)
        .get();

      const uniqueActiveUsers = new Set(
        activeUsersSnapshot.docs.map((doc) => doc.data().userId)
      ).size;

      return {
        totalUsers: usersSnapshot.size,
        totalTransactions: transactionsSnapshot.size,
        totalGoals: goalsSnapshot.size,
        activeUsersLast30Days: uniqueActiveUsers,
        engagementRate: parseFloat(
          ((uniqueActiveUsers / usersSnapshot.size) * 100).toFixed(2)
        ),
      };
    } catch (error) {
      console.error('Error getting platform engagement metrics:', error);
      throw error;
    }
  }

  /**
   * Get category spending comparison for a user
   * @param {string} userId
   * @param {string} period
   * @returns {Promise<Array>}
   */
  async getUserCategoryBreakdown(userId, period = 'month') {
    try {
      const cutoffDate = this._getCutoffDate(period);
      const snapshot = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .where('timestamp', '>=', cutoffDate)
        .get();

      const categoryBreakdown = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const category = data.category || 'Uncategorized';
        const amount = data.amount || 0;

        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = 0;
        }
        categoryBreakdown[category] += amount;
      });

      return Object.entries(categoryBreakdown)
        .map(([category, amount]) => ({
          category,
          amount: parseFloat(amount.toFixed(2)),
        }))
        .sort((a, b) => b.amount - a.amount);
    } catch (error) {
      console.error('Error getting user category breakdown:', error);
      throw error;
    }
  }

  /**
   * Get learning path engagement metrics
   * @returns {Promise<Array>}
   */
  async getLearningPathEngagement() {
    try {
      const pathsSnapshot = await db.collection('learningPaths').get();
      const engagement = [];

      for (const pathDoc of pathsSnapshot.docs) {
        const pathId = pathDoc.id;
        const pathData = pathDoc.data();

        // Count users who accessed this path
        const userProgressSnapshot = await db
          .collection('userProgress')
          .where('pathId', '==', pathId)
          .get();

        const completionCount = userProgressSnapshot.docs.filter(
          (doc) => doc.data().completed
        ).size;

        engagement.push({
          pathId,
          pathName: pathData.title,
          totalEnrolled: userProgressSnapshot.size,
          completed: completionCount,
          completionRate: parseFloat(
            (
              (completionCount / (userProgressSnapshot.size || 1)) *
              100
            ).toFixed(2)
          ),
        });
      }

      return engagement.sort((a, b) => b.totalEnrolled - a.totalEnrolled);
    } catch (error) {
      console.error('Error getting learning path engagement:', error);
      throw error;
    }
  }

  // ============== HELPER METHODS ==============

  /**
   * Calculate cutoff date based on period
   * @private
   */
  _getCutoffDate(period) {
    const now = new Date();
    const cutoffDate = new Date();

    switch (period) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case 'all':
        cutoffDate.setFullYear(2000);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 30);
    }

    return cutoffDate;
  }

  /**
   * Calculate median of array
   * @private
   */
  _calculateMedian(arr) {
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  }

  /**
   * Calculate standard deviation
   * @private
   */
  _calculateStdDeviation(arr, mean) {
    const squareDiffs = arr.map((num) => Math.pow(num - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(avgSquareDiff);
  }
}

export default new AnalyticsService();
