import { notFound } from "next/navigation"
import getCategory from "@/actions/get-category"
import getProducts from "@/actions/get-products"
import getSizes from "@/actions/get-sizes"
import getColors from "@/actions/get-colors"
import Container from "@/components/ui/container"
import Billboard from "@/components/billboard"
import Filter from "./components/filter"
import NoResults from "@/components/ui/no-results"
import ProductCard from "@/components/ui/product-card"
import MobileFilters from "./components/mobile-filters"
import PriceFilter from "@/components/price-filter"


export const revalidate = 0
interface CategoryProps {
    params : {
        categoryId : string
    },
    searchParams : {
        colorId : string
        sizeId : string
        minPrice : string
        maxPrice : string
    }
}

const CattegoryPage : React.FC<CategoryProps> = async ({
    params,
    searchParams
}) => {
 

    const products = await getProducts({
        categoryId : params.categoryId,
        colorId : searchParams.colorId,
        sizeId : searchParams.sizeId,
        minPrice : searchParams.minPrice,
        maxPrice : searchParams.maxPrice
    })

    const sizes = await getSizes();
    const colors = await getColors();
    const category = await getCategory(params.categoryId);

    if (!category) {
        notFound()
    }

    return (

        <div className="bg-white">
            <Container>
                {category.billboard && (
                <Billboard
                data={category.billboard}
                />
                )}
                <div className="px-4 sm:px-6 lg:px-8 pb-24">
                    <div className="lg:grid lg:grid-cols-5 lg:gap-x-8">
                        <MobileFilters sizes={sizes} colors={colors}/>
                        <div className="hidden lg:block">
                            <Filter
                                valueKey="sizeId"
                                name="Sizes"
                                data={sizes}
                            />
                            <Filter
                                valueKey="colorId"
                                name="Colors"
                                data={colors}
                            />
                            <PriceFilter />
                        </div>
                        <div className="mt-6 lg:col-span-4 lg:mt-0">
                            {products.length === 0 && <NoResults/>}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3" >
                                {products.map((product) => (
                                    <ProductCard 
                                        key={product.id} 
                                        data={product} 
                                    />
                                ))}
                                
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
  )
}

export default CattegoryPage