from decimal import Decimal
from typing import Dict, Optional
from datetime import datetime, timedelta
from app.schemas.performance_trends import TrendQualityMetrics, TrendPaymentInfo, PaymentTier

class PaymentCalculatorV2:
    """Enhanced payment calculator with micro-payment structure and smart pricing"""
    
    def __init__(self):
        # Base payment tiers - realistic micro-payments
        self.base_payment_tiers = {
            "elite": {
                "min": Decimal("0.12"),
                "max": Decimal("0.20"),
                "multiplier": Decimal("1.5")
            },
            "verified": {
                "min": Decimal("0.08"),
                "max": Decimal("0.15"),
                "multiplier": Decimal("1.0")
            },
            "learning": {
                "min": Decimal("0.05"),
                "max": Decimal("0.10"),
                "multiplier": Decimal("0.7")
            },
            "restricted": {
                "min": Decimal("0.02"),
                "max": Decimal("0.05"),
                "multiplier": Decimal("0.3")
            }
        }
        
        # Validation payments
        self.validation_payments = {
            "base": Decimal("0.01"),
            "quality_bonus": Decimal("0.02"),
            "consensus_bonus": Decimal("0.02")
        }
        
        # Bonus structures
        self.bonuses = {
            "viral": {
                "threshold_views": 100000,
                "amount": Decimal("5.00")
            },
            "market_move": {
                "threshold_percent": 2.0,
                "amount": Decimal("25.00")
            },
            "early_detection": {
                "hours": 24,
                "multiplier": Decimal("1.5")
            },
            "category_expertise": {
                "novice": Decimal("1.0"),
                "intermediate": Decimal("1.1"),
                "expert": Decimal("1.2"),
                "master": Decimal("1.3")
            }
        }
        
        # Smart pricing factors
        self.market_conditions = {
            "high_volatility": Decimal("1.5"),
            "normal": Decimal("1.0"),
            "low_volatility": Decimal("0.8")
        }
        
        self.time_multipliers = {
            "peak_hours": Decimal("1.2"),    # 9am-5pm EST
            "off_hours": Decimal("1.0"),
            "weekend": Decimal("0.9")
        }
        
        self.category_demand = {
            "crypto": Decimal("1.3"),
            "meme_stocks": Decimal("1.2"),
            "tech": Decimal("1.1"),
            "finance": Decimal("1.0"),
            "other": Decimal("0.9")
        }
    
    def calculate_trend_submission_payment(
        self,
        user_tier: str,
        quality_metrics: TrendQualityMetrics,
        category: str,
        submission_time: datetime,
        market_volatility: str = "normal",
        user_streak: int = 0,
        category_expertise_level: str = "novice",
        is_first_detection: bool = False
    ) -> Dict:
        """Calculate payment for a trend submission with all factors"""
        
        # Get base payment range for user tier
        tier_config = self.base_payment_tiers.get(user_tier, self.base_payment_tiers["learning"])
        
        # Calculate base payment based on quality (0-1 scale)
        quality_factor = quality_metrics.overall_quality_score
        base_amount = tier_config["min"] + (tier_config["max"] - tier_config["min"]) * Decimal(str(quality_factor))
        
        # Apply tier multiplier
        base_amount *= tier_config["multiplier"]
        
        # Smart pricing adjustments
        market_multiplier = self.market_conditions.get(market_volatility, Decimal("1.0"))
        time_multiplier = self._get_time_multiplier(submission_time)
        category_multiplier = self.category_demand.get(category.lower(), Decimal("1.0"))
        
        # Category expertise bonus
        expertise_multiplier = self.bonuses["category_expertise"].get(category_expertise_level, Decimal("1.0"))
        
        # Streak bonus (up to 20% for 10+ streak)
        streak_multiplier = Decimal("1.0") + (Decimal(str(min(user_streak, 10))) * Decimal("0.02"))
        
        # Early detection bonus
        early_detection_multiplier = self.bonuses["early_detection"]["multiplier"] if is_first_detection else Decimal("1.0")
        
        # Calculate final amount
        final_amount = base_amount * market_multiplier * time_multiplier * category_multiplier * expertise_multiplier * streak_multiplier * early_detection_multiplier
        
        # Build breakdown for transparency
        breakdown = {
            "base_amount": float(base_amount),
            "adjustments": {
                "market_conditions": float(market_multiplier),
                "time_of_day": float(time_multiplier),
                "category_demand": float(category_multiplier),
                "expertise_level": float(expertise_multiplier),
                "streak_bonus": float(streak_multiplier),
                "early_detection": float(early_detection_multiplier)
            },
            "final_amount": float(final_amount),
            "potential_bonuses": {
                "viral_bonus": float(self.bonuses["viral"]["amount"]),
                "market_move_bonus": float(self.bonuses["market_move"]["amount"])
            }
        }
        
        return breakdown
    
    def calculate_validation_payment(
        self,
        validator_tier: str,
        is_quality_validation: bool = False,
        matches_consensus: bool = False
    ) -> Decimal:
        """Calculate payment for trend validation"""
        
        payment = self.validation_payments["base"]
        
        # Add quality bonus
        if is_quality_validation:
            payment += self.validation_payments["quality_bonus"]
        
        # Add consensus bonus
        if matches_consensus:
            payment += self.validation_payments["consensus_bonus"]
        
        # Apply tier multiplier
        tier_config = self.base_payment_tiers.get(validator_tier, self.base_payment_tiers["learning"])
        payment *= tier_config["multiplier"]
        
        return payment
    
    def calculate_daily_challenge_reward(self, challenge_type: str, difficulty: str) -> Decimal:
        """Calculate rewards for daily challenges"""
        
        challenge_rewards = {
            "easy": {
                "base": Decimal("0.50"),
                "completion_time_bonus": Decimal("0.10")
            },
            "medium": {
                "base": Decimal("1.00"),
                "completion_time_bonus": Decimal("0.25")
            },
            "hard": {
                "base": Decimal("2.00"),
                "completion_time_bonus": Decimal("0.50")
            }
        }
        
        return challenge_rewards.get(difficulty, challenge_rewards["easy"])["base"]
    
    def calculate_referral_rewards(
        self,
        referrer_tier: str,
        referred_user_earnings: Decimal,
        months_active: int
    ) -> Dict:
        """Calculate referral program rewards"""
        
        # Fixed reward for active referral
        signup_bonus = Decimal("2.00")
        
        # Percentage of referred user's earnings (first 3 months)
        if months_active <= 3:
            earnings_percentage = Decimal("0.10")  # 10%
            earnings_bonus = referred_user_earnings * earnings_percentage
        else:
            earnings_bonus = Decimal("0.00")
        
        # Tier bonus for referrer
        tier_multiplier = self.base_payment_tiers.get(referrer_tier, self.base_payment_tiers["learning"])["multiplier"]
        
        total_reward = (signup_bonus + earnings_bonus) * tier_multiplier
        
        return {
            "signup_bonus": float(signup_bonus),
            "earnings_bonus": float(earnings_bonus),
            "tier_multiplier": float(tier_multiplier),
            "total_reward": float(total_reward)
        }
    
    def check_bonus_eligibility(
        self,
        trend_id: str,
        views: int,
        market_move_percent: float,
        hours_since_submission: int
    ) -> Dict:
        """Check if a trend qualifies for bonuses"""
        
        bonuses_earned = {}
        
        # Viral bonus
        if views >= self.bonuses["viral"]["threshold_views"]:
            bonuses_earned["viral"] = float(self.bonuses["viral"]["amount"])
        
        # Market move bonus
        if abs(market_move_percent) >= self.bonuses["market_move"]["threshold_percent"]:
            bonuses_earned["market_move"] = float(self.bonuses["market_move"]["amount"])
        
        # Early detection (within 24 hours of trend starting)
        if hours_since_submission <= self.bonuses["early_detection"]["hours"]:
            bonuses_earned["early_detection"] = True
        
        return bonuses_earned
    
    def _get_time_multiplier(self, submission_time: datetime) -> Decimal:
        """Get time-based multiplier for smart pricing"""
        
        # EST timezone considerations
        hour = submission_time.hour
        weekday = submission_time.weekday()
        
        # Weekend
        if weekday >= 5:  # Saturday = 5, Sunday = 6
            return self.time_multipliers["weekend"]
        
        # Peak hours (9am-5pm EST)
        if 9 <= hour < 17:
            return self.time_multipliers["peak_hours"]
        
        # Off hours
        return self.time_multipliers["off_hours"]
    
    def estimate_monthly_earnings(
        self,
        user_tier: str,
        daily_submissions: int,
        daily_validations: int,
        quality_score: float = 0.7
    ) -> Dict:
        """Estimate potential monthly earnings for users"""
        
        # Average payment per submission
        tier_config = self.base_payment_tiers[user_tier]
        avg_submission_payment = (tier_config["min"] + tier_config["max"]) / 2 * tier_config["multiplier"]
        
        # Average validation payment
        avg_validation_payment = self.validation_payments["base"] * tier_config["multiplier"]
        
        # Monthly calculations (30 days)
        monthly_submission_earnings = avg_submission_payment * daily_submissions * 30
        monthly_validation_earnings = avg_validation_payment * daily_validations * 30
        
        # Estimate bonuses (conservative)
        estimated_viral_bonuses = self.bonuses["viral"]["amount"] * Decimal("0.1") * daily_submissions  # 10% go viral
        estimated_challenges = Decimal("1.00") * 20  # Complete 20 challenges/month
        
        total_monthly = monthly_submission_earnings + monthly_validation_earnings + estimated_viral_bonuses + estimated_challenges
        
        return {
            "breakdown": {
                "submissions": float(monthly_submission_earnings),
                "validations": float(monthly_validation_earnings),
                "viral_bonuses": float(estimated_viral_bonuses),
                "challenges": float(estimated_challenges)
            },
            "total_monthly": float(total_monthly),
            "daily_average": float(total_monthly / 30)
        }