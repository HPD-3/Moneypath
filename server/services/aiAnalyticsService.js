/**
 * AI Analytics Service - AI-Assisted Predictions & Insights
 * Integrates with external AI models (OpenAI, Anthropic Claude, etc.)
 * for deeper analysis and personalized recommendations
 */

import axios from 'axios';
import { db } from '../firebaseAdmin.js';
import analyticsService from './analyticsService.js';
import predictionService from './predictionService.js';

class AIAnalyticsService {
  constructor() {
    // Configure AI provider (examples provided)
    this.aiProvider = (process.env.AI_PROVIDER || 'local').toLowerCase(); // 'gemini', 'openai', 'anthropic', 'local'
    this.aiApiKey = process.env.AI_API_KEY;
  }

  /**
   * Get AI-powered spending insights for a user
   * Analyzes patterns and provides actionable recommendations
   * @param {string} userId
   * @param {Object} [options]
   * @param {number|string} [options.month] 1-12
   * @param {number|string} [options.year] full year (e.g. 2026)
   * @returns {Promise<Object>}
   */
  async getUserSpendingInsights(userId, options = {}) {
    try {
      // Gather user data
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      const trends = await analyticsService.getUserSpendingTrends(
        userId,
        'month',
        options
      );
      const categoryBreakdown = await analyticsService.getUserCategoryBreakdown(
        userId,
        'month',
        options
      );
      const anomalies = await predictionService.detectAnomalies(userId);
      const monthlyPrediction = await predictionService.predictMonthlySpending(
        userId
      );
      const patternChanges =
        await predictionService.detectSpendingPatternChanges(userId);

      // Create structured prompt for AI
      const prompt = this._createAnalysisPrompt({
        userName: userData?.name || 'User',
        trends,
        categoryBreakdown,
        anomalies,
        monthlyPrediction,
        patternChanges,
      });

      // Call AI provider
      const aiResponse = await this._callAIProvider(prompt);

      return {
        userId,
        generatedAt: new Date().toISOString(),
        analysis: aiResponse,
        rawData: {
          period: {
            month: options?.month != null ? Number(options.month) : null,
            year: options?.year != null ? Number(options.year) : null,
          },
          categoryBreakdown,
          monthlyPrediction,
          anomaliesDetected: anomalies.length,
          patternChangesDetected: patternChanges.length,
        },
      };
    } catch (error) {
      console.error('Error getting AI spending insights:', error);
      // Fallback: return basic analysis if AI fails
      return this._getFallbackAnalysis(userId);
    }
  }

  /**
   * Get AI-powered recommendations for budget optimization
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getBudgetOptimizationRecommendations(userId) {
    try {
      const stats = await analyticsService.getAggregateStatistics(userId, 'month');
      const categoryBreakdown = await analyticsService.getUserCategoryBreakdown(
        userId,
        'month'
      );
      const anomalies = await predictionService.detectAnomalies(userId);

      const prompt = `
Analyze this user's spending and provide 3-5 specific, actionable budget optimization recommendations.

Monthly Spending Statistics:
- Total Spending: $${stats.totalAmount}
- Average Transaction: $${stats.averageAmount}
- Transactions: ${stats.totalTransactions}
- Standard Deviation: $${stats.stdDeviation}

Spending by Category:
${categoryBreakdown.map((cat) => `- ${cat.category}: $${cat.amount}`).join('\n')}

Detected Anomalies: ${anomalies.length} unusual transactions

For each recommendation:
1. Identify specific category or behavior to optimize
2. Explain why this matters
3. Provide concrete action step
4. Estimate potential savings

Format as JSON array with fields: category, issue, recommendation, estimatedSavings
      `;

      const aiResponse = await this._callAIProvider(prompt);

      // Parse AI response into structured format
      return this._parseRecommendations(aiResponse);
    } catch (error) {
      console.error('Error getting budget optimization recommendations:', error);
      return [];
    }
  }

  /**
   * Get AI-powered insights about learning path engagement
   * Analyzes user progress and provides personalized learning recommendations
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getPersonalizedLearningRecommendations(userId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      // Get user's learning progress
      const progressSnapshot = await db
        .collection('userProgress')
        .where('userId', '==', userId)
        .get();

      const progress = progressSnapshot.docs.map((doc) => ({
        ...doc.data(),
        pathId: doc.id,
      }));

      // Get completed quizzes
      const quizSnapshot = await db
        .collection('quizResults')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      const quizResults = quizSnapshot.docs.map((doc) => doc.data());

      const prompt = `
Analyze this user's learning engagement and provide personalized recommendations.

User Profile:
- Name: ${userData.name}
- Account Age: ${new Date(userData.createdAt.toDate()).toLocaleDateString()}

Learning Progress:
${progress.map((p) => `- Path: ${p.pathId}, Completed: ${p.completed}, Score: ${p.score}%`).join('\n')}

Recent Quiz Results (last 10):
${quizResults.map((q) => `- Score: ${q.score}%, Topics: ${q.topics?.join(', ') || 'N/A'}`).join('\n')}

Provide:
1. Current engagement level assessment
2. Strengths and areas to improve
3. 3 specific learning paths to recommend next
4. Tips to increase engagement
5. Estimated time to achieve learning goals

Format clearly with sections and actionable advice.
      `;

      const aiResponse = await this._callAIProvider(prompt);

      return {
        userId,
        generatedAt: new Date().toISOString(),
        recommendations: aiResponse,
        progressSummary: {
          totalPathsEnrolled: progress.length,
          pathsCompleted: progress.filter((p) => p.completed).length,
          averageQuizScore: (
            quizResults.reduce((sum, q) => sum + (q.score || 0), 0) /
            Math.max(quizResults.length, 1)
          ).toFixed(1),
        },
      };
    } catch (error) {
      console.error('Error getting personalized learning recommendations:', error);
      return { error: 'Unable to generate recommendations' };
    }
  }

  /**
   * Detect fraud patterns using AI
   * Analyzes multiple dimensions of suspicious activity
   * @returns {Promise<Array>}
   */
  async detectFraudPatterns() {
    try {
      // Get recent transactions across all users
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const snapshot = await db
        .collection('transactions')
        .where('timestamp', '>=', thirtyDaysAgo)
        .limit(1000)
        .get();

      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp.toDate(),
      }));

      // Group by user for pattern analysis
      const userPatterns = {};
      transactions.forEach((t) => {
        if (!userPatterns[t.userId]) {
          userPatterns[t.userId] = [];
        }
        userPatterns[t.userId].push(t);
      });

      // Create prompt with suspicious patterns
      const suspiciousPatterns = Object.entries(userPatterns)
        .map(([userId, userTransactions]) => {
          const highValue = userTransactions.filter((t) => t.amount > 1000);
          const repeatedCategories = this._findRepeatedPatterns(
            userTransactions
          );

          return {
            userId,
            transactionCount: userTransactions.length,
            highValueCount: highValue.length,
            repeatedPatterns: repeatedCategories,
            maxAmount: Math.max(...userTransactions.map((t) => t.amount)),
          };
        })
        .filter((p) => p.highValueCount > 0 || p.repeatedPatterns.length > 0)
        .slice(0, 20); // Limit to top 20

      const prompt = `
Analyze these suspicious transaction patterns for potential fraud:

${JSON.stringify(suspiciousPatterns, null, 2)}

For each user, provide:
1. Fraud risk score (0-100)
2. Specific suspicious patterns detected
3. Recommended action (monitor, investigate, flag)
4. Confidence level in assessment

Format as JSON array with fields: userId, riskScore, suspiciousPatterns, recommendedAction, confidence
      `;

      const aiResponse = await this._callAIProvider(prompt);
      return this._parseFraudAnalysis(aiResponse);
    } catch (error) {
      console.error('Error detecting fraud patterns:', error);
      return [];
    }
  }

  /**
   * Get AI-powered market/category insights
   * Analyzes spending trends across categories
   * @returns {Promise<Object>}
   */
  async getCategoryMarketInsights() {
    try {
      const categories =
        await analyticsService.getPopularCategories('month', 20);
      const platformMetrics = await analyticsService.getPlatformEngagementMetrics();

      const prompt = `
Analyze these spending category insights and market trends:

Platform Statistics:
- Total Users: ${platformMetrics.totalUsers}
- Active Users (30d): ${platformMetrics.activeUsersLast30Days}
- Engagement Rate: ${platformMetrics.engagementRate}%
- Total Transactions: ${platformMetrics.totalTransactions}

Top Spending Categories:
${categories.map((cat, i) => `${i + 1}. ${cat.category}: $${cat.totalAmount} (${cat.count} transactions, Avg: $${cat.averageAmount})`).join('\n')}

Provide:
1. Category performance ranking and trends
2. Emerging vs declining categories
3. User preferences insights
4. Opportunities for new categories or features
5. Market segmentation recommendations

Format clearly with analysis and actionable insights.
      `;

      const aiResponse = await this._callAIProvider(prompt);

      return {
        generatedAt: new Date().toISOString(),
        insights: aiResponse,
        categoryStats: categories,
        platformMetrics,
      };
    } catch (error) {
      console.error('Error getting category market insights:', error);
      return { error: 'Unable to generate insights' };
    }
  }

  /**
   * Generate customized financial education recommendations
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async generateFinancialEducationPlan(userId) {
    try {
      const userData = await db.collection('users').doc(userId).get();
      const spendingStats = await analyticsService.getAggregateStatistics(
        userId,
        'month'
      );
      const categoryBreakdown = await analyticsService.getUserCategoryBreakdown(
        userId,
        'month'
      );
      const churnRisk = await predictionService.detectChurnRisk(30);
      const isAtRisk = churnRisk.some((u) => u.userId === userId);

      const prompt = `
Create a personalized financial education and improvement plan for this user.

User Profile:
- Name: ${userData.data().name}
- Member Since: ${new Date(userData.data().createdAt.toDate()).toLocaleDateString()}
- At Risk Status: ${isAtRisk ? 'Inactive' : 'Active'}

Current Financial Behavior:
- Monthly Spending: $${spendingStats.totalAmount}
- Average Transaction: $${spendingStats.averageAmount}
- Transaction Count: ${spendingStats.totalTransactions}
- Top Categories: ${categoryBreakdown.slice(0, 3).map((c) => c.category).join(', ')}

Create a 4-week personalized learning and improvement plan:
1. Week 1: Focus area (1-2 topics)
2. Week 2: Skill development
3. Week 3: Practice and application
4. Week 4: Review and optimization

For each week provide:
- Learning objectives
- Recommended resources/content
- Practical exercises
- Expected outcomes

Also include:
- Financial goals to set
- Metrics to track progress
- Tools to use for improvement
      `;

      const aiResponse = await this._callAIProvider(prompt);

      return {
        userId,
        generatedAt: new Date().toISOString(),
        educationPlan: aiResponse,
        currentMetrics: {
          monthlySpending: spendingStats.totalAmount,
          topCategories: categoryBreakdown.slice(0, 5),
        },
      };
    } catch (error) {
      console.error('Error generating financial education plan:', error);
      return { error: 'Unable to generate plan' };
    }
  }

  // ============== HELPER METHODS ==============

  /**
   * Call AI provider API
   * @private
   */
  async _callAIProvider(prompt) {
    try {
      if (!this.aiApiKey && this.aiProvider !== 'local') {
        return this._getLocalAnalysis(prompt);
      }

      if (this.aiProvider === 'gemini') return await this._callGemini(prompt);
      if (this.aiProvider === 'openai') return await this._callOpenAI(prompt);
      if (this.aiProvider === 'anthropic') return await this._callAnthropic(prompt);

      // Fallback: return structured template
      return this._getLocalAnalysis(prompt);
    } catch (error) {
      console.error('AI provider call failed:', error);
      return this._getLocalAnalysis(prompt);
    }
  }

  /**
   * Call Google Gemini API
   * @private
   */
  async _callGemini(prompt) {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.aiApiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const text =
      response?.data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .filter(Boolean)
        .join('') || '';

    return text || this._getLocalAnalysis(prompt);
  }

  /**
   * Call OpenAI API
   * @private
   */
  async _callOpenAI(prompt) {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a financial analytics expert providing actionable insights on spending patterns and financial behavior.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${this.aiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * Call Anthropic Claude API
   * @private
   */
  async _callAnthropic(prompt) {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system:
          'You are a financial analytics expert providing actionable insights on spending patterns and financial behavior.',
      },
      {
        headers: {
          'x-api-key': this.aiApiKey,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    return response.data.content[0].text;
  }

  /**
   * Local AI analysis (fallback when API unavailable)
   * @private
   */
  _getLocalAnalysis(prompt) {
    // Returns structured template responses
    if (prompt.includes('spending insights')) {
      return `Based on your spending patterns, here are key insights:

1. **Primary Spending Categories**: Your top spending is concentrated in a few categories. Consider tracking these more closely.

2. **Transaction Frequency**: Your average transaction amount and frequency suggest consistent spending habits.

3. **Opportunities**: 
   - Review discretionary spending in secondary categories
   - Set category-specific budgets based on your patterns
   - Consider automating savings from consistent transaction patterns

4. **Recommendations**:
   - Establish a monthly budget based on your 3-month average
   - Track unusual spending spikes proactively
   - Review subscriptions and recurring charges monthly`;
    }

    if (prompt.includes('budget optimization')) {
      return JSON.stringify([
        {
          category: 'Top Category',
          issue: 'Highest spending concentration',
          recommendation: 'Review and set a category budget limit',
          estimatedSavings: 50,
        },
        {
          category: 'Discretionary',
          issue: 'Variable spending patterns',
          recommendation: 'Implement weekly review and approval process',
          estimatedSavings: 30,
        },
      ]);
    }

    return 'Analysis generated. Please configure AI provider (OpenAI or Anthropic) for detailed insights.';
  }

  /**
   * Create analysis prompt from user data
   * @private
   */
  _createAnalysisPrompt(data) {
    return `
Analyze this user's spending behavior and provide comprehensive insights.

User: ${data.userName}

Spending Trends (Last 30 Days):
- Total transactions analyzed: ${data.trends.length}

Top Categories:
${data.categoryBreakdown.slice(0, 5).map((cat) => `- ${cat.category}: $${cat.amount}`).join('\n')}

Spending Forecast:
- Predicted monthly spending: $${data.monthlyPrediction.predictedMonthlySpending}
- Trend: ${data.monthlyPrediction.trendDirection}
- Recommended budget: $${data.monthlyPrediction.recommendedBudget}

Anomalies Detected: ${data.anomalies.length}
${data.anomalies.slice(0, 3).map((a) => `- $${a.amount} in ${a.category}: ${a.reasons.join(', ')}`).join('\n')}

Pattern Changes:
${data.patternChanges.slice(0, 3).map((p) => `- ${p.category}: ${p.changeType} (${p.percentageChange}%)`).join('\n')}

Based on this data, provide:
1. Summary of spending patterns and behavior
2. Key insights about financial health
3. Top 3 recommendations for improvement
4. Potential risks or concerns
5. Positive trends to continue

Format the response clearly with sections and actionable advice.
    `;
  }

  /**
   * Parse AI recommendations into structured format
   * @private
   */
  _parseRecommendations(aiResponse) {
    // If response is already JSON, parse it
    if (aiResponse.includes('{')) {
      try {
        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse recommendations:', e);
      }
    }

    // Return default recommendations if parsing fails
    return [
      {
        category: 'Budget Review',
        issue: 'Spending patterns need attention',
        recommendation: 'Establish monthly budgets by category',
        estimatedSavings: 100,
      },
    ];
  }

  /**
   * Parse fraud analysis response
   * @private
   */
  _parseFraudAnalysis(aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse fraud analysis:', e);
    }
    return [];
  }

  /**
   * Find repeated transaction patterns
   * @private
   */
  _findRepeatedPatterns(transactions) {
    const patterns = {};
    transactions.forEach((t) => {
      const key = `${t.category}|${Math.round(t.amount / 100) * 100}`;
      patterns[key] = (patterns[key] || 0) + 1;
    });

    return Object.entries(patterns)
      .filter(([_, count]) => count >= 3)
      .map(([pattern, count]) => ({ pattern, frequency: count }));
  }

  /**
   * Get fallback analysis if AI fails
   * @private
   */
  async _getFallbackAnalysis(userId) {
    try {
      const stats = await analyticsService.getAggregateStatistics(userId, 'month');
      const categoryBreakdown = await analyticsService.getUserCategoryBreakdown(
        userId,
        'month'
      );

      const topCats = categoryBreakdown.slice(0, 2).map((c) => c.category).join(', ');

      return {
        userId,
        generatedAt: new Date().toISOString(),
        analysis:
          `Analysis Summary: User spent $${stats.totalAmount} across ${stats.totalTransactions} transactions.` +
          ` Top spending categories: ${topCats || 'N/A'}.` +
          ` Average transaction: $${stats.averageAmount}.` +
          ` For detailed AI-powered insights, please configure your AI provider.`,
        rawData: {
          categoryBreakdown,
          totalSpending: stats.totalAmount,
        },
      };
    } catch (e) {
      console.error('Fallback analysis failed:', e);
      return {
        userId,
        generatedAt: new Date().toISOString(),
        analysis:
          'Analysis generated. (Fallback mode) Not enough data or service temporarily unavailable.',
        rawData: null,
      };
    }
  }
}

export default new AIAnalyticsService();
