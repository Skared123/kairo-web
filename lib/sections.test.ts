import { describe, expect, it } from "vitest";
import { sectionOf } from "./sections";

describe("sectionOf", () => {
  it("finds the section of each page", () => {
    expect(sectionOf("/")).toBe("today");
    expect(sectionOf("/jobs")).toBe("jobs");
    expect(sectionOf("/jobs/3f2a/edit")).toBe("jobs");
    expect(sectionOf("/criteria")).toBe("jobs");
    expect(sectionOf("/contacts/new")).toBe("contacts");
    expect(sectionOf("/learning/new")).toBe("learning");
    expect(sectionOf("/skills")).toBe("learning");
  });

  it("leaves pages outside every section, and names that only start alike", () => {
    expect(sectionOf("/password")).toBeNull();
    expect(sectionOf("/admin/users")).toBeNull();
    expect(sectionOf("/jobsearch")).toBeNull();
  });
});
