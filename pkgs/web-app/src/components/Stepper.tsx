"use client"

export type StepperProps = {
  step: number
  onPrevClick?: () => void
  onNextClick?: () => void
}

/**
 * Stepper: ステッパーコンポーネント
 * @param param0
 * @returns
 */
export default function Stepper({ step, onPrevClick, onNextClick }: StepperProps) {
  return (
    <div className="stepper">
      {onPrevClick !== undefined ? (
        <button
          className="cursor-pointer text-blue-500 text-lg border-none bg-transparent w-16 mx-4 flex justify-center items-center hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!onPrevClick}
          onClick={onPrevClick || undefined}
          type="button"
          aria-label="Go to previous step"
        >
          <span className="inline-flex self-center flex-shrink-0 mr-2">
            <svg viewBox="0 0 24 24" focusable="false" className="w-4 h-4">
              <path
                fill="currentColor"
                d="M16.2425 6.34317L14.8283 4.92896L7.75732 12L14.8284 19.0711L16.2426 17.6569L10.5857 12L16.2425 6.34317Z"
              ></path>
            </svg>
          </span>
          Prev
        </button>
      ) : (
        <div className="w-16 mx-4"></div>
      )}

      <p className="text-base">{step.toString()}/3</p>

      {onNextClick !== undefined ? (
        <button
          className="cursor-pointer text-blue-500 text-lg border-none bg-transparent w-16 mx-4 flex justify-center items-center hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!onNextClick}
          onClick={onNextClick || undefined}
          type="button"
          aria-label="Go to next step"
        >
          Next
          <span className="inline-flex self-center flex-shrink-0 ml-2">
            <svg viewBox="0 0 24 24" focusable="false" className="w-4 h-4">
              <path
                fill="currentColor"
                d="M10.5859 6.34317L12.0001 4.92896L19.0712 12L12.0001 19.0711L10.5859 17.6569L16.2428 12L10.5859 6.34317Z"
              ></path>
            </svg>
          </span>
        </button>
      ) : (
        <div className="w-16 mx-4" />
      )}
    </div>
  )
}
