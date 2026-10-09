import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StoresProvider } from '$stores'
import { useSettingsStore } from '$stores/settings'
import { useChatView, useWorkflowBuilderView } from '$stores/views'
import { effectiveModelId } from '$lib/stores/catalogs/selectors'
import { createDemoSeed } from '$lib/stores/demo'

const models = [
  { id: 'first', label: 'First' },
  { id: 'second', label: 'Second' },
]

describe('effective chat model', () => {
  it('keeps a catalog selection, defaults an empty one and drops an unknown one', () => {
    expect(effectiveModelId('second', models)).toBe('second')
    expect(effectiveModelId('', models)).toBe('first')
    expect(effectiveModelId('retired', models)).toBeUndefined()
    expect(effectiveModelId('', [])).toBeUndefined()
  })

  it('gives the chat composer and a new builder AI node the same model', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StoresProvider source={{ models, settings: { model: 'second' } }}>{children}</StoresProvider>
    )
    const { result } = renderHook(
      () => ({
        chat: useChatView(),
        builder: useWorkflowBuilderView(undefined),
        updateSettings: useSettingsStore(state => state.updateSettings),
      }),
      { wrapper }
    )
    const builderModel = () => {
      act(() => result.current.builder.addNode('AIExecutionNode', { x: 0, y: 0 }))
      return result.current.builder.selectedNode?.data.model
    }
    for (const [selected, expected] of [
      ['second', 'second'],
      ['', 'first'],
      ['retired', ''],
    ]) {
      act(() => result.current.updateSettings({ model: selected }))
      expect(result.current.chat.model).toBe(expected)
      expect(builderModel()).toBe(expected)
    }
  })

  it('rejects a supplied source whose settings select a model missing from the catalog', () => {
    expect(() => createDemoSeed({ models, settings: { model: 'retired' } })).toThrow(
      'missing model'
    )
    expect(() => createDemoSeed({ models, settings: { model: 'second' } })).not.toThrow()
  })
})
