/**
 * A chart in its own card, to the design's spec.
 *
 * The header pairs a black title with the period's total in crimson, aligned
 * on their baselines. That total is what lets the card be read without
 * studying the plot — and it is why the axis does not need a value on every
 * point.
 *
 * The plot slot is a fixed 260px, matching the design.
 */
export function ChartCard({
  title,
  total,
  children,
  empty,
}: {
  title: string
  total?: string
  children: React.ReactNode
  /** Shown instead of the plot when there is nothing to draw. */
  empty?: string
}) {
  return (
    <div className="flex flex-col gap-[16px] rounded-[9px] bg-white p-[24px]">
      <div className="flex items-baseline justify-between gap-[12px]">
        <h2 className="text-[20px] font-bold text-black">{title}</h2>
        {total ? (
          <p className="text-[20px] font-bold text-[#cb2957]">{total}</p>
        ) : null}
      </div>

      {empty ? (
        <p className="flex h-[260px] items-center justify-center text-center text-[15px] text-black/50">
          {empty}
        </p>
      ) : (
        children
      )}
    </div>
  )
}
