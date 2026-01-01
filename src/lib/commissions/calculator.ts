export type ProductType = 'life' | 'health' | 'pension' | 'manager_insurance' | 'investment' | 'finance';

export interface DealData {
    id: string;
    productType: ProductType;
    company: string; // e.g., 'Harel', 'Menora'
    monthlyPremium?: number; // For Insurance
    salary?: number; // For Pension/Managers (Niud)
    accumulatedAmount?: number; // For Pension (Tzvira)
    startDate: Date;
    status: 'active' | 'cancelled';
    cancellationDate?: Date;
}

export interface CommissionResult {
    oneTimeCommission: number; // Heikef / Niud
    monthlyCommission: number; // Nifraims
    clawbackAmount: number; // If cancelled, how much to return
    currency: 'ILS';
    notes: string[];
}

export class CommissionCalculator {

    // --- Constants ---
    private static INSURANCE_HEIKEF_MULTIPLIER = 9.6;
    private static INSURANCE_NIFRAIMS_PERCENTAGE = 0.20;
    private static PENSION_NIUD_PERCENTAGE = 0.08;
    private static PENSION_TZVIRA_RATE = 3000; // Per 1M
    private static PENSION_TZVIRA_THRESHOLD = 1000000; // 1M

    static calculate(deal: DealData): CommissionResult {
        const result: CommissionResult = {
            oneTimeCommission: 0,
            monthlyCommission: 0,
            clawbackAmount: 0,
            currency: 'ILS',
            notes: []
        };

        switch (deal.productType) {
            case 'life':
            case 'health':
                this.calculateInsurance(deal, result);
                break;
            case 'pension':
            case 'manager_insurance':
            case 'investment':
            case 'finance':
                this.calculateFinance(deal, result);
                break;
        }

        // Calculate Clawback if cancelled
        if (deal.status === 'cancelled' && deal.cancellationDate) {
            this.calculateClawback(deal, result);
        }

        return result;
    }

    private static calculateInsurance(deal: DealData, result: CommissionResult) {
        if (!deal.monthlyPremium) return;

        // 1. Heikef (One-time)
        result.oneTimeCommission = deal.monthlyPremium * this.INSURANCE_HEIKEF_MULTIPLIER;
        result.notes.push(`עמלת היקף: ${deal.monthlyPremium} * ${this.INSURANCE_HEIKEF_MULTIPLIER}`);

        // 2. Nifraims (Monthly)
        result.monthlyCommission = deal.monthlyPremium * this.INSURANCE_NIFRAIMS_PERCENTAGE;
        result.notes.push(`עמלת נפרעים (חודשי): 20% מתוך ${deal.monthlyPremium}`);
    }

    private static calculateFinance(deal: DealData, result: CommissionResult) {
        // 1. Niud (Portability) - Based on Salary
        if (deal.salary) {
            // Salary * 12 * 8%
            const niudCommission = deal.salary * 12 * this.PENSION_NIUD_PERCENTAGE;
            result.oneTimeCommission += niudCommission;
            result.notes.push(`עמלת ניוד: משכורת ${deal.salary} * 12 * 8% = ${niudCommission.toFixed(2)}`);
        }

        // 2. Tzvira (Accumulation) - Per Company Threshold
        if (deal.accumulatedAmount) {
            // Check if passed threshold (logic here assumes 'deal' is a single policy, 
            // verifying aggregate company totals would happen at a higher service level, 
            // but for this calculator we calculate the POTENTIAL commission if eligible)

            if (deal.accumulatedAmount >= this.PENSION_TZVIRA_THRESHOLD) {
                const millions = Math.floor(deal.accumulatedAmount / 1000000);
                const tzviraCommission = millions * this.PENSION_TZVIRA_RATE;

                // If there's a remainder or exact calculation needed, logic can be adjusted. 
                // Request said: "3,000 per 1,000,000". implies steps.

                result.oneTimeCommission += tzviraCommission;
                result.notes.push(`עמלת צבירה: ${millions} מיליון צבורים בחברת ${deal.company} = ${tzviraCommission}`);
            } else {
                result.notes.push(`צבירה (${deal.accumulatedAmount}) נמוכה מסף מיליון בחברת ${deal.company} - אין עמלה.`);
            }
        }
    }

    private static calculateClawback(deal: DealData, result: CommissionResult) {
        if (!deal.cancellationDate) return;

        // Calculate months active
        const diffTime = Math.abs(deal.cancellationDate.getTime() - deal.startDate.getTime());
        const monthsActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

        let clawbackPercent = 0;

        if (deal.productType === 'life') {
            // Life Insurance Rules
            if (monthsActive <= 12) {
                clawbackPercent = 1.0; // 100%
            } else if (monthsActive <= 24) {
                clawbackPercent = 0.6; // 60%
            } else if (monthsActive <= 36) {
                clawbackPercent = 0.4; // 40%
            }
        } else if (deal.productType === 'health') {
            // Health Insurance Rules (1 year)
            if (monthsActive <= 12) {
                clawbackPercent = 1.0;
            }
        } else {
            // Pension/Finance Rules (1 year)
            if (monthsActive <= 12) {
                clawbackPercent = 1.0;
            }
        }

        if (clawbackPercent > 0) {
            // Clawback applies to the ONE-TIME commission paid (Heikef/Niud/Tzvira)
            // It does NOT usually apply to Nifraims (as they just stop being paid), 
            // but sometimes unearned bonuses are clawed back. 
            // Assuming standard model: Return the Heikef/Acquisition fee.

            // Note: We use the calculated oneTimeCommission from above as the basis.
            result.clawbackAmount = result.oneTimeCommission * clawbackPercent;
            result.notes.push(`ביטול פוליסה אחרי ${monthsActive} חודשים: החזר עמלה של ${clawbackPercent * 100}%`);
        }
    }
}
