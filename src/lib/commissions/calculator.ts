// Types for commission calculation
export type ProductType = 'life' | 'health' | 'pension' | 'keren_hishtalmut' | 'pension_transfer' | 'manager_insurance' | 'investment' | 'finance' | 'elementary' | 'platinum_service';

export interface DealData {
    id: string;
    productType: ProductType;
    company: string;
    monthlyPremium?: number;       // For Insurance
    salary?: number;               // For Pension Transfer (ניוד)
    accumulatedAmount?: number;    // For Pension/Keren Hishtalmut (צבירה)
    startDate: Date;
    status: 'active' | 'cancelled' | 'pending';
    opsStatus?: string;            // סטטוס תפעול - חובה "פוליסה הופקה" לחישוב
    cancellationDate?: Date;
    agentName?: string;
    clientName?: string;
    clientId?: string;
}

export interface CommissionResult {
    heikefCommission: number;      // עמלת היקף
    nifraaimCommission: number;    // עמלת נפרעים (חודשי)
    tzviraCommission: number;      // עמלת צבירה
    niudCommission: number;        // עמלת ניוד
    totalOneTime: number;          // סה"כ חד פעמי
    totalMonthly: number;          // סה"כ חודשי
    clawbackAmount: number;        // החזר עמלה (ביטול)
    currency: 'ILS';
    notes: string[];
    breakdown: CommissionBreakdown;
    // Backwards compatibility
    oneTimeCommission: number;
    monthlyCommission: number;
}

export interface CommissionBreakdown {
    type: string;
    formula: string;
    values: Record<string, number>;
}

export interface AgentSalaryMix {
    userId: string;
    agentName: string;
    basePercentage: number;        // אחוז בסיס מהעמלות (למשל 40%)
    heikefPercentage: number;      // אחוז מעמלת היקף
    nifraaimPercentage: number;    // אחוז מעמלת נפרעים
    tzviraPercentage: number;      // אחוז מעמלת צבירה
    niudPercentage: number;        // אחוז מעמלת ניוד
}

export class CommissionCalculator {
    // --- קבועים לפי הדרישות ---
    
    // ביטוח: עמלת היקף = פרמיה × 9.7
    private static INSURANCE_HEIKEF_MULTIPLIER = 9.7;
    
    // ביטוח: עמלת נפרעים = 23% מהפרמיה החודשית
    private static INSURANCE_NIFRAIM_PERCENTAGE = 0.23;
    
    // פנסיה: על כל 1,000,000 ₪ צבירה = 3,000 ₪ עמלה
    private static PENSION_TZVIRA_RATE = 3000;
    private static PENSION_TZVIRA_THRESHOLD = 1000000;
    
    // קרן השתלמות: על כל 1,000,000 ₪ = 7,000 ₪ עמלה
    private static KEREN_TZVIRA_RATE = 7000;
    private static KEREN_TZVIRA_THRESHOLD = 1000000;
    
    // ניוד פנסיה: משכורת × 12 × 0.008
    private static PENSION_NIUD_MULTIPLIER = 0.008;

    /**
     * חישוב עמלות - מופעל רק כאשר סטטוס תפעול = "פוליסה הופקה"
     */
    static calculate(deal: DealData): CommissionResult {
        const result: CommissionResult = {
            heikefCommission: 0,
            nifraaimCommission: 0,
            tzviraCommission: 0,
            niudCommission: 0,
            totalOneTime: 0,
            totalMonthly: 0,
            clawbackAmount: 0,
            currency: 'ILS',
            notes: [],
            breakdown: {
                type: '',
                formula: '',
                values: {}
            },
            // Backwards compatibility
            oneTimeCommission: 0,
            monthlyCommission: 0
        };

        // בדיקה: עמלות מחושבות רק כאשר סטטוס תפעול = "פוליסה הופקה"
        const validOpsStatuses = ['policy_issued', 'פוליסה הופקה', 'issued'];
        if (deal.opsStatus && !validOpsStatuses.includes(deal.opsStatus)) {
            result.notes.push('⏳ העמלה תחושב לאחר הפקת הפוליסה');
            return result;
        }

        switch (deal.productType) {
            case 'life':
            case 'health':
            case 'elementary':
                this.calculateInsuranceCommission(deal, result);
                break;
            case 'pension':
                this.calculatePensionCommission(deal, result);
                break;
            case 'keren_hishtalmut':
                this.calculateKerenCommission(deal, result);
                break;
            case 'pension_transfer':
                this.calculatePensionTransferCommission(deal, result);
                break;
            case 'manager_insurance':
            case 'investment':
            case 'finance':
                this.calculateFinanceCommission(deal, result);
                break;
            case 'platinum_service':
                this.calculatePlatinumCommission(deal, result);
                break;
        }

        // חישוב סיכומים
        result.totalOneTime = result.heikefCommission + result.tzviraCommission + result.niudCommission;
        result.totalMonthly = result.nifraaimCommission;
        
        // Backwards compatibility
        result.oneTimeCommission = result.totalOneTime;
        result.monthlyCommission = result.totalMonthly;

        // חישוב החזר עמלה (clawback) במקרה של ביטול
        if (deal.status === 'cancelled' && deal.cancellationDate) {
            this.calculateClawback(deal, result);
        }

        return result;
    }

    /**
     * חישוב עמלות ביטוח (חיים, בריאות, אלמנטרי)
     * עמלת היקף = פרמיה × 9.7
     * עמלת נפרעים = 23% מהפרמיה החודשית
     */
    private static calculateInsuranceCommission(deal: DealData, result: CommissionResult) {
        if (!deal.monthlyPremium || deal.monthlyPremium <= 0) {
            result.notes.push('❌ חסרה פרמיה חודשית לחישוב');
            return;
        }

        const premium = deal.monthlyPremium;

        // עמלת היקף
        result.heikefCommission = premium * this.INSURANCE_HEIKEF_MULTIPLIER;
        
        // עמלת נפרעים
        result.nifraaimCommission = premium * this.INSURANCE_NIFRAIM_PERCENTAGE;

        result.breakdown = {
            type: 'ביטוח',
            formula: `עמלת היקף: ${premium} × ${this.INSURANCE_HEIKEF_MULTIPLIER} = ₪${result.heikefCommission.toFixed(2)}\nעמלת נפרעים: ${premium} × ${this.INSURANCE_NIFRAIM_PERCENTAGE * 100}% = ₪${result.nifraaimCommission.toFixed(2)}`,
            values: {
                premium,
                heikefMultiplier: this.INSURANCE_HEIKEF_MULTIPLIER,
                nifraaimPercentage: this.INSURANCE_NIFRAIM_PERCENTAGE
            }
        };

        result.notes.push(`✅ עמלת היקף: ₪${premium.toLocaleString()} × 9.7 = ₪${result.heikefCommission.toLocaleString()}`);
        result.notes.push(`✅ עמלת נפרעים (חודשי): 23% × ₪${premium.toLocaleString()} = ₪${result.nifraaimCommission.toLocaleString()}`);
    }

    /**
     * חישוב עמלות פנסיה (צבירה)
     * על כל 1,000,000 ₪ צבירה = 3,000 ₪ עמלה
     */
    private static calculatePensionCommission(deal: DealData, result: CommissionResult) {
        if (!deal.accumulatedAmount || deal.accumulatedAmount <= 0) {
            // אם אין צבירה, ננסה לחשב לפי ניוד
            if (deal.salary && deal.salary > 0) {
                this.calculatePensionTransferCommission(deal, result);
            } else {
                result.notes.push('❌ חסר סכום צבירה או משכורת לחישוב עמלת פנסיה');
            }
            return;
        }

        const accumulated = deal.accumulatedAmount;
        const millions = accumulated / this.PENSION_TZVIRA_THRESHOLD;
        
        result.tzviraCommission = millions * this.PENSION_TZVIRA_RATE;

        result.breakdown = {
            type: 'פנסיה - צבירה',
            formula: `(${accumulated.toLocaleString()} ÷ 1,000,000) × ₪3,000 = ₪${result.tzviraCommission.toFixed(2)}`,
            values: {
                accumulatedAmount: accumulated,
                millions,
                ratePerMillion: this.PENSION_TZVIRA_RATE
            }
        };

        result.notes.push(`✅ עמלת צבירה פנסיה: ₪${accumulated.toLocaleString()} = ${millions.toFixed(2)} מיליון × ₪3,000 = ₪${result.tzviraCommission.toLocaleString()}`);
    }

    /**
     * חישוב עמלות קרן השתלמות (צבירה)
     * על כל 1,000,000 ₪ = 7,000 ₪ עמלה
     */
    private static calculateKerenCommission(deal: DealData, result: CommissionResult) {
        if (!deal.accumulatedAmount || deal.accumulatedAmount <= 0) {
            result.notes.push('❌ חסר סכום צבירה לחישוב עמלת קרן השתלמות');
            return;
        }

        const accumulated = deal.accumulatedAmount;
        const millions = accumulated / this.KEREN_TZVIRA_THRESHOLD;
        
        result.tzviraCommission = millions * this.KEREN_TZVIRA_RATE;

        result.breakdown = {
            type: 'קרן השתלמות - צבירה',
            formula: `(${accumulated.toLocaleString()} ÷ 1,000,000) × ₪7,000 = ₪${result.tzviraCommission.toFixed(2)}`,
            values: {
                accumulatedAmount: accumulated,
                millions,
                ratePerMillion: this.KEREN_TZVIRA_RATE
            }
        };

        result.notes.push(`✅ עמלת צבירה קרן השתלמות: ₪${accumulated.toLocaleString()} = ${millions.toFixed(2)} מיליון × ₪7,000 = ₪${result.tzviraCommission.toLocaleString()}`);
    }

    /**
     * חישוב עמלות ניוד פנסיה
     * משכורת × 12 × 0.008 = עמלה
     */
    private static calculatePensionTransferCommission(deal: DealData, result: CommissionResult) {
        if (!deal.salary || deal.salary <= 0) {
            result.notes.push('❌ חסרה משכורת לחישוב עמלת ניוד');
            return;
        }

        const salary = deal.salary;
        const annualSalary = salary * 12;
        
        result.niudCommission = annualSalary * this.PENSION_NIUD_MULTIPLIER;

        result.breakdown = {
            type: 'ניוד פנסיה',
            formula: `₪${salary.toLocaleString()} × 12 × 0.008 = ₪${result.niudCommission.toFixed(2)}`,
            values: {
                monthlySalary: salary,
                annualSalary,
                multiplier: this.PENSION_NIUD_MULTIPLIER
            }
        };

        result.notes.push(`✅ עמלת ניוד: ₪${salary.toLocaleString()} × 12 × 0.008 = ₪${result.niudCommission.toLocaleString()}`);
    }

    /**
     * חישוב עמלות כתב שירות פלטינום
     * עמלה חד-פעמית = פרמיה חודשית × 3
     * עמלת נפרעים = 45% מהפרמיה (30% לדנטל)
     */
    private static calculatePlatinumCommission(deal: DealData, result: CommissionResult) {
        if (!deal.monthlyPremium || deal.monthlyPremium <= 0) {
            result.notes.push('❌ חסרה פרמיה חודשית לחישוב עמלת פלטינום');
            return;
        }

        const monthlyPremium = deal.monthlyPremium;
        
        // בדיקה אם זה דנטל (אפשר להעביר מידע נוסף דרך deal)
        // נבדוק אם יש מאפיין מיוחד או נשתמש בברירת מחדל של 45%
        const isDental = (deal as any).platinumProductName === 'פלטינום דנטל';
        const nifraaimRate = isDental ? 0.30 : 0.45;

        // עמלה חד-פעמית = פרמיה × 3
        result.heikefCommission = monthlyPremium * 3;
        
        // עמלת נפרעים = 45% או 30% מהפרמיה החודשית
        result.nifraaimCommission = monthlyPremium * nifraaimRate;

        result.breakdown = {
            type: 'כתב שירות פלטינום',
            formula: `חד-פעמי: ₪${monthlyPremium} × 3 = ₪${result.heikefCommission.toFixed(2)} | נפרעים: ₪${monthlyPremium} × ${nifraaimRate * 100}% = ₪${result.nifraaimCommission.toFixed(2)}/חודש`,
            values: {
                monthlyPremium,
                oneTimeMultiplier: 3,
                nifraaimRate: nifraaimRate * 100,
                isDental: isDental ? 1 : 0
            }
        };

        result.notes.push(`✅ עמלת פלטינום חד-פעמית: ₪${monthlyPremium.toLocaleString()} × 3 = ₪${result.heikefCommission.toLocaleString()}`);
        result.notes.push(`✅ עמלת נפרעים פלטינום: ₪${monthlyPremium.toLocaleString()} × ${nifraaimRate * 100}% = ₪${result.nifraaimCommission.toLocaleString()}/חודש`);
    }

    /**
     * חישוב עמלות פיננסים (ביטוח מנהלים, השקעות)
     */
    private static calculateFinanceCommission(deal: DealData, result: CommissionResult) {
        // אם יש משכורת - חשב כניוד
        if (deal.salary && deal.salary > 0) {
            this.calculatePensionTransferCommission(deal, result);
        }
        // אם יש צבירה - חשב כפנסיה
        else if (deal.accumulatedAmount && deal.accumulatedAmount > 0) {
            this.calculatePensionCommission(deal, result);
        }
        // אם יש פרמיה - חשב כביטוח
        else if (deal.monthlyPremium && deal.monthlyPremium > 0) {
            this.calculateInsuranceCommission(deal, result);
        }
        else {
            result.notes.push('❌ חסרים נתונים לחישוב עמלה');
        }
    }

    /**
     * חישוב החזר עמלה (Clawback) במקרה של ביטול פוליסה
     */
    private static calculateClawback(deal: DealData, result: CommissionResult) {
        if (!deal.cancellationDate) return;

        const diffTime = Math.abs(deal.cancellationDate.getTime() - deal.startDate.getTime());
        const monthsActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

        let clawbackPercent = 0;

        if (deal.productType === 'life' || deal.productType === 'health') {
            // כללי ביטול ביטוח חיים/בריאות
            if (monthsActive <= 12) {
                clawbackPercent = 1.0; // 100%
            } else if (monthsActive <= 24) {
                clawbackPercent = 0.6; // 60%
            } else if (monthsActive <= 36) {
                clawbackPercent = 0.4; // 40%
            }
        } else {
            // כללי ביטול פנסיה/פיננסים - שנה אחת
            if (monthsActive <= 12) {
                clawbackPercent = 1.0;
            }
        }

        if (clawbackPercent > 0) {
            result.clawbackAmount = result.totalOneTime * clawbackPercent;
            result.notes.push(`⚠️ ביטול פוליסה אחרי ${monthsActive} חודשים: החזר ${clawbackPercent * 100}% = ₪${result.clawbackAmount.toLocaleString()}`);
        }
    }

    /**
     * חישוב עמלה לסוכן לפי תמהיל שכר
     */
    static calculateAgentCommission(totalResult: CommissionResult, agentMix: AgentSalaryMix): CommissionResult {
        const agentResult: CommissionResult = {
            heikefCommission: totalResult.heikefCommission * (agentMix.heikefPercentage / 100),
            nifraaimCommission: totalResult.nifraaimCommission * (agentMix.nifraaimPercentage / 100),
            tzviraCommission: totalResult.tzviraCommission * (agentMix.tzviraPercentage / 100),
            niudCommission: totalResult.niudCommission * (agentMix.niudPercentage / 100),
            totalOneTime: 0,
            totalMonthly: 0,
            clawbackAmount: totalResult.clawbackAmount * (agentMix.basePercentage / 100),
            currency: 'ILS',
            notes: [`👤 עמלות ${agentMix.agentName} (תמהיל: ${agentMix.basePercentage}%)`],
            breakdown: totalResult.breakdown,
            oneTimeCommission: 0,
            monthlyCommission: 0
        };

        agentResult.totalOneTime = agentResult.heikefCommission + agentResult.tzviraCommission + agentResult.niudCommission;
        agentResult.totalMonthly = agentResult.nifraaimCommission;
        agentResult.oneTimeCommission = agentResult.totalOneTime;
        agentResult.monthlyCommission = agentResult.totalMonthly;

        return agentResult;
    }

    /**
     * קבועים לייצוא
     */
    static get RATES() {
        return {
            INSURANCE_HEIKEF_MULTIPLIER: this.INSURANCE_HEIKEF_MULTIPLIER,
            INSURANCE_NIFRAIM_PERCENTAGE: this.INSURANCE_NIFRAIM_PERCENTAGE,
            PENSION_TZVIRA_RATE: this.PENSION_TZVIRA_RATE,
            KEREN_TZVIRA_RATE: this.KEREN_TZVIRA_RATE,
            PENSION_NIUD_MULTIPLIER: this.PENSION_NIUD_MULTIPLIER
        };
    }
}
