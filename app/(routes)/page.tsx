import React from 'react'

import Container from '@/components/ui/container'
import getBillboard from '@/actions/get-bilboard';
import getProducts from '@/actions/get-products';
import Billboard from '@/components/billboard'
import ProductList from '@/components/product-list';

export const revalidate = 0;

const HomePage = async () => {
  const products = await getProducts({isFeatured: true})
  const billboard = await getBillboard("73c8f9b2-0a38-4dda-939e-032cc74d58e9")
  return (
    <Container>
      <div className='space-y-10 pb-8'>
        {billboard?.imageUrl && <Billboard data={billboard}/>}
        <div className='flex flex-col gap-y-8 px-4 sm:px-6 lg:px-8' >
        <ProductList items={products} title="Featured Products" />

      </div>
      </div>
      
    </Container>
  )
}

export default HomePage
