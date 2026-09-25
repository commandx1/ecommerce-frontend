import {
  FULFILLMENT_POLICY_DAYS,
  getFulfillmentPolicyDayUnit,
  getFulfillmentPolicyValue,
  parseFulfillmentPolicyDays,
} from "../../lib/fulfillment-policy"
import { FieldError, type FieldGroupProps, LABEL_CLASS } from "../field-styles"
import TextField from "../TextField"
import MoneyField from "./MoneyField"

type ListingFieldsProps = Omit<FieldGroupProps, "locked">

/** Pricing & Inventory for a new or resubmitted product: the listing half of the review DTO. */
export default function ListingFields({ values, errors, onInputChange }: ListingFieldsProps) {
  return (
    <div className="border-t border-border-soft pt-6 mt-6">
      <h3 className="text-lg font-semibold text-brand mb-4">Pricing & Inventory</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TextField
          name="skuCode"
          label="SKU Code *"
          value={values.skuCode}
          error={errors.skuCode}
          onChange={onInputChange}
          placeholder="e.g., SKU-12345"
        />

        <MoneyField name="price" label="Price *" value={values.price} error={errors.price} onChange={onInputChange} />
        <MoneyField
          name="stock"
          label="Stock *"
          value={values.stock}
          error={errors.stock}
          step="1"
          onChange={onInputChange}
        />
        <MoneyField
          name="shipmentFee"
          label="Shipment Fee *"
          value={values.shipmentFee}
          error={errors.shipmentFee}
          onChange={onInputChange}
        />
        <MoneyField
          name="heavyShippingSurcharge"
          label="Heavy Shipping Fee *"
          value={values.heavyShippingSurcharge}
          error={errors.heavyShippingSurcharge}
          onChange={onInputChange}
        />

        <div>
          <label htmlFor="fulfillmentPolicy" className={LABEL_CLASS}>
            Fulfillment Policy *
          </label>
          <div
            className={`flex min-h-12 flex-wrap items-center gap-3 rounded-lg border bg-surface-elevated px-4 py-3 text-sm ${errors.fulfillmentPolicy ? "border-destructive" : "border-border-soft"}`}
          >
            <span className="text-text-primary">Ships within</span>
            <select
              id="fulfillmentPolicy"
              name="fulfillmentPolicy"
              value={values.fulfillmentPolicy}
              onChange={onInputChange}
              className="h-8 rounded-md border border-border-soft bg-surface-elevated px-2 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Select</option>
              {FULFILLMENT_POLICY_DAYS.map((days) => (
                <option key={days} value={getFulfillmentPolicyValue(days)}>
                  {days}
                </option>
              ))}
            </select>
            <span className="text-text-primary">
              {getFulfillmentPolicyDayUnit(parseFulfillmentPolicyDays(values.fulfillmentPolicy))}
            </span>
          </div>
          <FieldError message={errors.fulfillmentPolicy} />
        </div>

        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="exportPackaging"
              checked={values.exportPackaging}
              onChange={onInputChange}
              className="w-5 h-5 text-brand border-border-soft rounded focus:ring-ring/50"
            />
            <span className="ml-3 text-sm font-medium text-text-primary">Export Packaging</span>
          </label>
        </div>
      </div>
    </div>
  )
}
