import React from 'react'

import Container from '@/components/ui/container'
import getBillboard from '@/actions/get-bilboard';
import getBillboards from '@/actions/get-billboards';
import getProducts from '@/actions/get-products';
import Billboard from '@/components/billboard'
import ProductList from '@/components/product-list';

export const revalidate = 0;

const HomePage = async () => {
  const products = await getProducts({isFeatured: true})
  // Use the configured hero billboard, falling back to the store's first one.
  const homeBillboardId = process.env.NEXT_PUBLIC_HOME_BILLBOARD_ID
  const billboard = (homeBillboardId && await getBillboard(homeBillboardId))
    || (await getBillboards())[0]
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
