'use client'

import PreviewModal from '@/components/preview-model'
import React, { useEffect, useState } from 'react'

const ModelProviders = () => {

    const [isMounted, setIsMounted] = useState(false)
    
    useEffect(() => {
        setIsMounted(true);
    }, [])
    
    if(!isMounted) return null;

  return (
    <>

        <PreviewModal />
    
    </>
  )
}

export default ModelProviders