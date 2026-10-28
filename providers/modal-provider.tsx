'use client'

import PreviewModal from '@/components/preview-model'
import useHydrated from '@/hooks/use-hydrated'

// Modals are driven by client-only state; mount them after hydration so the
// server and first client render agree.
const ModelProviders = () => {
    const hydrated = useHydrated()
    if (!hydrated) return null

  return (
    <>
        <PreviewModal />
    </>
  )
}

export default ModelProviders
