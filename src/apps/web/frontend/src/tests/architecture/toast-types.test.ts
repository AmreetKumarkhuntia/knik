import { describe, expect, expectTypeOf, it } from 'vitest'
import type { ToastState, ToastType } from '$types/components'
import type { DemoToast } from '$types/demo-session'
import type { FeedbackState } from '$types/stores/feedback'

const typeSources = import.meta.glob<string>('../../types/**/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('toast types', () => {
  it('declares the toast severity union once', () => {
    const declarations = Object.entries(typeSources).flatMap(([file, code]) =>
      (code.match(/(['"])success\1\s*\|\s*(['"])error\2\s*\|\s*(['"])info\3/g) ?? []).map(() =>
        file.replace('../../', 'src/')
      )
    )
    expect(declarations).toEqual(['src/types/components/feedback.ts'])
  })

  it('shares one toast record between the store and the toast views', () => {
    expectTypeOf<DemoToast['type']>().toEqualTypeOf<ToastType>()
    expectTypeOf<ToastState>().toEqualTypeOf<DemoToast>()
    expectTypeOf<FeedbackState['toasts']>().toEqualTypeOf<DemoToast[]>()
  })
})
