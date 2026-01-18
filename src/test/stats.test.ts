import { describe, it, expect } from "vitest";
import { calculateTeamStatsFromEntries } from "../lib/stats";
import { ScoutingEntry } from "../lib/types";

describe("stats calculation", () => {
    it("should calculate mean correctly", () => {
        const mockEntries: Partial<ScoutingEntry>[] = [
            { teamNumber: 2473, autoCycles: 2, teleopCycles: 10 },
            { teamNumber: 2473, autoCycles: 4, teleopCycles: 20 },
            { teamNumber: 2473, autoCycles: 6, teleopCycles: 30 },
        ];

        const stats = calculateTeamStatsFromEntries(mockEntries as ScoutingEntry[]);

        expect(stats).not.toBeNull();
        if (stats) {
            // Auto Cycles: (2+4+6)/3 = 4
            expect(stats.meanAutoCycles).toBe(4);
            expect(stats.avgAutoCycles).toBe(4);

            // Teleop Cycles: (10+20+30)/3 = 20
            expect(stats.meanTeleopCycles).toBe(20);
            expect(stats.avgTeleopCycles).toBe(20);
        }
    });

    it("should round mean to one decimal place", () => {
        const mockEntries: Partial<ScoutingEntry>[] = [
            { teamNumber: 2473, autoCycles: 1, teleopCycles: 1 },
            { teamNumber: 2473, autoCycles: 2, teleopCycles: 2 },
        ];

        const stats = calculateTeamStatsFromEntries(mockEntries as ScoutingEntry[]);

        expect(stats).not.toBeNull();
        if (stats) {
            // (1+2)/2 = 1.5
            expect(stats.meanAutoCycles).toBe(1.5);
            expect(stats.meanTeleopCycles).toBe(1.5);
        }
    });
});
