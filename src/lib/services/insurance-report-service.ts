import { INSURANCE_COMPANIES_DATA, CompanyProsCons } from '../data/insurance-advantages';

export interface ComparisonReportData {
    clientName: string;
    clientAge: number;
    smokingStatus: 'non-smoker' | 'smoker' | 'former-smoker';
    healthChanged: 'no' | 'minor' | 'significant';
    hasClaims: boolean;
    priority: 'price' | 'coverage' | 'service' | 'brand' | 'balanced';
    currentCompany: string;
    currentPremium: number;
    targetCompanies: string[];
    notes?: string;
}

export interface ReportResult {
    id: string;
    date: string;
    warnings: string[];
    comparison: Array<{
        company: string;
        estimatedPremium: number;
        savings: number;
        qualityScore: number;
        serviceScore: number;
        approvalProb: number;
        pros: string[];
        cons: string[];
        rank: number;
    }>;
    recommendation: string;
}

export const insuranceReportService = {
    /**
     * Generates a comparison report based on inputs
     */
    generateReport(data: ComparisonReportData): ReportResult {
        const warnings: string[] = [];

        // 1. Generate Warnings
        if (data.healthChanged === 'significant') {
            warnings.push('אזהרה: חל שינוי מהותי במצב הבריאותי. חיתום חדש עלול להוביל להחרגות או דחייה.');
        } else if (data.healthChanged === 'minor') {
            warnings.push('שים לב: שינוי במצב הבריאותי מחייב הצהרה מפורטת ועשוי להשפיע על תנאי הקבלה.');
        }

        if (data.clientAge > 55) {
            warnings.push('אזהרה: בגילאים מתקדמים הפרמיות בביטוחים חדשים עלולות להיות גבוהות משמעותית בשל הגיל.');
        }

        if (data.hasClaims) {
            warnings.push('שים לב: היסטוריית תביעות עשויה להקשות על מעבר בין חברות או לבטל הנחות קיימות.');
        }

        // 2. Perform Comparison
        const comparison = data.targetCompanies.map((companyName, index) => {
            const companyData = INSURANCE_COMPANIES_DATA[companyName] || {
                name: companyName,
                pros: [],
                cons: [],
                serviceScore: 50,
                claimsScore: 50,
                approvalRate: 50
            };

            // Enhanced pricing logic based on extracted discount data
            // Typical new market discounts: Phoenix/Ayalon (50-60%), Harel/Migdal (30-45%)
            let discountFactor = 0.90; // Default 10% discount
            
            if (data.priority === 'price') {
                if (companyName === 'הפניקס' || companyName === 'איילון') discountFactor = 0.55;
                else if (companyName === 'הכשרה' || companyName === 'כלל ביטוח') discountFactor = 0.65;
                else discountFactor = 0.75;
            } else {
                if (companyName === 'הפניקס' || companyName === 'איילון') discountFactor = 0.65;
                else if (companyName === 'הראל' || companyName === 'מגדל') discountFactor = 0.85;
                else discountFactor = 0.80;
            }

            // Adjust for smoking status (smokers usually pay much more, but discounts might be different)
            if (data.smokingStatus === 'smoker') {
                discountFactor *= 1.2; // Premium is higher for smokers
            }

            const estimatedPremium = Math.round(data.currentPremium * discountFactor);
            const savings = data.currentPremium - estimatedPremium;

            // Calculate overall quality score based on company data and agent priority
            let qualityScore = (companyData.serviceScore + companyData.claimsScore) / 2;
            if (data.priority === 'service') qualityScore += 10;
            if (data.priority === 'coverage') qualityScore += 5;

            return {
                company: companyName,
                estimatedPremium,
                savings,
                qualityScore: Math.min(100, qualityScore),
                serviceScore: companyData.serviceScore,
                approvalProb: companyData.approvalRate,
                pros: companyData.pros,
                cons: companyData.cons,
                rank: index + 1
            };
        });

        // Sort by quality score (or savings if price priority)
        comparison.sort((a, b) => {
            if (data.priority === 'price') return b.savings - a.savings;
            return b.qualityScore - a.qualityScore;
        });

        // 3. Recommendation logic
        const bestOption = comparison[0];
        let recommendation = `מומלץ לבחון מעבר לחברת ${bestOption.company} `;
        if (data.priority === 'price') {
            recommendation += `לצורך חיסכון מוערך של כ-₪${bestOption.savings} בחודש.`;
        } else {
            recommendation += `בשל איכות שירות וכיסויים גבוהה יותר המתאימה להעדפות הלקוח.`;
        }

        return {
            id: `REP-${Date.now()}`,
            date: new Date().toISOString(),
            warnings,
            comparison,
            recommendation
        };
    },

    /**
     * Formats the report for WhatsApp sharing
     */
    formatForWhatsApp(data: ComparisonReportData, result: ReportResult): string {
        const best = result.comparison[0];
        return `*דוח השוואת ביטוח עבור ${data.clientName}*
-------------------------
מצב קיים: ${data.currentCompany} - ₪${data.currentPremium} לחודש.

*הצעה מומלצת: ${best.company}*
עלות מוערכת: ₪${best.estimatedPremium}
חיסכון חודשי: ₪${best.savings}
חיסכון שנתי: ₪${best.savings * 12}

*יתרונות מרכזיים:*
${best.pros.slice(0, 2).map(p => `• ${p}`).join('\n')}

*הערה מקצועית:* המעבר כפוף לחיתום והצהרת בריאות.
-------------------------
הופק באמצעות מגן זהב CRM`;
    }
};
