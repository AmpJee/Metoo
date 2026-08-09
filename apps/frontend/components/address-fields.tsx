'use client'

import { PROVINCES } from '@metoo/shared'
import { useEffect, useState } from 'react'
import { districtsForProvince } from '@/app/actions/address'
import { Field } from '@/components/auth-shell'
import { useLocale, useT } from '@/components/i18n-provider'
import { Input } from '@/components/ui/input'
import type { AddressDistrict } from '@/lib/types'

const SELECT_CLASS =
  'flex h-10 w-full rounded-lg bg-input px-3 text-sm disabled:opacity-50'

/** The four field names, which differ between the shop and delivery forms. */
export interface AddressFieldNames {
  subdistrict: string
  district: string
  province: string
  postalCode: string
}

export interface AddressValues {
  subdistrict: string
  district: string
  province: string
  postalCode: string
}

/**
 * The Thai name for a province, whatever it was stored as.
 *
 * Every option here carries the Thai name as its value, so a row holding
 * "Bangkok" — which is what the seed and every pre-picker signup wrote —
 * matches no option and renders as an empty select. Silently blanking a
 * shop's province the moment they open settings is the worst version of
 * that: they save something unrelated and lose it.
 *
 * Returns the input unchanged when it matches nothing, so a genuinely odd
 * value stays visible as a problem rather than being erased.
 */
function canonicalProvince(stored: string): string {
  if (!stored) return ''

  const needle = stored.trim().toLowerCase()
  const match = PROVINCES.find(
    (entry) => entry.th === stored.trim() || entry.en.toLowerCase() === needle
  )
  return match ? match.th : stored
}

/**
 * Province → district → sub-district → postcode, as four linked controls.
 *
 * Shared by the shop address and the delivery address. Both ask the same four
 * questions and both got them wrong the same way when they were free text —
 * a misspelt แขวง is found by a courier standing outside the wrong building.
 * Two copies of this would drift the first time one of them gained a rule.
 *
 * Controlled rather than `defaultValue`: choosing a province has to clear
 * what sits below it, and a postcode has to appear without being typed.
 * Neither is expressible with an uncontrolled input.
 */
export function AddressFields({
  names,
  initial,
}: {
  names: AddressFieldNames
  initial: AddressValues
}) {
  const t = useT()
  const locale = useLocale()

  const [province, setProvince] = useState(() =>
    canonicalProvince(initial.province)
  )
  const [district, setDistrict] = useState(initial.district)
  const [subDistrict, setSubDistrict] = useState(initial.subdistrict)
  const [postalCode, setPostalCode] = useState(initial.postalCode)
  const [districts, setDistricts] = useState<AddressDistrict[]>([])
  const [loading, setLoading] = useState(false)

  // A saved address opens with its province already chosen, so the selects
  // below it need their options before anyone touches the form.
  useEffect(() => {
    if (!province) {
      setDistricts([])
      return
    }

    let current = true
    setLoading(true)

    districtsForProvince(province)
      .then((result) => {
        if (current) setDistricts(result)
      })
      .finally(() => {
        if (current) setLoading(false)
      })

    // Guards against a slow first province resolving after a second was
    // picked, which would leave the wrong districts on screen.
    return () => {
      current = false
    }
  }, [province])

  const subDistricts =
    districts.find((entry) => entry.name === district)?.subDistricts ?? []

  // Thai names are what gets stored and what a courier reads; the English
  // ones are only ever a label for someone reading the form in English.
  const label = (thai: string, english: string) =>
    locale === 'th' ? thai : english

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t('delivery.province')}>
        <select
          name={names.province}
          value={province}
          onChange={(event) => {
            setProvince(event.target.value)
            // A district in Chiang Mai means nothing once the province is
            // Phuket.
            setDistrict('')
            setSubDistrict('')
            setPostalCode('')
          }}
          className={SELECT_CLASS}
        >
          <option value="">{t('delivery.chooseProvince')}</option>
          {PROVINCES.map((entry) => (
            <option key={entry.code} value={entry.th}>
              {label(entry.th, entry.en)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('delivery.district')}>
        <select
          name={names.district}
          value={district}
          disabled={!province || loading}
          onChange={(event) => {
            setDistrict(event.target.value)
            setSubDistrict('')
            setPostalCode('')
          }}
          className={SELECT_CLASS}
        >
          {/* Says what is blocking it rather than sitting empty and disabled
              with no explanation. */}
          <option value="">
            {loading
              ? t('common.loading')
              : province
                ? t('delivery.chooseDistrict')
                : t('delivery.provinceFirst')}
          </option>
          {districts.map((entry) => (
            <option key={entry.name} value={entry.name}>
              {label(entry.name, entry.nameEn)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('delivery.subdistrict')}>
        <select
          name={names.subdistrict}
          value={subDistrict}
          disabled={!district}
          onChange={(event) => {
            const next = event.target.value
            setSubDistrict(next)
            const match = subDistricts.find((entry) => entry.name === next)
            if (match) setPostalCode(match.postalCode)
          }}
          className={SELECT_CLASS}
        >
          <option value="">
            {district
              ? t('delivery.chooseSubdistrict')
              : t('delivery.districtFirst')}
          </option>
          {subDistricts.map((entry) => (
            <option key={entry.name} value={entry.name}>
              {label(entry.name, entry.nameEn)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('delivery.postalCode')}>
        {/* Filled from the sub-district but still editable: a handful of
            sub-districts carry two postcodes and the data keeps one, so
            typing over it has to stay possible. */}
        <Input
          name={names.postalCode}
          inputMode="numeric"
          pattern="\d{5}"
          maxLength={5}
          value={postalCode}
          onChange={(event) => setPostalCode(event.target.value)}
        />
      </Field>
    </div>
  )
}
