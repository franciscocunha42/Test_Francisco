import { describe, it, expect } from "vitest";
import { parseGuestCsv } from "@/lib/utils/csv";

const validCsv = `first_name,last_name,email,party_name
Alice,Smith,alice@example.com,Smith Family
Bob,Jones,,Jones Family
Charlie,Brown,charlie@example.com,`;

const missingNameCsv = `first_name,last_name,email
,Smith,test@example.com
Alice,Jones,alice@example.com`;

describe("parseGuestCsv", () => {
  it("parses valid CSV with correct row count", () => {
    const { data, errors } = parseGuestCsv(validCsv);
    expect(data).toHaveLength(3);
    expect(errors).toHaveLength(0);
  });

  it("sets first and last name correctly", () => {
    const { data } = parseGuestCsv(validCsv);
    expect(data[0].first_name).toBe("Alice");
    expect(data[0].last_name).toBe("Smith");
    expect(data[0].email).toBe("alice@example.com");
  });

  it("returns undefined for empty optional fields", () => {
    const { data } = parseGuestCsv(validCsv);
    expect(data[1].email).toBeUndefined();
    expect(data[2].party_name).toBeUndefined();
  });

  it("reports errors for rows missing required fields", () => {
    const { data, errors } = parseGuestCsv(missingNameCsv);
    expect(errors.length).toBeGreaterThan(0);
    expect(data).toHaveLength(1); // only Alice Jones
    expect(data[0].first_name).toBe("Alice");
  });

  it("handles empty CSV gracefully", () => {
    const { data, errors } = parseGuestCsv("first_name,last_name\n");
    expect(data).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });
});
