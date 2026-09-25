import { describe, expect, it } from "vitest"
import { defined } from "@/test/defined"
import type { VariantAttributeValue } from "../types"
import { sortVariantGroups, toVariantChoices } from "./variantAttributeTransforms"

// Reconstructed from the live MARK3 (1dc4e27b...) `Packaging` group: 4 rows sharing 2 values,
// one ambiguous pair each, `selected` only set on one of the "1500 syringe tips" rows.
const mark3PackagingValues: VariantAttributeValue[] = [
  {
    value: "Package of 200 tips",
    selected: false,
    option: true,
    available: true,
    name: "MARK3 Mixing Tips 200/Pk. Disposable White Tips",
  },
  {
    value: "Package of 1500 syringe tips",
    selected: true,
    option: true,
    available: true,
    name: "MARK3 Mixing Tips 1500/Pk. Disposable White Tips",
  },
  {
    value: "Package of 1500 syringe tips",
    selected: false,
    option: false,
    available: true,
    name: "MARK3 Mixing Tips 1500/Pk. Disposable Multicolored Tips",
  },
  {
    value: "Package of 200 tips",
    selected: false,
    option: false,
    available: true,
    name: "MARK3 Mixing Tips 200/Pk. Disposable Multicolored Tips",
  },
]

describe("toVariantChoices", () => {
  it("folds the 4 MARK3 Packaging rows into 2 chips, each carrying both product names", () => {
    const choices = toVariantChoices(mark3PackagingValues)

    expect(choices).toHaveLength(2)
    const byValue = Object.fromEntries(choices.map((choice) => [choice.value, choice]))
    expect(byValue["Package of 200 tips"]!.names).toEqual([
      "MARK3 Mixing Tips 200/Pk. Disposable Multicolored Tips",
      "MARK3 Mixing Tips 200/Pk. Disposable White Tips",
    ])
    expect(byValue["Package of 1500 syringe tips"]!.names).toEqual([
      "MARK3 Mixing Tips 1500/Pk. Disposable Multicolored Tips",
      "MARK3 Mixing Tips 1500/Pk. Disposable White Tips",
    ])
  })

  it("keeps only the non-empty, de-duplicated names when name: null and name: 'x' rows share a value", () => {
    const values: VariantAttributeValue[] = [
      { value: "Shade A2", selected: false, option: true, available: true, name: null },
      { value: "Shade A2", selected: false, option: true, available: true, name: "A2 Universal Syringe" },
      { value: "Shade A2", selected: false, option: true, available: true, name: "A2 Universal Syringe" },
    ]

    const choice = defined(toVariantChoices(values)[0])
    expect(choice.names).toEqual(["A2 Universal Syringe"])
  })

  it("marks the choice selected when any of its rows is selected", () => {
    const values: VariantAttributeValue[] = [
      { value: "Translucent", selected: false, option: true, available: true, name: "Product A" },
      { value: "Translucent", selected: true, option: true, available: true, name: "Product B" },
    ]

    const choice = defined(toVariantChoices(values)[0])
    expect(choice.selected).toBe(true)
  })

  it("merges option/available as the most optimistic value across a choice's rows", () => {
    const values: VariantAttributeValue[] = [
      { value: "Opaque", selected: false, option: false, available: false, name: "Product A" },
      { value: "Opaque", selected: false, option: true, available: true, name: "Product B" },
    ]

    const choice = defined(toVariantChoices(values)[0])
    expect(choice.option).toBe(true)
    expect(choice.available).toBe(true)
  })

  it("sorts values numeric-aware so '8.5 gram' comes before '200 tips' and '1500 syringe tips'", () => {
    const values: VariantAttributeValue[] = [
      { value: "1500 syringe tips", selected: false, option: true, available: true, name: null },
      { value: "8.5 gram", selected: false, option: true, available: true, name: null },
      { value: "200 tips", selected: false, option: true, available: true, name: null },
    ]

    const choices = toVariantChoices(values)
    expect(choices.map((choice) => choice.value)).toEqual(["8.5 gram", "200 tips", "1500 syringe tips"])
  })

  it.each([
    ["an object", { foo: "bar" }],
    ["a string", "not-an-array"],
    ["a number", 42],
  ])("returns an empty array without throwing when values is %s instead of an array", (_label, badValues) => {
    expect(() => toVariantChoices(badValues)).not.toThrow()
    expect(toVariantChoices(badValues)).toEqual([])
  })

  it("drops rows whose value is an empty or whitespace-only string", () => {
    const values: VariantAttributeValue[] = [
      { value: "  ", selected: false, option: true, available: true, name: null },
      { value: "", selected: false, option: true, available: true, name: null },
      { value: "Shade A2", selected: false, option: true, available: true, name: null },
    ]

    expect(toVariantChoices(values).map((choice) => choice.value)).toEqual(["Shade A2"])
  })
})

describe("sortVariantGroups", () => {
  it("sorts groups by attribute name, numeric-aware", () => {
    const groups = sortVariantGroups([
      { attribute: "Packaging", values: [] },
      { attribute: "Color", values: [] },
    ])

    expect(groups.map((group) => group.attribute)).toEqual(["Color", "Packaging"])
  })

  it.each([
    ["an object", { foo: "bar" }],
    ["a string", "not-an-array"],
    ["a number", 42],
  ])("returns an empty array without throwing when groups is %s instead of an array", (_label, badGroups) => {
    expect(() => sortVariantGroups(badGroups)).not.toThrow()
    expect(sortVariantGroups(badGroups)).toEqual([])
  })
})
