/**
 * Analytics Routes
 * REST API endpoints for analytics, predictions, and insights
 */

import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import analyticsService from '../services/analyticsService.js';
import predictionService from '../services/predictionService.js';
import aiAnalyticsService from '../services/aiAnalyticsService.js';

const router = express.Router();

// ============== PATTERN ANALYTICS ENDPOINTS ==============

/**
 * GET /analytics/summary
 * Global analytics summary (requires admin)
 */
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const period = req.query.period || 'month';

    const [
      mostActiveUsers,
      peakTimes,
      popularCategories,
      platformMetrics,
      learningEngagement,
    ] = await Promise.all([
      analyticsService.getMostActiveUsers(10, period),
      analyticsService.getPeakActivityTimes(period),
      analyticsService.getPopularCategories(period, 10),
      analyticsService.getPlatformEngagementMetrics(),
      analyticsService.getLearningPathEngagement(),
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      period,
      summary: {
        mostActiveUsers,
        peakActivity: {
          peakHour: peakTimes.peakHour,
          peakDay: peakTimes.peakDay,
          hourlyBreakdown: peakTimes.hourly,
          dailyBreakdown: peakTimes.daily,
        },
        topCategories: popularCategories,
        platformEngagement: platformMetrics,
        learningPathEngagement,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

/**
 * GET /analytics/user/:userId
 * User-specific analytics and trends
 */
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const period = req.query.period || 'month';

    // Verify user can only access their own data
    if (req.user.uid !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [statistics, categoryBreakdown, trends] = await Promise.all([
      analyticsService.getAggregateStatistics(userId, period),
      analyticsService.getUserCategoryBreakdown(userId, period),
      analyticsService.getUserSpendingTrends(userId, period),
    ]);

    res.json({
      userId,
      period,
      timestamp: new Date().toISOString(),
      analytics: {
        statistics,
        categoryBreakdown,
        trends,
      },
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

/**
 * GET /analytics/categories
 * Popular categories across platform
 */
router.get('/categories', verifyToken, async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const limit = parseInt(req.query.limit) || 10;

    const categories = await analyticsService.getPopularCategories(period, limit);

    res.json({
      period,
      timestamp: new Date().toISOString(),
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /analytics/engagement
 * Platform engagement metrics
 */
router.get('/engagement', verifyToken, async (req, res) => {
  try {
    const metrics = await analyticsService.getPlatformEngagementMetrics();

    res.json({
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    res.status(500).json({ error: 'Failed to fetch engagement metrics' });
  }
});

/**
 * GET /analytics/learning-paths
 * Learning path engagement
 */
router.get('/learning-paths', verifyToken, async (req, res) => {
  try {
    const engagement = await analyticsService.getLearningPathEngagement();

    res.json({
      timestamp: new Date().toISOString(),
      engagement,
    });
  } catch (error) {
    console.error('Error fetching learning path engagement:', error);
    res.status(500).json({ error: 'Failed to fetch learning path data' });
  }
});

// ============== PREDICTION ENDPOINTS ==============

/**
 * GET /analytics/predictions/churn-risk
 * Users at risk of churning
 */
router.get('/predictions/churn-risk', verifyToken, async (req, res) => {
  try {
    const daysInactive = parseInt(req.query.days) || 30;

    const churnRiskUsers = await predictionService.detectChurnRisk(daysInactive);

    res.json({
      timestamp: new Date().toISOString(),
      criteria: {
        inactiveDays: daysInactive,
        totalUsersAtRisk: churnRiskUsers.length,
      },
      users: churnRiskUsers,
    });
  } catch (error) {
    console.error('Error predicting churn risk:', error);
    res.status(500).json({ error: 'Failed to predict churn risk' });
  }
});

/**
 * GET /analytics/predictions/anomalies/:userId
 * Detect unusual spending for user
 */
router.get('/predictions/anomalies/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    // Verify authorization
    if (req.user.uid !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const anomalies = await predictionService.detectAnomalies(userId, {
      month: month != null ? Number(month) : undefined,
      year: year != null ? Number(year) : undefined,
    });

    res.json({
      userId,
      timestamp: new Date().toISOString(),
      anomaliesDetected: anomalies.length,
      anomalies,
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

/**
 * GET /analytics/predictions/category/:userId
 * Predict next spending category
 */
router.get('/predictions/category/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const predictions = await predictionService.predictNextCategory(userId);

    res.json({
      userId,
      timestamp: new Date().toISOString(),
      predictions,
    });
  } catch (error) {
    console.error('Error predicting next category:', error);
    res.status(500).json({ error: 'Failed to predict category' });
  }
});

/**
 * GET /analytics/predictions/monthly-spending/:userId
 * Predict user's monthly spending
 */
router.get('/predictions/monthly-spending/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const prediction = await predictionService.predictMonthlySpending(userId);

    res.json({
      userId,
      timestamp: new Date().toISOString(),
      prediction,
    });
  } catch (error) {
    console.error('Error predicting monthly spending:', error);
    res.status(500).json({ error: 'Failed to predict spending' });
  }
});

/**
 * GET /analytics/predictions/goals
 * Predict goal achievement
 */
router.get('/predictions/goals', verifyToken, async (req, res) => {
  try {
    const predictions = await predictionService.predictGoalAchievement();

    res.json({
      timestamp: new Date().toISOString(),
      predictions,
    });
  } catch (error) {
    console.error('Error predicting goal achievement:', error);
    res.status(500).json({ error: 'Failed to predict goals' });
  }
});

/**
 * GET /analytics/predictions/pattern-changes/:userId
 * Detect spending pattern changes
 */
router.get('/predictions/pattern-changes/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    if (req.user.uid !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const changes = await predictionService.detectSpendingPatternChanges(userId, {
      month: month != null ? Number(month) : undefined,
      year: year != null ? Number(year) : undefined,
    });

    res.json({
      userId,
      timestamp: new Date().toISOString(),
      changesDetected: changes.length,
      changes,
    });
  } catch (error) {
    console.error('Error detecting pattern changes:', error);
    res.status(500).json({ error: 'Failed to detect pattern changes' });
  }
});

// ============== AI-ASSISTED ANALYTICS ENDPOINTS ==============

/**
 * GET /analytics/insights/spending/:userId
 * AI-powered spending insights
 */
router.get('/insights/spending/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    if (req.user.uid !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const insights = await aiAnalyticsService.getUserSpendingInsights(userId, {
      month: month != null ? Number(month) : undefined,
      year: year != null ? Number(year) : undefined,
    });

    res.json(insights);
  } catch (error) {
    console.error('Error generating spending insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

/**
 * GET /analytics/insights/budget/:userId
 * AI-powered budget optimization recommendations
 */
router.get('/insights/budget/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const recommendations =
      await aiAnalyticsService.getBudgetOptimizationRecommendations(userId);

    res.json({
      userId,
      timestamp: new Date().toISOString(),
      recommendations,
    });
  } catch (error) {
    console.error('Error generating budget recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * GET /analytics/insights/learning/:userId
 * AI-powered learning recommendations
 */
router.get('/insights/learning/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const recommendations =
      await aiAnalyticsService.getPersonalizedLearningRecommendations(userId);

    res.json(recommendations);
  } catch (error) {
    console.error('Error generating learning recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * GET /analytics/insights/education-plan/:userId
 * Generate personalized financial education plan
 */
router.get('/insights/education-plan/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const plan = await aiAnalyticsService.generateFinancialEducationPlan(userId);

    res.json(plan);
  } catch (error) {
    console.error('Error generating education plan:', error);
    res.status(500).json({ error: 'Failed to generate education plan' });
  }
});

/**
 * GET /analytics/insights/market
 * AI-powered market/category insights (admin only)
 */
router.get('/insights/market', verifyToken, async (req, res) => {
  try {
    // Check admin status
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const insights = await aiAnalyticsService.getCategoryMarketInsights();

    res.json(insights);
  } catch (error) {
    console.error('Error generating market insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

/**
 * GET /analytics/insights/fraud
 * Fraud pattern detection (admin only)
 */
router.get('/insights/fraud', verifyToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const patterns = await aiAnalyticsService.detectFraudPatterns();

    res.json({
      timestamp: new Date().toISOString(),
      suspiciousPatternsDetected: patterns.length,
      patterns,
    });
  } catch (error) {
    console.error('Error detecting fraud:', error);
    res.status(500).json({ error: 'Failed to detect fraud' });
  }
});

// ============== HEALTH CHECK ==============

/**
 * GET /analytics/health
 * Analytics service health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'analytics',
    timestamp: new Date().toISOString(),
  });
});

export default router;
