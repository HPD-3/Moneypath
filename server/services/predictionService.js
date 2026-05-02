/**
 * Prediction Service - Rule-Based Predictions
 * Handles: Churn risk, anomaly detection, behavioral patterns, future activity predictions
 */

import { db } from '../firebaseAdmin.js';

class PredictionService {
  /**
   * Detect users at risk of churning (inactivity)
   * Churn = no transactions in 30 days
   * @param {number} daysInactive - Days without activity to consider as churn risk
   * @returns {Promise<Array>}
   */
  async detectChurnRisk(daysInactive = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      // Get all users
      const usersSnapshot = await db.collection('users').get();
      const churnRiskUsers = [];

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Get last transaction
        const lastTransactionSnapshot = await db
          .collection('transactions')
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();

        let lastActivity = userData.createdAt || new Date(0);

        if (!lastTransactionSnapshot.empty) {
          lastActivity = lastTransactionSnapshot.docs[0].data().timestamp.toDate();
        }

        // Check if user is inactive
        if (lastActivity < cutoffDate) {
          const daysSinceActivity = Math.floor(
            (new Date() - lastActivity) / (1000 * 60 * 60 * 24)
          );

          churnRiskUsers.push({
            userId,
            userName: userData.name,
            email: userData.email,
            lastActivityDate: lastActivity.toISOString().split('T')[0],
            daysSinceActivity,
            churnRiskScore: this._calculateChurnScore(daysSinceActivity),
            createdAt: userData.createdAt
              ? userData.createdAt.toDate().toISOString()
              : null,
          });
        }
      }

      // Sort by churn score (highest = highest risk)
      return churnRiskUsers.sort((a, b) => b.churnRiskScore - a.churnRiskScore);
    } catch (error) {
      console.error('Error detecting churn risk:', error);
      throw error;
    }
  }

  /**
   * Detect unusual spending behavior (anomalies)
   * Rules: 
   * - Spending > 2x average
   * - Category not usual for user
   * - Frequency spike
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async detectAnomalies(userId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get user's transaction history
      const snapshot = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .where('timestamp', '>=', thirtyDaysAgo)
        .orderBy('timestamp', 'desc')
        .get();

      if (snapshot.empty) {
        return [];
      }

      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp.toDate(),
      }));

      // Calculate statistics
      const amounts = transactions.map((t) => t.amount);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const stdDev = this._calculateStdDeviation(amounts, avgAmount);

      // Get user's typical categories
      const categoryFrequency = {};
      transactions.forEach((t) => {
        const cat = t.category || 'Uncategorized';
        categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
      });

      const typicalCategories = Object.keys(categoryFrequency);

      // Detect anomalies
      const anomalies = [];

      transactions.forEach((transaction) => {
        const anomalyReasons = [];

        // Rule 1: High spending (> mean + 2*stdDev)
        if (transaction.amount > avgAmount + 2 * stdDev) {
          anomalyReasons.push(
            `High spending (${(transaction.amount / avgAmount).toFixed(1)}x average)`
          );
        }

        // Rule 2: Unusual category
        if (
          !typicalCategories.includes(transaction.category) &&
          categoryFrequency[transaction.category] < 2
        ) {
          anomalyReasons.push(`Unusual category: ${transaction.category}`);
        }

        // Rule 3: Time-based anomaly (weekend vs weekday pattern change)
        const dayOfWeek = transaction.date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        // If user typically doesn't spend on weekends but does now, flag it
        const weekendTransactions = transactions.filter((t) => {
          const d = t.date.getDay();
          return d === 0 || d === 6;
        }).length;
        if (weekendTransactions < 2 && isWeekend) {
          anomalyReasons.push('Unusual time (weekend spending)');
        }

        if (anomalyReasons.length > 0) {
          anomalies.push({
            transactionId: transaction.id,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description,
            date: transaction.date.toISOString(),
            avgUserSpending: parseFloat(avgAmount.toFixed(2)),
            anomalyScore: this._calculateAnomalyScore(
              transaction.amount,
              avgAmount,
              stdDev
            ),
            reasons: anomalyReasons,
          });
        }
      });

      return anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore);
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  /**
   * Predict next spending category based on user patterns
   * Uses frequency and recency of categories
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async predictNextCategory(userId) {
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const snapshot = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .where('timestamp', '>=', sixtyDaysAgo)
        .orderBy('timestamp', 'desc')
        .get();

      if (snapshot.empty) {
        return [];
      }

      const transactions = snapshot.docs.map((doc) => ({
        ...doc.data(),
        date: doc.data().timestamp.toDate(),
      }));

      // Calculate category scores based on frequency and recency
      const categoryScores = {};

      transactions.forEach((transaction, index) => {
        const category = transaction.category || 'Uncategorized';
        const recencyWeight = 1 / (index + 1); // Recent transactions weighted higher
        const score = (categoryScores[category] || 0) + recencyWeight;
        categoryScores[category] = score;
      });

      // Convert to predictions
      const predictions = Object.entries(categoryScores)
        .map(([category, score]) => {
          const categoryTransactions = transactions.filter(
            (t) => (t.category || 'Uncategorized') === category
          );
          return {
            category,
            predictionScore: parseFloat((score / transactions.length).toFixed(3)),
            frequency: categoryTransactions.length,
            avgAmount: parseFloat(
              (
                categoryTransactions.reduce((sum, t) => sum + t.amount, 0) /
                categoryTransactions.length
              ).toFixed(2)
            ),
            lastUsed: categoryTransactions[0].date.toISOString().split('T')[0],
          };
        })
        .sort((a, b) => b.predictionScore - a.predictionScore)
        .slice(0, 5);

      return predictions;
    } catch (error) {
      console.error('Error predicting next category:', error);
      throw error;
    }
  }

  /**
   * Predict user's spending for next 30 days
   * Based on historical average and trends
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async predictMonthlySpending(userId) {
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const snapshot = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .where('timestamp', '>=', sixtyDaysAgo)
        .get();

      if (snapshot.empty) {
        return {
          error: 'Insufficient data for prediction',
          minimumDataRequired: 5,
          transactionsFound: 0,
        };
      }

      const transactions = snapshot.docs.map((doc) => ({
        ...doc.data(),
        date: doc.data().timestamp.toDate(),
      }));

      // Split into two 30-day periods
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recent30 = transactions.filter((t) => t.date >= thirtyDaysAgo);
      const previous30 = transactions.filter(
        (t) => t.date < thirtyDaysAgo && t.date >= sixtyDaysAgo
      );

      const recent30Total = recent30.reduce((sum, t) => sum + t.amount, 0);
      const previous30Total = previous30.reduce((sum, t) => sum + t.amount, 0);

      // Calculate trend
      const trend =
        previous30Total > 0
          ? (recent30Total - previous30Total) / previous30Total
          : 0;

      // Predict next month
      const baseline = (recent30Total + previous30Total) / 2;
      const predictedSpending = baseline * (1 + trend);

      return {
        predictedMonthlySpending: parseFloat(predictedSpending.toFixed(2)),
        baselineAverage: parseFloat(baseline.toFixed(2)),
        trend: parseFloat((trend * 100).toFixed(1)), // percentage change
        trendDirection: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        confidence:
          transactions.length >= 20
            ? 'high'
            : transactions.length >= 10
              ? 'medium'
              : 'low',
        recent30DaysTotal: parseFloat(recent30Total.toFixed(2)),
        previous30DaysTotal: parseFloat(previous30Total.toFixed(2)),
        recommendedBudget: parseFloat((predictedSpending * 1.1).toFixed(2)), // 10% buffer
      };
    } catch (error) {
      console.error('Error predicting monthly spending:', error);
      throw error;
    }
  }

  /**
   * Identify users likely to achieve goals
   * Based on spending patterns and goal amounts
   * @returns {Promise<Array>}
   */
  async predictGoalAchievement() {
    try {
      const goalsSnapshot = await db
        .collection('goals')
        .where('status', '!=', 'completed')
        .get();

      const goalPredictions = [];

      for (const goalDoc of goalsSnapshot.docs) {
        const goal = goalDoc.data();
        const userId = goal.userId;

        // Get user's savings history
        const savingsSnapshot = await db
          .collection('tabungan')
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(30)
          .get();

        if (savingsSnapshot.empty) {
          continue;
        }

        const savings = savingsSnapshot.docs.map((doc) => ({
          amount: doc.data().amount,
          date: doc.data().timestamp.toDate(),
        }));

        const totalSaved = savings.reduce((sum, s) => sum + s.amount, 0);
        const dailyAverage = totalSaved / Math.max(savings.length, 1);
        const targetAmount = goal.targetAmount;
        const currentAmount = goal.currentAmount || 0;
        const amountNeeded = Math.max(0, targetAmount - currentAmount);

        const daysNeeded =
          dailyAverage > 0 ? Math.ceil(amountNeeded / dailyAverage) : Infinity;
        const deadlineDate = goal.targetDate ? new Date(goal.targetDate) : null;
        const daysUntilDeadline = deadlineDate
          ? Math.floor((deadlineDate - new Date()) / (1000 * 60 * 60 * 24))
          : Infinity;

        const achievementProbability =
          daysNeeded <= daysUntilDeadline ? 0.9 : 0.3;

        goalPredictions.push({
          goalId: goalDoc.id,
          goalName: goal.name,
          targetAmount,
          currentAmount,
          progressPercentage: parseFloat(
            ((currentAmount / targetAmount) * 100).toFixed(1)
          ),
          dailyAverageSavings: parseFloat(dailyAverage.toFixed(2)),
          daysNeeded: daysNeeded === Infinity ? null : daysNeeded,
          daysUntilDeadline: daysUntilDeadline === Infinity ? null : daysUntilDeadline,
          achievementProbability: parseFloat(
            (achievementProbability * 100).toFixed(0)
          ),
          recommendation:
            achievementProbability >= 0.8
              ? 'On track to achieve'
              : achievementProbability >= 0.5
                ? 'Needs acceleration'
                : 'At risk',
        });
      }

      return goalPredictions.sort(
        (a, b) => b.achievementProbability - a.achievementProbability
      );
    } catch (error) {
      console.error('Error predicting goal achievement:', error);
      throw error;
    }
  }

  /**
   * Detect spending pattern changes
   * Compare this week vs last week spending by category
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async detectSpendingPatternChanges(userId) {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(today.getDate() - 14);

      // Get last two weeks
      const snapshot = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .where('timestamp', '>=', fourteenDaysAgo)
        .get();

      if (snapshot.empty) {
        return [];
      }

      const transactions = snapshot.docs.map((doc) => ({
        ...doc.data(),
        date: doc.data().timestamp.toDate(),
      }));

      const thisWeek = transactions.filter((t) => t.date >= sevenDaysAgo);
      const lastWeek = transactions.filter(
        (t) => t.date < sevenDaysAgo && t.date >= fourteenDaysAgo
      );

      // Calculate by category
      const getByCategory = (trans) => {
        const byCategory = {};
        trans.forEach((t) => {
          const cat = t.category || 'Uncategorized';
          byCategory[cat] = (byCategory[cat] || 0) + t.amount;
        });
        return byCategory;
      };

      const thisWeekByCategory = getByCategory(thisWeek);
      const lastWeekByCategory = getByCategory(lastWeek);

      const allCategories = new Set([
        ...Object.keys(thisWeekByCategory),
        ...Object.keys(lastWeekByCategory),
      ]);

      const changes = [];

      allCategories.forEach((category) => {
        const lastWeekAmount = lastWeekByCategory[category] || 0;
        const thisWeekAmount = thisWeekByCategory[category] || 0;

        if (lastWeekAmount === 0 && thisWeekAmount > 0) {
          changes.push({
            category,
            changeType: 'new_category',
            thisWeekAmount,
            lastWeekAmount: 0,
            percentageChange: null,
            changeAmount: thisWeekAmount,
          });
        } else if (lastWeekAmount > 0 && thisWeekAmount === 0) {
          changes.push({
            category,
            changeType: 'category_abandoned',
            thisWeekAmount: 0,
            lastWeekAmount,
            percentageChange: null,
            changeAmount: -lastWeekAmount,
          });
        } else if (lastWeekAmount > 0 && thisWeekAmount > 0) {
          const percentChange =
            ((thisWeekAmount - lastWeekAmount) / lastWeekAmount) * 100;
          if (Math.abs(percentChange) > 25) {
            changes.push({
              category,
              changeType: percentChange > 0 ? 'increase' : 'decrease',
              thisWeekAmount: parseFloat(thisWeekAmount.toFixed(2)),
              lastWeekAmount: parseFloat(lastWeekAmount.toFixed(2)),
              percentageChange: parseFloat(percentChange.toFixed(1)),
              changeAmount: parseFloat((thisWeekAmount - lastWeekAmount).toFixed(2)),
            });
          }
        }
      });

      return changes.sort(
        (a, b) => Math.abs(b.percentageChange || 0) - Math.abs(a.percentageChange || 0)
      );
    } catch (error) {
      console.error('Error detecting spending pattern changes:', error);
      throw error;
    }
  }

  // ============== HELPER METHODS ==============

  /**
   * Calculate churn score (0-100)
   * @private
   */
  _calculateChurnScore(daysSinceActivity) {
    // Linear scale: 0 at 0 days, 100 at 60 days
    return Math.min(100, (daysSinceActivity / 60) * 100);
  }

  /**
   * Calculate anomaly score (0-100)
   * @private
   */
  _calculateAnomalyScore(amount, mean, stdDev) {
    if (stdDev === 0) return 0;
    const zScore = Math.abs((amount - mean) / stdDev);
    return Math.min(100, zScore * 10); // Normalize to 0-100 scale
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

export default new PredictionService();
