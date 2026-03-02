import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLatestEventKey, updateEventKey } from "../lib/storage";
import { getEventKey, setEventKey } from "../lib/config";

// Mock fetch
global.fetch = vi.fn();

describe("dynamic config and caching", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        setEventKey('2026cahal'); // Reset to default
    });

    it("should fetch the latest event key from API and update local state", async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ eventKey: "2024caln" }),
        });

        const key = await getLatestEventKey();

        expect(key).toBe("2024caln");
        expect(getEventKey()).toBe("2024caln");
        expect(localStorage.getItem('scout_event_key')).toBe("2024caln");
    });

    it("should fallback to cached key if API fails", async () => {
        localStorage.setItem('scout_event_key', '2025test');
        // Trigger internal state update from localStorage
        setEventKey('2025test');

        (fetch as any).mockRejectedValue(new Error("Network error"));

        const key = await getLatestEventKey();

        expect(key).toBe("2025test");
        expect(getEventKey()).toBe("2025test");
    });

    it("should update event key via API", async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
        });

        const success = await updateEventKey("2024new", "16782473");

        expect(success).toBe(true);
        expect(getEventKey()).toBe("2024new");
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/config/event-key'), expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ eventKey: "2024new", password: "16782473" })
        }));
    });
});
